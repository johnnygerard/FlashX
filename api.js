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
router.route('/fset').post((req, res, next) => {
    if (typeof req.body.name !== 'string') {
        handleValidationFailure(req, res);
        return;
    }

    users.updateOne({ _id: req.user }, {
        $push: { fsets: new FlashcardSet(req.body.name) }
    }).then(() => res.status(NO_CONTENT).end()).catch(next);

    // Rename a flashcard set
}).patch((req, res, next) => {
    const { name, index } = req.body;

    if (typeof name !== 'string' ||
        typeof index !== 'number') {
        handleValidationFailure(req, res);
        return;
    }

    users.updateOne({ _id: req.user }, {
        $set: { [`fsets.${index}.name`]: name }
    }).then(() => res.status(NO_CONTENT).end()).catch(next);

    // Delete a flashcard set
}).delete((req, res, next) => {
    const { index } = req.body;

    if (typeof index !== 'number') {
        handleValidationFailure(req, res);
        return;
    }

    users.updateOne({ _id: req.user }, [{
        $set: {
            fsets: {
                $concatArrays: [
                    { $slice: ['$fsets', index] },
                    {
                        $slice: [
                            '$fsets',
                            { $subtract: [index + 1, { $size: '$fsets' }] }
                        ]
                    }
                ]
            }
        }
    }]).then(() => res.status(NO_CONTENT).end()).catch(next);
});

export default router;
