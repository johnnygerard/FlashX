export { router as default };
import express from 'express';
import { FORBIDDEN, NO_CONTENT, OK } from './httpStatusCodes.js';
import { sessions, users } from './mongoDB.js';
import { handleValidationFailure, passwordIsValid } from './validation.js';
import { hash } from './password.js';

const router = express.Router();

const getFSetNames = async _id => {
    const options = { projection: { _id: 0, fsets: '$fsets.name' } };
    const doc = await users.findOne({ _id }, options);

    if (doc) return doc.fsets;
    throw Error(`Document not found (_id: ${_id})`);
};

class Flashcard {
    constructor(
        public question: string,
        public answer: string
    ) { }
}

class FlashcardSet {
    flashcards: Flashcard[] = [];

    constructor(public name: string) { }
}

// Create a flashcard set
router.route('/fset').post(async (req, res, next) => {
    const { name } = req.body;

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
    const { question, answer } = req.body;
    const fset = +req.body.fset;

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
    const fset = +req.body.fset;
    const index = +req.body.index;
    const flashcards = `fsets.${fset}.flashcards`;
    const filter = { _id: req.user };

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
    // Update flashcard
}).patch(async (req, res, next) => {
    const { question, answer } = req.body;
    const fset = +req.body.fset;
    const index = +req.body.index;

    try {
        const key = `fsets.${fset}.flashcards.${index}`;
        const doc = {};

        if (question && answer) doc[key] = { question, answer };
        else if (question) doc[key + '.question'] = question;
        else doc[key + '.answer'] = answer;

        await users.updateOne({ _id: req.user }, { $set: doc });

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
