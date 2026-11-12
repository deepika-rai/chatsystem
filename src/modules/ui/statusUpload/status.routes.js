import express from "express";
import StatusController from "./status.controller.js";
import {authMiddleware} from "../../../middlewares/authMiddleware.js"
const statusRouter = express.Router();
const statusController = new StatusController();

statusRouter.get("/list", authMiddleware, statusController.list);

statusRouter.post(
  '/update-status/:id',
  authMiddleware,
  (req, res) => statusController.updateStatus(req, res)
);

statusRouter.post(
  '/create',
  authMiddleware,
  (req, res) => statusController.create(req, res)
);


statusRouter.get(
  '/delete/:id',
  authMiddleware,
  (req, res) => statusController.delete(req, res)
);
statusRouter.get(
  '/add',
  authMiddleware,
  (req, res) => statusController.add(req, res)
);
statusRouter.get(
  '/edit/:id',
  authMiddleware,
  (req, res) => statusController.edit(req, res)
);
statusRouter.post(
  '/update',
  authMiddleware,
  (req, res) => statusController.update(req, res)
);

export default statusRouter;
