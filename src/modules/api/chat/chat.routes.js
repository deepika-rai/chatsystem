import express from "express";
import ChatController from "./chat.controller.js";
import { validate } from "../../../middlewares/validate.js";
import { authenticateJWT } from "../../../middlewares/auth.middleware.js";
import * as chatValidation from "./chat.validation.js";

const chatApiRouter = express.Router();
const chatController = new ChatController();

chatApiRouter.post(
  "/create",
  authenticateJWT,
  validate(chatValidation.createChat),
  (req, res) => chatController.createChat(req, res)
);

chatApiRouter.get(
  "/list",
  authenticateJWT,
  (req, res) => chatController.getMyChats(req, res)
);

chatApiRouter.get(
  "/details/:id",
  authenticateJWT,
  (req, res) => chatController.getChat(req, res)
);

chatApiRouter.post(
  "/update/:id",
  authenticateJWT,
  validate(chatValidation.updateChat),
  (req, res) => chatController.updateChat(req, res)
);

chatApiRouter.post(
  "/add-members/:id",
  authenticateJWT,
  validate(chatValidation.addMembers),
  (req, res) => chatController.addMembers(req, res)
);

chatApiRouter.post(
  "/remove-member/:id/:userId",
  authenticateJWT,
  (req, res) => chatController.removeMember(req, res)
);

chatApiRouter.post(
  "/mark-read/:id",
  authenticateJWT,
  (req, res) => chatController.markRead(req, res)
);

// Firestore messages
chatApiRouter.post(
  "/messages/:chatId",
  authenticateJWT,
  (req, res) => chatController.sendMessage(req, res)
);

chatApiRouter.get(
  "/messages/:chatId",
  authenticateJWT,
  (req, res) => chatController.getMessages(req, res)
);

chatApiRouter.get(
  "/last-seen/:chatId",
  authenticateJWT,
  (req, res) => chatController.getLastSeen(req, res)
);

// POST /api/chat/:chatId/message/:messageId/read  — mark message read
chatApiRouter.post(
  "/:chatId/message/:messageId/read",
  authenticateJWT,
  (req, res) => chatController.markMessageRead(req, res)
);

// GET /api/chat/:chatId/message/:messageId/read  — get read receipts for a message
chatApiRouter.get(
  "/:chatId/message/:messageId/read",
  authenticateJWT,
  (req, res) => chatController.getMessageReadReceipts(req, res)
);

// POST /api/chat/lastseen/:chatId  — explicit lastSeen update
chatApiRouter.post(
  "/lastseen/:chatId",
  authenticateJWT,
  (req, res) => chatController.postLastSeen(req, res)
);

export default chatApiRouter;