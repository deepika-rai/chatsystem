import express from "express";
import ChatController from "./chat.controller.js";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";

const chatRouter = express.Router();
const chatController = new ChatController();

chatRouter.get("/", authMiddleware, (req, res) => chatController.index(req, res));
chatRouter.get("/index", authMiddleware, (req, res) => chatController.index(req, res));
chatRouter.get("/users/search", authMiddleware, (req, res) => chatController.searchUsers(req, res));
chatRouter.post("/start", authMiddleware, (req, res) => chatController.startDirect(req, res));
chatRouter.get("/:id", authMiddleware, (req, res) => chatController.message(req, res));

export default chatRouter;