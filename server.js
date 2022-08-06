import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
import { env } from 'process';
import client, { sessionStore, SESSION_LIFETIME } from './MongoClient.js';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import ejs from 'ejs';

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

const validateUsername = username => typeof username === 'string' &&
    /^[!-~]{1,128}$/.test(username);

const validatePassword = password => typeof password === 'string' &&
    /^(?=.*?\d)(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[!-/:-@[-`{-~])[!-~]{11,128}$/
        .test(password);

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        await client.connect();
        const users = client.db('user').collection('users');
        const user = await users.findOne({ _id: username });

        if (!user) {
            console.log('user non existent');
            done(null, false);
            return;
        }

        const derivedKey = await new Promise((resolve, reject) => {
            crypto.pbkdf2(password, user.salt.buffer, ITERATIONS,
                KEY_BYTE_LENGTH, KDF, (err, derivedKey) => {
                    if (err) reject(err); else resolve(derivedKey);
                });
        });

        if (derivedKey.equals(user.derivedKey.buffer)) {
            console.log('good password');
            done(null, user);
        } else {
            console.log('wrong password');
            done(null, false);
        }
    } catch (err) {
        done(err);
    } finally {
        await client.close();
    }
}));

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
        secure: env.NODE_ENV === 'production' ? true : false,
        sameSite: 'lax'
    },
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    secret: env.SESSION_SECRET
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    done(null, id);
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
    if (!validateUsername(req.body.username) || !validatePassword(req.body.password)) {
        console.error('Server side validation failure');
        console.error(req.body);
        res.sendStatus(400);
        return;
    }

    try {
        await client.connect();
        const users = client.db('user').collection('users');

        if (await users.findOne({ _id: req.body.username })) {
            // username not available
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
            _id: req.body.username,
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
    successMessage: true,
    failureRedirect: unauthenticatedRedirect,
    failureMessage: true
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
