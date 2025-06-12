import mongoose from "mongoose";
import { Router } from "express";
import {
    createTransaction,
    getTransactionHistory,
} from "../controllers/transaction.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.post("/create",verifyJWT ,  createTransaction);
router.get("/history",verifyJWT ,  getTransactionHistory);

export default router;