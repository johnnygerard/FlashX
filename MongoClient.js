import { MongoClient, ServerApiVersion } from 'mongodb';
import { env } from 'process';
import session from 'express-session';
import connectMongodbSession from 'connect-mongodb-session';

if (env.NODE_ENV !== 'production')
    await import('dotenv/config');

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

const MongoDBStore = connectMongodbSession(session);
const SESSION_LIFETIME = 1000 * 60 * 60 * 24 * 10; // 10 days in ms
const sessionStore = new MongoDBStore({
    uri: URI,
    databaseName: 'user',
    expires: SESSION_LIFETIME
}, err => {
    if (err) {
        console.error('Failed to connect to session database.');
        console.error(err);
    }
});

sessionStore.on('error', console.error);

export { sessionStore, SESSION_LIFETIME };
export default client;
