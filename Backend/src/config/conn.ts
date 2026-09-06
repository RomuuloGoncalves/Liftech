import mongoose from "mongoose";
import { env } from "./env.js";
    
const MONGOURI = env.mongo_uri

if(MONGOURI){
    mongoose.connect(MONGOURI)
}

export const conn = {
    mongoose: mongoose
} 