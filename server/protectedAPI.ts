export { router as default };
import express from 'express';
import { FORBIDDEN, NO_CONTENT, OK } from './httpStatusCodes.js';
import { sessions, users } from './mongoDB.js';
import { handleValidationFailure, passwordIsValid } from './validation.js';
import { hash } from './password.js';

const router = express.Router();

const getFSetNames = async (_id: Express.User) => {
    const options = { projection: { _id: 0, fsets: '$fsets.name' } };
    const doc = await users.findOne({ _id }, options);

    if (doc) return doc.fsets;
    throw Error(`Document not found (_id: ${_id})`);
};

// Create a flashcard collection
router.route('/fset').post(async (req, res, next) => {
    const { name } = req.body;

    try {
        await users.updateOne({ _id: req.user }, {
            $set: { ['fsets.' + name]: {} }
        });
        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
    // Rename a flashcard collection
}).patch(async (req, res, next) => {
    const { name, newName } = req.body;

    try {
        await users.updateOne({ _id: req.user }, {
            $rename: { ['fsets.' + name]: 'fsets.' + newName }
        });
        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
    // Delete a flashcard collection
}).delete(async (req, res, next) => {
    const { name } = req.body;

    try {
        await users.updateOne({ _id: req.user }, {
            $unset: { ['fsets.' + name]: 0 }
        });

        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
});

// Create flashcard
router.route('/flashcard').post(async (req, res, next) => {
    const { fset, question, answer } = req.body;

    try {
        await users.updateOne({ _id: req.user }, {
            $set: { [`fsets.${fset}.${question}`]: answer }
        });

        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }

    // Delete flashcard
}).delete(async (req, res, next) => {
    const { fset, question } = req.body;

    try {
        await users.updateOne({ _id: req.user }, {
            $unset: { [`fsets.${fset}.${question}`]: 0 }
        });

        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
    // Update flashcard
}).patch(async (req, res, next) => {
    const { fset, question, newQuestion, answer } = req.body;
    const prefix = `fsets.${fset}.`;
    const filter = { _id: req.user };

    try {
        if (answer)
            await users.updateOne(filter, {
                $set: { [prefix + question]: answer }
            });

        if (newQuestion)
            await users.updateOne(filter, {
                $rename: { [prefix + question]: prefix + newQuestion }
            });

        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
});

// Update password
router.put('/password', async (req, res, next) => {
    const { currentPwd, newPwd } = req.body;

    if (typeof currentPwd !== 'string'
        || currentPwd === newPwd
        || !passwordIsValid(newPwd)) {
        handleValidationFailure(req, res);
        return;
    }

    try {
        const user = await users.findOne({ _id: req.user });

        if (user === null)
            throw Error(`User "${req.user}" not found`);

        let derivedKey = await hash(currentPwd, user.salt.buffer);

        if (!derivedKey.equals(user.derivedKey.buffer)) {
            res.status(FORBIDDEN).send('Wrong password');
            return;
        }

        derivedKey = await hash(newPwd, user.salt.buffer);
        await users.updateOne({ _id: req.user }, { $set: { derivedKey } });
        res.status(OK).send('Password successfully updated!');
    } catch (err) {
        next(err);
    }
});

router.delete('/logOut', (req, res, next) => {
    req.session.destroy(err => {
        if (err) next(err); else res.status(NO_CONTENT).end();
    });
});

router.delete('/account', async (req, res, next) => {
    try {
        await users.deleteOne({ _id: req.user });
        await sessions.deleteMany({
            'session.passport.user': req.user
        });
        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
});

router.get('/account', async (req, res, next) => {
    const projection = { name: 1, _id: 0 };

    try {
        const doc = await users.findOne({ _id: req.user }, { projection });

        if (doc === null)
            throw Error('User not found');

        res.send(doc.name);
    } catch (err) {
        next(err);
    }
});

router.get('/training', async (req, res, next) => {
    try {
        res.send(await getFSetNames(req.user!));
    } catch (err) {
        next(err);
    }
});

router.get('/collections', async (req, res, next) => {
    try {
        res.send(await getFSetNames(req.user!));
    } catch (err) {
        next(err);
    }
});

router.get('/collections/:index', async (req, res, next) => {
    const index = +req.params.index;

    const pipeline = [
        { $match: { _id: req.user } },
        { $project: { _id: 0, fsets: 1 } },
        { $project: { fset: { $arrayElemAt: ['$fsets', index] } } }
    ];

    try {
        const doc = await users.aggregate(pipeline).next();

        if (doc === null)
            throw Error(`Document not found. Pipeline:\n${pipeline}`);
        res.send(doc.fset);
    } catch (err) {
        next(err);
    }
});
