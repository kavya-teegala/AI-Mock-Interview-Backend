import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/authValidator.js";

const router = express.Router();

// Register route
router.post("/register", validate(registerSchema), registerUser);

// Login route
router.post("/login", validate(loginSchema), loginUser);

export default router;