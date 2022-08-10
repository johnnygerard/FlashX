import express from 'express';
import { client } from './mongoDB.js';

const router = express.Router();

class FlashcardSet {
    flashcards = [];

    constructor(name) {
        this.name = name;
    }
}

// Create one flashcard set
router.post('/fset', async (req, res, next) => {
    try {
        await client.connect();
        const users = client.db('user').collection('users');

        await users.updateOne({ _id: req.user }, {
            $push: { fsets: new FlashcardSet(req.query.name) }
        });
        res.status(204).end();
    } catch (err) {
        next(err);
    } finally {
        await client.close();
    }
});

// Rename a flashcard set
router.patch('/fset', async (req, res, next) => {
    try {
        await client.connect();
        const users = client.db('user').collection('users');

        await users.updateOne({ _id: req.user }, {
            $set: { [`fsets.${req.query.index}.name`]: req.query.name }
        });
        res.status(204).end();
    } catch (err) {
        next(err);
    } finally {
        await client.close();
    }
});

export default router;
