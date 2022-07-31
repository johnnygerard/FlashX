import express from 'express';
import crypto from 'crypto';
import { env } from 'process';
import client from './MongoClient.js';
import passport from 'passport';
import LocalStrategy from 'passport-local';

const app = express();
const PORT = env.PORT || 3000;
const HOST = 'localhost';

// values based on NIST recommendations
const ITERATIONS = 1000;
const KDF = 'sha3-256'; // key derivation function
const KEY_BYTE_LENGTH = 14;
const SALT_BYTE_LENGTH = 16;

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        await client.connect();
        const users = client.db('user').collection('users');
        const user = await users.findOne({ _id: username });

        if (!user) {
            console.log('user non existent');
            done(null, false);
            return;
        }

        const derivedKey = await new Promise((resolve, reject) => {
            crypto.pbkdf2(password, user.salt, ITERATIONS, KEY_BYTE_LENGTH,
                KDF, (err, derivedKey) => {
                    if (err) reject(err); else resolve(derivedKey);
                });
        });

        if (derivedKey.equals(user.derivedKey)) {
            console.log('good password');
            done(null, user);
        } else {
            console.log('wrong password');
            done(null, false);
        }
    } catch (err) {
        done(err);
    } finally {
        await client.close();
    }
}));

app.set('view engine', 'ejs');
app.locals = { validationMessage: undefined };
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res, next) => {
    res.render('index');
});

app.get('/register', (req, res, next) => {
    res.render('register');
});

app.get('/login', (req, res, next) => {
    res.render('login');
});

const validateUsername = username => typeof username === 'string' &&
    /^[!-~]{1,128}$/.test(username);

const validatePassword = password => typeof password === 'string' &&
    /^(?=.*?\d)(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[!-/:-@[-`{-~])[!-~]{11,128}$/
        .test(password);

app.post('/register', async (req, res, next) => {
    if (!validateUsername(req.body.username)) {
        res.render('register', { validationMessage: 'Invalid username' });
        return;
    }

    if (!validatePassword(req.body.password)) {
        res.render('register', { validationMessage: 'Invalid password' });
        return;
    }

    try {
        await client.connect();
        const users = client.db('user').collection('users');

        if (await users.findOne({ _id: req.body.username })) {
            res.render('register', {
                validationMessage: `Sorry, the username "${req.body.username}"\
 is not available.`
            });
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
