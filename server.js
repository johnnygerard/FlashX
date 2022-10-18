import { env, cwd } from 'node:process';
import { inspect } from 'node:util';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import protectedAPI from './protectedAPI.js';
import publicAPI from './publicAPI.js';
import { sessionStore, SESSION_LIFETIME } from './mongoDB.js';
import { verify } from './password.js';
import {
    FORBIDDEN,
    INTERNAL_SERVER_ERROR,
} from './httpStatusCodes.js';

const app = express();
const PORT = env.PORT || 3000;
const STATIC_DIR = 'client/dist/flash-x';
const PRODUCTION = env.NODE_ENV === 'production';

passport.use(new LocalStrategy(verify));
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((id, done) => done(null, id));

if (PRODUCTION) {
    app.set('trust proxy', 1);
    app.use((req, res, next) => {
        if (req.secure) next();
        else {
            console.error('Unencrypted request forwarded by proxy:');
            console.error(req.method, req.originalUrl);
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
app.enable('case sensitive routing');
app.enable('strict routing');
app.disable('x-powered-by');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    cookie: {
        // using default domain
        path: '/',
        maxAge: SESSION_LIFETIME,
        httpOnly: true,
        secure: PRODUCTION,
        sameSite: 'lax'
    },
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    secret: env.SESSION_SECRET
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', publicAPI);
app.use('/api', (req, res, next) => {
    if (req.isAuthenticated()) next(); else res.status(FORBIDDEN).end();
}, protectedAPI);

app.use(express.static(STATIC_DIR));

app.get(/^/, (req, res, next) => {
    res.sendFile(STATIC_DIR + '/index.html', { root: cwd() });
});

app.use((err, req, res, next) => {
    console.error(inspect(err, { depth: 100 }));
    res.status(INTERNAL_SERVER_ERROR).end();
});

if (PRODUCTION) {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
} else {
    const HOST = 'localhost';

    app.listen(PORT, HOST, () => {
        console.log(`Server listening at http://${HOST}:${PORT}`);
    });
}
