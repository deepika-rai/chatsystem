import express from "express";
import SettingController from "./setting.controller.js";
import { authenticateJWT } from "../../../middlewares/auth.middleware.js";

const settingRouter = express.Router();
const settingController = new SettingController();



settingRouter.get("/greeting-list", authenticateJWT, (req, res) => {
  settingController.greetingList(req, res)
});




export default settingRouter;
