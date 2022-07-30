import { MongoClient, ServerApiVersion } from 'mongodb';
import { env } from 'process';

if (env.NODE_ENV !== 'production')
    await import('dotenv/config');

const DB_USER = encodeURIComponent(env.DB_USER);
const DB_PASSWORD = encodeURIComponent(env.DB_PASSWORD);

// defaults: admin database, port 27017
const AUTHORITY = `${DB_USER}:${DB_PASSWORD}@${env.DB_HOST}`;
const URI = `mongodb+srv://${AUTHORITY}/?retryWrites=true&w=majority`;

export default new MongoClient(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});
