import { env } from 'process';
import { minify } from 'html-minifier-terser';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import flash from 'flash';
import ejs from 'ejs';
import api from './api.js';
import { users, sessionStore, SESSION_LIFETIME } from './mongoDB.js';
import { hash, makeSalt, verify } from './password.js';
import {
    handleValidationFailure,
    usernameIsValid,
    passwordIsValid
} from './validation.js';
import {
    FORBIDDEN,
    NO_CONTENT,
    SEE_OTHER
} from './httpStatusCodes.js';

if (env.NODE_ENV !== 'production')
    await import('dotenv/config');

const nativeRender = express.response.render;

express.response.render = function (view, locals, cb) {
    const defaultCallback = async (err, html) => {
        if (err) this.req.next(err);
        else this.send(await minify(html, minifierOptions));
    };

    nativeRender.call(this, view, locals, cb || defaultCallback);
};

const app = express();
const PORT = env.PORT || 3000;
const authenticatedRedirect = '/collections';
const unauthenticatedRedirect = '/';
const registrationFailureRedirect = '/register';

const minifierOptions = {
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

const getFSetNames = async _id => {
    const options = { projection: { _id: 0, fsets: '$fsets.name' } };

    const doc = await users.findOne({ _id }, options);
    return doc.fsets;
};

passport.use(new LocalStrategy(verify));
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((id, done) => done(null, id));

if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
    app.use((req, res, next) => {
        if (req.secure) next();
        else {
            console.error('unencrypted request forwarded by proxy');
            res.status(FORBIDDEN).end('HTTPS required');
        }
    });
}

app.set('query parser', query => {
    const parser = new URLSearchParams(query);
    const params = {};

    for (const [key, value] of parser.entries())
        params[key] = value;

    return params;
});
app.set('view engine', 'ejs');
app.enable('case sensitive routing');
app.enable('strict routing');
app.disable('x-powered-by');
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

app.get('/cookie-notice', (req, res, next) => {
    res.render('cookieNotice', { authenticated: req.isAuthenticated() });
});

app.get('/about', (req, res, next) => {
    res.render('about', {
        authenticated: req.isAuthenticated(),
        repo: 'https://github.com/johnnygerard/FlashX'
    });
});

app.get('/register', (req, res, next) => {
    res.render('register', { authenticated: req.isAuthenticated() });
});

app.get('/account', isAuthenticated, (req, res, next) => {
    res.render('account', {
        user: req.user,
        authenticated: true
    });
});

app.get('/training', isAuthenticated, async (req, res, next) => {
    try {
        const fsets = await getFSetNames(req.user);

        res.render('training', { authenticated: true, fsets });
    } catch (err) {
        next(err);
    }
});

app.get('/collections', isAuthenticated, async (req, res, next) => {
    try {
        const fsets = await getFSetNames(req.user);

        res.render('collections', {
            user: req.user,
            authenticated: true,
            fsets
        });
    } catch (err) {
        next(err);
    }
});

app.get('/collections/:index', isAuthenticated, async (req, res, next) => {
    const index = +req.params.index;

    if (!Number.isInteger(index) || index < 0) {
        handleValidationFailure(req, res);
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

    if (!usernameIsValid(_id) || !passwordIsValid(req.body.password)) {
        handleValidationFailure(req, res);
        return;
    }

    try {
        if (await users.findOne({ _id })) {
            req.flash('Username unavailable.');
            res.redirect(SEE_OTHER, registrationFailureRedirect);
            return;
        }

        const salt = await makeSalt();
        const derivedKey = await hash(req.body.password, salt);
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

app.delete('/account', async (req, res, next) => {
    if (req.isAuthenticated()) {
        try {
            await users.deleteOne({ _id: req.user });
            res.status(NO_CONTENT).end();
        } catch (err) {
            next(err);
        }
    } else res.status(FORBIDDEN).end();
})

if (env.NODE_ENV === 'production') {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
} else {
    const HOST = 'localhost';

    app.listen(PORT, HOST, () => {
        console.log(`Server listening at http://${HOST}:${PORT}`);
    });
}
