import express from "express";
import StaffController from "./staff.controller.js";
import { validate } from "../../../middlewares/validate.js";
import { authenticateJWT } from "../../../middlewares/auth.middleware.js";
import { staffSchema } from "./staff.validation.js";

const staffApiRouter = express.Router();
const staffController = new StaffController();

staffApiRouter.post("/add", authenticateJWT, validate(staffSchema), (req, res) => {
  staffController.add(req, res)
});

staffApiRouter.get("/list", authenticateJWT, (req, res) => {
  staffController.list(req, res)
});

staffApiRouter.delete("/delete/:id", authenticateJWT, (req, res) => {
  staffController.delete(req, res)
});

staffApiRouter.put(
  "/update/:id",
  authenticateJWT,
  validate(staffSchema),
  (req, res) => {
    staffController.update(req, res);
  }
);

export default staffApiRouter;
