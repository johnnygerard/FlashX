import { MongoClient, ServerApiVersion } from 'mongodb';
import { getVar } from './env.js';

const DB_SCHEMA_PWD = encodeURIComponent(getVar('DB_SCHEMA_PWD'));

// defaults: admin database, port 27017
const AUTHORITY = `schema:${DB_SCHEMA_PWD}@${getVar('DB_HOST')}`;
const URI = `mongodb+srv://${AUTHORITY}/?retryWrites=true&w=majority`;

const userSchema = {
    title: 'User',
    description: 'User account data',
    required: [
        '_id', 'salt', 'derivedKey', 'fsets', 'registrationDate'
    ],
    additionalProperties: false,
    properties: {
        _id: {
            bsonType: 'string',
            pattern: '^[!-~]{1,128}$'
        },
        salt: { bsonType: 'binData' },
        derivedKey: { bsonType: 'binData' },
        registrationDate: { bsonType: 'date' },
        fsets: {
            description: 'List of flashcard collections',
            bsonType: 'array',
            maxItems: 128,
            items: {
                bsonType: 'object',
                additionalProperties: false,
                required: ['flashcards', 'name'],
                properties: {
                    flashcards: {
                        description: 'Flashcards (keyed by question)',
                        bsonType: 'object',
                        maxProperties: 1024,
                        additionalProperties: false,
                        patternProperties: {
                            '^[^]{1,256}$': {
                                description: 'answer',
                                bsonType: 'string',
                                minLength: 1,
                                maxLength: 256
                            }
                        }
                    },
                    name: {
                        description: 'Flashcard collection name',
                        bsonType: 'string',
                        minLength: 1,
                        maxLength: 256
                    }
                }
            }
        }
    }
};

let client;

try {
    client = await MongoClient.connect(URI, { serverApi: ServerApiVersion.v1 });

    const userDB = client.db('user');
    const filter = { $nor: [{ $jsonSchema: userSchema }] };

    const cursor = userDB.collection('users').find(filter);
    let count = 0;

    for await (const doc of cursor) {
        count++;
        console.log(doc);
    }

    if (count) console.log('Number of invalid documents: ' + count);
    else {
        const result = await userDB.command({
            collMod: 'users',
            validator: { $jsonSchema: userSchema }
        });

        console.log(result);
    }
} catch (e) {
    console.error(e);
} finally {
    if (client) await client.close();
}
