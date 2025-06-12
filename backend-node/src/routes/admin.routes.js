import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getStatsByRegion,
    getStatsByUser,
    getAllUsers,
    getAllTransactions,
    registerEmployee,
    ToggleBlockUser,
} from "../controllers/admin.controller.js";

const router = Router();
router.get("/stats/region", verifyJWT, getStatsByRegion);
router.get("/stats/user/:id", verifyJWT, getStatsByUser);
router.get("/users", verifyJWT, getAllUsers);
router.get("/transactions", verifyJWT, getAllTransactions);
router.post("/register-employee", verifyJWT, registerEmployee);
router.post("/toggle-block-user/:id", verifyJWT, ToggleBlockUser);

export default router;