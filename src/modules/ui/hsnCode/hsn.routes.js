import express from "express";
import HsnController from "./hsn.controller.js";
import {authMiddleware} from "../../../middlewares/authMiddleware.js"
const hsnRouter = express.Router();
const hsnController = new HsnController();

hsnRouter.get("/list", authMiddleware, hsnController.list);
hsnRouter.post("/ajax-list", authMiddleware, hsnController.ajaxList);

hsnRouter.post(
  '/update-status/:id',
  authMiddleware,
  (req, res) => hsnController.updateStatus(req, res)
);

hsnRouter.post(
  '/create',
  authMiddleware,
  (req, res) => hsnController.create(req, res)
);

hsnRouter.get(
  '/delete/:id',
  authMiddleware,
  (req, res) => hsnController.delete(req, res)
);

hsnRouter.get(
  '/add',
  authMiddleware,
  (req, res) => hsnController.add(req, res)
);

hsnRouter.get(
  '/edit/:id',
  authMiddleware,
  (req, res) => hsnController.edit(req, res)
);

hsnRouter.post(
  '/update',
  authMiddleware,
  (req, res) => hsnController.update(req, res)
);

hsnRouter.get("/search", hsnController.search);
hsnRouter.get("/import-hsn", authMiddleware, hsnController.importXlsxToDB);

export default hsnRouter;
