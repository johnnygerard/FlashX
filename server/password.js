export { makeSalt, verify, hash };
import crypto from 'node:crypto';
import { users } from './mongoDB.js';

// values based on NIST recommendations
const ITERATIONS = 1000;
const KEY_BYTE_LENGTH = 14;
const KDF = 'sha3-256'; // key derivation function
const SALT_BYTE_LENGTH = 16;

const hash = (password, salt) => new Promise((resolve, reject) =>
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_BYTE_LENGTH, KDF,
        (err, derivedKey) => {
            if (err) reject(err); else resolve(derivedKey);
        })
);

const verify = async (username, password, done) => {
    try {
        const user = await users.findOne({ _id: username });

        if (!user) {
            done(null, false, { message: 'Nonexistent user' });
            return;
        }

        const derivedKey = await hash(password, user.salt.buffer);

        if (derivedKey.equals(user.derivedKey.buffer)) done(null, user);
        else done(null, false, { message: 'Wrong password' });
    } catch (err) {
        done(err);
    }
};

const makeSalt = () => new Promise((resolve, reject) => {
    crypto.randomBytes(SALT_BYTE_LENGTH, (err, salt) => {
        if (err) reject(err); else resolve(salt);
    });
});
