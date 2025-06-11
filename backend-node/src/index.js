import dotenv from 'dotenv'
import connectDb from "./db/index.js";
import {app} from './app.js';
import express from 'express'
dotenv.config({
    path: './.env'
});
connectDb()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port : ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("Mongo Connection Error :: Error :: " , error);
})