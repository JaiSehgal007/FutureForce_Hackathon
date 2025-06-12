import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}));

app.use(express.json({limit : "16kb"}))
app.use(urlencoded({limit : "16kb" , extended : true}))
app.use(express.static("public"));
app.use(cookieParser())

app.use("/test" , (req , res) => {
    return res.status(200).json({
        message : "Hello World"
    })
})

import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import transactionRoutes from "./routes/transactions.routes.js";

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/employee", employeeRoutes);
app.use("/api/v1/transaction", transactionRoutes);


export {app};