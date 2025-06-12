import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addMoneyToWallet
} from "../controllers/employee.controller.js";

const router = Router();
router.post("/add-money", verifyJWT, addMoneyToWallet);

export default router;