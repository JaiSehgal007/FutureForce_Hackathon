import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import {app} from "../app.js";
const connectDb = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_DB_URL}/${DB_NAME}`);
        app.on("error" , (error) => {
            console.log("Mongo Connection Error :: Error :: " , error)
        })
        console.log("Connected to DB");
    } catch (error) {
        console.log("Mongo Connection Error :: Error :: " , error)
        process.exit(1)
    }
} 
export default connectDb;