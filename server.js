import express from 'express';
import crypto from 'crypto';
import { env } from 'process';
import { MongoClient, ServerApiVersion } from 'mongodb';

if (env.NODE_ENV !== 'production')
    await import('dotenv/config');

const app = express();
const PORT = env.PORT || 3000;
const HOST = 'localhost';

const DB_USER = encodeURIComponent(env.DB_USER);
const DB_PASSWORD = encodeURIComponent(env.DB_PASSWORD);

// defaults: admin database, port 27017
const AUTHORITY = `${DB_USER}:${DB_PASSWORD}@${env.DB_HOST}`;
const URI = `mongodb+srv://${AUTHORITY}/?retryWrites=true&w=majority`;

const client = new MongoClient(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res, next) => {
    res.render('index', { title: 'Homepage' });
});

// values based on NIST recommendations
const ITERATIONS = 1000;
const KDF = 'sha3-256'; // key derivation function
const KEY_BYTE_LENGTH = 14;
const SALT_BYTE_LENGTH = 16;

app.post('/register', async (req, res, next) => {
    try {
        await client.connect();
        const users = client.db('user').collection('users');

        if (await users.findOne({ _id: req.body.username })) {
            console.log(`${req.body.username} not available`)
            res.redirect('/');
            return;
        }

        const salt = await new Promise((resolve, reject) => {
            crypto.randomBytes(SALT_BYTE_LENGTH, (err, salt) => {
                if (err) reject(err);
                else resolve(salt);
            });
        });

        const derivedKey = await new Promise((resolve, reject) => {
            crypto.pbkdf2(req.body.password, salt, ITERATIONS, KEY_BYTE_LENGTH,
                KDF, (err, derivedKey) => {
                    if (err) reject(err);
                    else resolve(derivedKey);
                });
        });

        await users.insertOne({
            _id: req.body.username,
            salt,
            derivedKey
        });
        res.redirect('/');
    } catch (err) {
        next(err);
    } finally {
        await client.close();
    }
});

app.listen(PORT, HOST, () => {
    console.log(`Server listening at: http://${HOST}:${PORT}`);
});
