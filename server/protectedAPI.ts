export { router as default };
import express from 'express';
import { FORBIDDEN, NO_CONTENT, OK } from './httpStatusCodes.js';
import { fsets, sessions, users } from './mongoDB.js';
import { handleValidationFailure, passwordIsValid } from './validation.js';
import { hash } from './password.js';

const router = express.Router();
const FCARD_PATH = 'flashcards.';

// Create a flashcard collection
router.route('/fset').post(async (req, res, next) => {
    const { name } = req.body;

    try {
        await fsets.insertOne({ userID: req.user, name, flashcards: {} });
        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
    // Rename a flashcard collection
}).patch(async (req, res, next) => {
    const { name, newName } = req.body;

    try {
        await fsets.updateOne({ userID: req.user, name }, {
            $set: { name: newName }
        });
        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
    // Delete a flashcard collection
}).delete(async (req, res, next) => {
    const { name } = req.body;

    try {
        await fsets.deleteOne({ userID: req.user, name });
        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
});

// Create flashcard
router.route('/flashcard').post(async (req, res, next) => {
    const { fset, question, answer } = req.body;

    try {
        await fsets.updateOne({ userID: req.user, name: fset }, {
            $set: { [FCARD_PATH + question]: answer }
        });

        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }

    // Delete flashcard
}).delete(async (req, res, next) => {
    const { fset, question } = req.body;

    try {
        await fsets.updateOne({ userID: req.user, name: fset }, {
            $unset: { [FCARD_PATH + question]: 0 }
        });

        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
    // Update flashcard
}).patch(async (req, res, next) => {
    const { fset, question, newQuestion, answer } = req.body;
    const filter = { userID: req.user, name: fset };
    const key = FCARD_PATH + question;

    try {
        if (newQuestion) {
            const newKey = FCARD_PATH + newQuestion;

            if (answer)
                await fsets.updateOne(filter, {
                    $set: { [newKey]: answer },
                    $unset: { [key]: 0 }
                });
            else await fsets.updateOne(filter, { $rename: { [key]: newKey } });
        }
        else await fsets.updateOne(filter, { $set: { [key]: answer } });

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

router.get(['/collections', '/training'], async (req, res, next) => {
    try {
        const doc = await fsets.aggregate([
            { $match: { userID: req.user } },
            {
                $group: {
                    _id: null,
                    names: { $push: '$name' }
                }
            }
        ]).next();

        if (doc === null)
            throw Error('Document not found');
        res.send(doc.names);
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
