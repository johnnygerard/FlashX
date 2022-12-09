// This file is a MongoDB Shell script (mongosh).
use('user');

db.createCollection('users', {
    validator: {
        $jsonSchema: {
            title: 'User',
            description: 'User account data',
            required: [
                '_id', 'name', 'salt', 'derivedKey', 'registrationDate'
            ],
            additionalProperties: false,
            properties: {
                _id: { bsonType: 'objectId' },
                name: {
                    bsonType: 'string',
                    pattern: '^[!-~]{1,128}$'
                },
                salt: { bsonType: 'binData' },
                derivedKey: { bsonType: 'binData' },
                registrationDate: { bsonType: 'date' }
            }
        }
    }
});

db.users.createIndex({ name: 1 }, { unique: true });

db.createCollection('fsets', {
    validator: {
        $jsonSchema: {
            title: 'Flashcard collection',
            required: ['_id', 'userID', 'name', 'flashcards'],
            additionalProperties: false,
            properties: {
                _id: { bsonType: 'objectId' },
                userID: { bsonType: 'objectId' },
                name: {
                    bsonType: 'string',
                    minLength: 1,
                    maxLength: 256
                },
                flashcards: {
                    description: 'Each flashcard is keyed by question.',
                    bsonType: 'object',
                    maxProperties: 1024,
                    additionalProperties: false,
                    patternProperties: {
                        '^(.|\n){1,256}$': {
                            title: 'Answer',
                            bsonType: 'string',
                            minLength: 1,
                            maxLength: 256
                        }
                    }
                }
            }
        }
    }
});

db.fsets.createIndex({ userID: 1, name: 1 }, { unique: true });
