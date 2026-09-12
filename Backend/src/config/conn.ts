import mongoose from "mongoose";
import { env } from "./env.js";
    
const MONGOURI = env.mongo_uri
const DBNAME = env.db_name

if(MONGOURI && DBNAME){
    await mongoose.connect(MONGOURI, {
      dbName: DBNAME,
      authSource: "admin",
      serverSelectionTimeoutMS: 5000,
    });
}

export const conn = {
    mongoose: mongoose
} 
