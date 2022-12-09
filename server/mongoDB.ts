export { fsets, users, sessions, sessionStore, SESSION_LIFETIME };
import { MongoClient, ServerApiVersion } from 'mongodb';
import session from 'express-session';
import connectMongodbSession from 'connect-mongodb-session';
import { getVar } from './env.js';

const DB_PASSWORD = encodeURIComponent(getVar('DB_PASSWORD'));

// defaults: admin database, port 27017
const AUTHORITY = `express:${DB_PASSWORD}@${getVar('DB_HOST')}`;
const URI = `mongodb+srv://${AUTHORITY}/?retryWrites=true&w=majority`;

const client = await MongoClient.connect(URI, {
    serverApi: ServerApiVersion.v1
});

const userDB = client.db('user');
const users = userDB.collection('users');
const fsets = userDB.collection('fsets');
const sessions = userDB.collection('sessions');
const MongoDBStore = connectMongodbSession(session);
const SESSION_LIFETIME = 1000 * 60 * 60 * 24 * 10; // 10 days in ms
const sessionStore = new MongoDBStore({
    uri: URI,
    collection: 'sessions',
    databaseName: 'user',
    expires: SESSION_LIFETIME
}, err => {
    if (err) {
        console.error('Failed to connect to session database.');
        console.error(err);
    }
});

sessionStore.on('error', console.error);
