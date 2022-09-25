export { router as default };
import express from 'express';
import { NO_CONTENT } from './httpStatusCodes.js';
import { users } from './mongoDB.js';
import { hash, makeSalt } from './password.js';
import {
    handleValidationFailure,
    usernameIsValid,
    passwordIsValid
} from './validation.js';

const router = express.Router();

router.post('/register', async (req, res, next) => {
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

router.post('/logIn', (req, res, next) => {
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

router.get('/authStatus', (req, res, next) => {
    res.send(req.isAuthenticated());
});
