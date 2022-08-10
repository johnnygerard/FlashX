import express from 'express';
import { client } from './mongoDB.js';

const router = express.Router();

// Create one flashcard set
router.post('/fset', async (req, res, next) => {
    try {
        await client.connect();
        const users = client.db('user').collection('users');

        await users.updateOne({ _id: req.user }, {
            $push: {
                fsets: {
                    flashcards: [],
                    name: req.query.name
                }
            }
        });
        res.status(204).end();
    } catch (err) {
        next(err);
    } finally {
        await client.close();
    }
});

export default router;
