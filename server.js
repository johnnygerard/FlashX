import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
import { env } from 'process';
import { users, sessionStore, SESSION_LIFETIME } from './mongoDB.js';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import ejs from 'ejs';
import flash from 'flash';
import api from './api.js';
import { minify } from 'html-minifier-terser';
import { BAD_REQUEST, FORBIDDEN, NO_CONTENT, SEE_OTHER }
    from './httpStatusCodes.js';

if (env.NODE_ENV !== 'production')
    await import('dotenv/config');

const nativeRender = express.response.render;

express.response.render = function (view, locals, cb) {
    const defaultCallback = async (err, html) => {
        if (err) this.req.next(err);
        else this.send(await minify(html, minifyOptions));
    };

    nativeRender.call(this, view, locals, cb || defaultCallback);
};

const app = express();
const PORT = env.PORT || 3000;
const HOST = 'localhost';
const authenticatedRedirect = '/manager';
const unauthenticatedRedirect = '/';
const registrationFailureRedirect = '/';

// values based on NIST recommendations
const ITERATIONS = 1000;
const KDF = 'sha3-256'; // key derivation function
const KEY_BYTE_LENGTH = 14;
const SALT_BYTE_LENGTH = 16;

const minifyOptions = {
    collapseInlineTagWhitespace: true,
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeOptionalTags: true,
};

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) next();
    else res.redirect(SEE_OTHER, unauthenticatedRedirect);
};

const usernameRegExp = /^[!-~]{1,128}$/;
const passwordRegExp = RegExp([
    /^(?=[^]*?\d)/,
    /(?=[^]*?[a-z])/,
    /(?=[^]*?[A-Z])/,
    /(?=[^]*?[!-/:-@[-`{-~])/,
    /[!-~]{11,128}$/,
].reduce((previous, current) => previous + current.source, ''));

const usernameIsValid = username =>
    typeof username === 'string' && usernameRegExp.test(username);

const passwordIsValid = password =>
    typeof password === 'string' && passwordRegExp.test(password);

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
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
    }
}));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    done(null, id);
});

app.set('query parser', query => {
    const parser = new URLSearchParams(query);
    const params = {};

    for (const [key, value] of parser.entries())
        params[key] = value;

    return params;
});
app.set('view engine', 'ejs');
const viewOptions = { root: 'views/partials' };
app.engine('ejs', (path, data, cb) => {
    ejs.renderFile(path, data, viewOptions, cb);
});

app.use(express.json());
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
app.use('/api', (req, res, next) => {
    if (req.isAuthenticated()) next();
    else res.status(FORBIDDEN).end();
}, api);

app.use(express.static('public'));

app.get('/', (req, res, next) => {
    res.render('index', { authenticated: req.isAuthenticated() });
});

app.get('/about', (req, res, next) => {
    res.render('about', {
        authenticated: req.isAuthenticated(),
        repo: 'https://github.com/johnnygerard/FlashX'
    });
});

app.get('/account', isAuthenticated, (req, res, next) => {
    res.render('account', {
        user: req.user,
        authenticated: true
    });
});

const getFSetNames = async _id => {
    const options = { projection: { _id: 0, fsets: '$fsets.name' } };

    const doc = await users.findOne({ _id }, options);
    return doc.fsets;
};

app.get('/training', isAuthenticated, async (req, res, next) => {
    try {
        const fsets = await getFSetNames(req.user);

        res.render('training', { authenticated: true, fsets });
    } catch (err) {
        next(err);
    }
});

app.get('/manager', isAuthenticated, async (req, res, next) => {
    try {
        const fsets = await getFSetNames(req.user);

        res.render('flashcardManager', {
            user: req.user,
            authenticated: true,
            fsets
        });
    } catch (err) {
        next(err);
    }
});

app.get('/manager/:index', isAuthenticated, async (req, res, next) => {
    const index = +req.params.index;

    if (!Number.isInteger(index) || index < 0) {
        console.error('Server side validation failure');
        console.error(req.method, req.originalUrl);
        console.error(req.params);
        res.status(BAD_REQUEST).end();
        return;
    }

    const pipeline = [
        { $match: { _id: req.user } },
        { $project: { _id: 0, fsets: 1 } },
        { $project: { fset: { $arrayElemAt: ['$fsets', index] } } }
    ];

    try {
        const doc = await users.aggregate(pipeline).next();

        res.render('flashcards', {
            user: req.user,
            authenticated: true,
            fset: doc.fset
        });
    } catch (err) {
        next(err);
    }
});

app.post('/register', async (req, res, next) => {
    const _id = req.body.username;

    if (!usernameIsValid(_id) ||
        !passwordIsValid(req.body.password)) {
        console.error('Server side validation failure');
        console.error(req.body);
        res.sendStatus(BAD_REQUEST);
        return;
    }

    try {
        if (await users.findOne({ _id })) {
            req.flash(`This username (${_id}) is not available.`);
            res.redirect(SEE_OTHER, registrationFailureRedirect);
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
            fsets: [],
            registrationDate: new Date
        };

        await users.insertOne(user);
        req.logIn(user, err => {
            if (err) next(err);
            else res.redirect(SEE_OTHER, authenticatedRedirect);
        });
    } catch (err) {
        next(err);
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
            if (err) next(err); else res.status(NO_CONTENT).end();
        });
    else
        res.status(NO_CONTENT).end();
});

app.listen(PORT, HOST, () => {
    console.log(`Server listening at: http://${HOST}:${PORT}`);
});
