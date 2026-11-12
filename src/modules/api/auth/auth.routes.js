import express from "express";
import AuthController from "./auth.controller.js";
import { validate } from "../../../middlewares/validate.js";
import { registerSchema, loginSchema, verifySchema } from "./auth.validation.js";

const authRouter = express.Router();
const authController = new AuthController();
authRouter.post("/register", validate(registerSchema), authController.userRegistration);
authRouter.post("/get-otp", validate(loginSchema), authController.getOtp);
authRouter.post("/verify-otp", validate(verifySchema), authController.verifyOtp);
authRouter.post("/login", validate(verifySchema), authController.login);
authRouter.post("/resend-otp", validate(loginSchema), authController.resendOtp);

export default authRouter;