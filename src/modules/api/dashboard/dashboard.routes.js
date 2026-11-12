import express from "express";
import DashboardController from "./dashboard.controller.js";
import { authenticateJWT } from "../../../middlewares/auth.middleware.js";

const dashboardRouter = express.Router();
const dashboardController = new DashboardController();

dashboardRouter.get("/user-details", authenticateJWT, (req, res) => {
  dashboardController.userDetails(req, res)
});

dashboardRouter.get("/list", authenticateJWT, (req, res) => {
  dashboardController.list(req, res)
});

dashboardRouter.post("/greeting-update", authenticateJWT, (req, res) => {
  dashboardController.update(req, res)
});

export default dashboardRouter;
