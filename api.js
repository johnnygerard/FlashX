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
    if (typeof req.body.name !== 'string') {
        handleValidationFailure(req, res);
        return;
    }

    try {
        await users.updateOne({ _id: req.user }, {
            $push: { fsets: new FlashcardSet(req.body.name) }
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

export default router;
