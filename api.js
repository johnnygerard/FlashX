import express from 'express';
import { BAD_REQUEST, NO_CONTENT } from './httpStatusCodes.js';
import { users } from './mongoDB.js';

const router = express.Router();
const handleValidationFailure = (req, res) => {
    console.error('Server side validation failure');
    console.error(req.method, req.originalUrl);
    console.error(req.body);
    res.status(BAD_REQUEST).end();
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
    const { name, index } = req.body;

    if (typeof name !== 'string' ||
        typeof index !== 'number') {
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
    const { index } = req.body;
    const filter = { _id: req.user };

    if (typeof index !== 'number') {
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

    if (typeof fset !== 'number' ||
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

    if (typeof fset !== 'number' ||
        typeof index !== 'number') {
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
    // Read flashcards
}).get(async (req, res, next) => {
    const { index } = req.body;

    if (typeof index !== 'number') {
        handleValidationFailure(req, res);
        return;
    }

    const pipeline = [
        { $match: { _id: req.user } },
        { $project: { _id: 0, fsets: 1 } },
        { $project: { fset: { $arrayElemAt: ['$fsets', index] } } },
        { $project: { flashcards: '$fset.flashcards'  } }
    ];

    try {
        const doc = await users.aggregate(pipeline).next();

        res.send(doc.flashcards);
    } catch (err) {
        next(err);
    }
});

router.patch('/flashcard/question', async (req, res, next) => {
    const { fset, index, question } = req.body;

    if (typeof fset !== 'number' ||
        typeof index !== 'number' ||
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

router.patch('/flashcard/answer', async (req, res, next) => {
    const { fset, index, answer } = req.body;

    if (typeof fset !== 'number' ||
        typeof index !== 'number' ||
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
})

export default router;
