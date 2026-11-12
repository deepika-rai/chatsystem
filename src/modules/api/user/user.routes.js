import express from "express";
import UserController from "./user.controller.js";
import { validate } from "../../../middlewares/validate.js";
import { authenticateJWT } from "../../../middlewares/auth.middleware.js";
import uploadFile from "../../../middlewares/uploadFile.js";

const userApiRouter = express.Router();
const userController = new UserController();

userApiRouter.post("/update-profile", authenticateJWT, (req, res) => {
  userController.updateProfile(req, res)
  // return res.json("kajal")
});

userApiRouter.post(
  "/update-profile-image",
  authenticateJWT,
  uploadFile("userimages").single("profile"),
  (req, res) => userController.updateProfileImage(req, res)
);

userApiRouter.get(
  '/profile-details',
  authenticateJWT,
  (req, res) => userController.profileDetails(req, res)
);

export default userApiRouter;
