import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
import { env } from 'process';
import { client, sessionStore, SESSION_LIFETIME } from './mongoDB.js';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import ejs from 'ejs';
import flash from 'flash';

if (env.NODE_ENV !== 'production')
    await import('dotenv/config');

const app = express();
const PORT = env.PORT || 3000;
const HOST = 'localhost';
const authenticatedRedirect = '/account';
const unauthenticatedRedirect = '/';
const registrationFailureRedirect = '/';

// values based on NIST recommendations
const ITERATIONS = 1000;
const KDF = 'sha3-256'; // key derivation function
const KEY_BYTE_LENGTH = 14;
const SALT_BYTE_LENGTH = 16;

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) next();
    else res.redirect(unauthenticatedRedirect);
};

const usernameRegExp = /^[!-~]{1,128}$/;

/*  /^
    (?=.*?\d)
    (?=.*?[a-z])
    (?=.*?[A-Z])
    (?=.*?[!-/:-@[-`{-~])
    [!-~]{11,128}
    $/                              */
const passwordRegExp =
    /^(?=.*?\d)(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[!-/:-@[-`{-~])[!-~]{11,128}$/;

const usernameIsValid = username =>
    typeof username === 'string' && usernameRegExp.test(username);

const passwordIsValid = password =>
    typeof password === 'string' && passwordRegExp.test(password);

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        await client.connect();
        const users = client.db('user').collection('users');
        const user = await users.findOne({ _id: username });

        if (!user) {
            done(null, false, {
                message: `This username (${username}) does not exist.`
            });
            return;
        }

        const derivedKey = await new Promise((resolve, reject) => {
            crypto.pbkdf2(password, user.salt.buffer, ITERATIONS,
                KEY_BYTE_LENGTH, KDF, (err, derivedKey) => {
                    if (err) reject(err); else resolve(derivedKey);
                });
        });

        if (derivedKey.equals(user.derivedKey.buffer)) {
            done(null, user);
        } else {
            done(null, false, { message: 'Your password is invalid.' });
        }
    } catch (err) {
        done(err);
    } finally {
        await client.close();
    }
}));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    done(null, id);
});

app.set('view engine', 'ejs');
const viewOptions = { root: 'views/partials' };
app.engine('ejs', (path, data, cb) => {
    ejs.renderFile(path, data, viewOptions, cb);
});

app.use(express.urlencoded({ extended: false }));
app.use(session({
    cookie: {
        // using default domain
        path: '/',
        maxAge: SESSION_LIFETIME,
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax'
    },
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    secret: env.SESSION_SECRET
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash(), (req, res, next) => {
    if (req.session.flash.length)
        req.session.flash = [];
    next();
});

app.get('/', (req, res, next) => {
    res.render('index', { authenticated: req.isAuthenticated() });
});

app.get('/account', isAuthenticated, (req, res, next) => {
    res.render('account', {
        user: req.user,
        authenticated: true
    });
});

app.post('/register', async (req, res, next) => {
    const _id = req.body.username;

    if (!usernameIsValid(_id) ||
        !passwordIsValid(req.body.password)) {
        console.error('Server side validation failure');
        console.error(req.body);
        res.sendStatus(400);
        return;
    }

    try {
        await client.connect();
        const users = client.db('user').collection('users');

        if (await users.findOne({ _id })) {
            req.flash(`This username (${_id}) is not available.`);
            res.redirect(303, registrationFailureRedirect);
            return;
        }

        const salt = await new Promise((resolve, reject) => {
            crypto.randomBytes(SALT_BYTE_LENGTH, (err, salt) => {
                if (err) reject(err); else resolve(salt);
            });
        });

        const derivedKey = await new Promise((resolve, reject) => {
            crypto.pbkdf2(req.body.password, salt, ITERATIONS, KEY_BYTE_LENGTH,
                KDF, (err, derivedKey) => {
                    if (err) reject(err); else resolve(derivedKey);
                });
        });

        const user = {
            _id,
            salt,
            derivedKey,
            registrationDate: new Date
        };

        await users.insertOne(user);
        req.logIn(user, err => {
            if (err) next(err); else res.redirect(303, authenticatedRedirect);
        });
    } catch (err) {
        next(err);
    } finally {
        await client.close();
    }
});

app.post('/logIn', passport.authenticate('local', {
    successRedirect: authenticatedRedirect,
    successFlash: true,
    failureRedirect: unauthenticatedRedirect,
    failureFlash: true
}));

app.delete('/logOut', (req, res, next) => {
    if (req.isAuthenticated())
        req.session.destroy(err => {
            if (err) next(err); else res.status(204).end();
        });
    else
        res.status(204).end();
});

app.listen(PORT, HOST, () => {
    console.log(`Server listening at: http://${HOST}:${PORT}`);
});
