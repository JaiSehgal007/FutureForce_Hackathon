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
router.get("/stats/region", getStatsByRegion);
router.get("/stats/user/:id", getStatsByUser);
router.post("/register-employee", registerEmployee);
router.get("/users", getAllUsers);
router.get("/transactions", getAllTransactions);
router.post("/toggle-block-user/:id", ToggleBlockUser);

export default router;