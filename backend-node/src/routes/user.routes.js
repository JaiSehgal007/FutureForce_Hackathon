import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { registerUser,
    login,
    logoutUser,
    getCurrentUser,
    addSavedContact
 } from "../controllers/user.controller.js";
const router = Router();

router.post("/register" , registerUser)
router.post("/login", login);
router.get("/current", verifyJWT, getCurrentUser);
router.post("/logout", verifyJWT, logoutUser);
router.post("/add-contact", verifyJWT, addSavedContact);
export default router;