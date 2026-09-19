import 'dotenv/config';

export const env = {
    mongo_uri: process.env.MONGODB_URI,
    db_name: process.env.MONGODB_NAME
}