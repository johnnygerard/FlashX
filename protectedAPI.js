export { router as default };
import express from 'express';
import { FORBIDDEN, NO_CONTENT, OK } from './httpStatusCodes.js';
import { users } from './mongoDB.js';
import { handleValidationFailure, passwordIsValid } from './validation.js';
import { hash } from './password.js';

const router = express.Router();

const getFSetNames = async _id => {
    const options = { projection: { _id: 0, fsets: '$fsets.name' } };

    const doc = await users.findOne({ _id }, options);
    return doc.fsets;
};

class Flashcard {
    constructor(question, answer) {
        this.question = question;
        this.answer = answer;
    }
}

class FlashcardSet {
    flashcards = [];

    constructor(name) {
        this.name = name;
    }
}

// Create a flashcard set
router.route('/fset').post(async (req, res, next) => {
    const { name } = req.body;

    if (typeof name !== 'string') {
        handleValidationFailure(req, res);
        return;
    }

    try {
        await users.updateOne({ _id: req.user }, {
            $push: { fsets: new FlashcardSet(name) }
        });
        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
    // Rename a flashcard set
}).patch(async (req, res, next) => {
    const { name } = req.body;
    const index = +req.body.index;

    if (typeof name !== 'string' ||
        !Number.isInteger(index) || index < 0) {
        handleValidationFailure(req, res);
        return;
    }

    try {
        await users.updateOne({ _id: req.user }, {
            $set: { [`fsets.${index}.name`]: name }
        });
        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
    // Delete a flashcard set
}).delete(async (req, res, next) => {
    const index = +req.body.index;
    const filter = { _id: req.user };

    if (!Number.isInteger(index) || index < 0) {
        handleValidationFailure(req, res);
        return;
    }

    try {
        await users.updateOne(filter, { $unset: { [`fsets.${index}`]: 0 } });
        await users.updateOne(filter, { $pull: { fsets: null } });

        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
});

// Create flashcard
router.route('/flashcard').post(async (req, res, next) => {
    const { fset, question, answer } = req.body;

    if (!Number.isInteger(fset) || fset < 0 ||
        typeof question !== 'string' ||
        typeof answer !== 'string') {
        handleValidationFailure(req, res);
        return;
    }

    try {
        await users.updateOne({ _id: req.user }, {
            $push: {
                [`fsets.${fset}.flashcards`]: new Flashcard(question, answer)
            }
        });

        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }

    // Delete flashcard
}).delete(async (req, res, next) => {
    const { fset, index } = req.body;
    const flashcards = `fsets.${fset}.flashcards`;
    const filter = { _id: req.user };

    if (!Number.isInteger(fset) || fset < 0 ||
        !Number.isInteger(index) || index < 0) {
        handleValidationFailure(req, res);
        return;
    }

    try {
        await users.updateOne(filter, {
            $unset: { [`${flashcards}.${index}`]: 0 }
        });

        await users.updateOne(filter, {
            $pull: { [flashcards]: null }
        });

        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
});

// Update question
router.patch('/flashcard/question', async (req, res, next) => {
    const { fset, index, question } = req.body;

    if (!Number.isInteger(fset) || fset < 0 ||
        !Number.isInteger(index) || index < 0 ||
        typeof question !== 'string') {
        handleValidationFailure(req, res);
        return;
    }

    try {
        await users.updateOne({ _id: req.user }, {
            $set: {
                [`fsets.${fset}.flashcards.${index}.question`]: question,
            }
        });

        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
});

// Update answer
router.patch('/flashcard/answer', async (req, res, next) => {
    const { fset, index, answer } = req.body;

    if (!Number.isInteger(fset) || fset < 0 ||
        !Number.isInteger(index) || index < 0 ||
        typeof answer !== 'string') {
        handleValidationFailure(req, res);
        return;
    }

    try {
        await users.updateOne({ _id: req.user }, {
            $set: {
                [`fsets.${fset}.flashcards.${index}.answer`]: answer,
            }
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
        let derivedKey = await hash(currentPwd, user.salt.buffer);

        if (!derivedKey.equals(user.derivedKey.buffer)) {
            res.status(FORBIDDEN).send('Wrong password.');
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
        res.status(NO_CONTENT).end();
    } catch (err) {
        next(err);
    }
});

router.get('/account', (req, res, next) => {
    res.send(req.user);
});

router.get('/training', async (req, res, next) => {
    try {
        res.send(await getFSetNames(req.user));
    } catch (err) {
        next(err);
    }
});

router.get('/collections', async (req, res, next) => {
    try {
        res.send(await getFSetNames(req.user));
    } catch (err) {
        next(err);
    }
});

router.get('/collections/:index', async (req, res, next) => {
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

        res.send(doc.fset);
    } catch (err) {
        next(err);
    }
});
