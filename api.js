import express from 'express';
import { client } from './mongoDB.js';

const router = express.Router();

class FlashcardSet {
    flashcards = [];

    constructor(name) {
        this.name = name;
    }
}

class Flashcard {
    constructor(question, answer) {
        this.question = question;
        this.answer = answer;
    }
}

router.route('/fset').post(async (req, res, next) => {
    // Create a flashcard set
    try {
        const users = client.db('user').collection('users');

        await users.updateOne({ _id: req.user }, {
            $push: { fsets: new FlashcardSet(req.query.name) }
        });
        res.status(204).end();
    } catch (err) {
        next(err);
    }
}).patch(async (req, res, next) => {
    // Rename a flashcard set
    try {
        const users = client.db('user').collection('users');

        await users.updateOne({ _id: req.user }, {
            $set: { [`fsets.${req.query.index}.name`]: req.query.name }
        });
        res.status(204).end();
    } catch (err) {
        next(err);
    }
}).delete(async (req, res, next) => {
    // Delete a flashcard set
    try {
        const users = client.db('user').collection('users');
        const index = +req.query.index;

        await users.updateOne({ _id: req.user }, [{
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
        }]);
        res.status(204).end();
    } catch (err) {
        next(err);
    }
});

export default router;
