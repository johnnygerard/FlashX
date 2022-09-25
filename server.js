import { env, cwd } from 'node:process';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
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
    INTERNAL_SERVER_ERROR,
    NO_CONTENT,
} from './httpStatusCodes.js';

const app = express();
const PORT = env.PORT || 3000;
const STATIC_DIR = 'client/dist/flash-x';

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

app.post('/api/register', async (req, res, next) => {
    const _id = req.body.username;

    if (!usernameIsValid(_id) || !passwordIsValid(req.body.password)) {
        handleValidationFailure(req, res);
        return;
    }

    try {
        if (await users.findOne({ _id })) {
            res.status(FORBIDDEN).send('Username unavailable.');
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
            if (err) next(err); else res.status(NO_CONTENT).end();
        });
    } catch (err) {
        next(err);
    }
});

app.post('/api/logIn', (req, res, next) => {
    passport.authenticate('local', (err, user, info, status) => {
        if (err) {
            next(err); return;
        }
        if (user)
            req.logIn(user, err => {
                if (err) next(err); else res.status(NO_CONTENT).end();
            });
        else res.status(FORBIDDEN).send(info.message);
    })(req, res, next);
});

app.use('/api', (req, res, next) => {
    if (req.isAuthenticated()) next(); else res.status(FORBIDDEN).end();
}, api);

app.use(express.static(STATIC_DIR));

app.get(/^/, (req, res, next) => {
    res.sendFile(STATIC_DIR + '/index.html', { root: cwd() });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(INTERNAL_SERVER_ERROR).end();
});

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
