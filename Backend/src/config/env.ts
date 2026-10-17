import 'dotenv/config';

export const env = {
    mongo_uri: process.env.MONGODB_URI,
    db_name: process.env.MONGODB_NAME,
    jwt_secret: process.env.JWT_SECRET,
    jwt_expires_in: process.env.JWT_EXPIRES_IN || '8h'
}
