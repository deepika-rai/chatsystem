import express from "express";
import ApiController from "./api.controller.js";
import {authMiddleware} from "../../../middlewares/authMiddleware.js"
const apiRouter = express.Router();
const apiController = new ApiController();

apiRouter.get("/list", authMiddleware, apiController.list);

export default apiRouter;
