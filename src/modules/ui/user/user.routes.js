import express from "express";
import UserController from "../user/user.controller.js";
import { validate } from "../../../middlewares/validate.js";
import { registerSchema, loginSchema, verifySchema, loginAdminSchema } from "./user.validation.js";
import { authenticateJWT } from "../../../middlewares/auth.middleware.js"
import { authMiddleware } from "../../../middlewares/authMiddleware.js"
import { requireRole } from "../../../middlewares/roleMiddleware.js"
import uploadFile from "../../../middlewares/uploadFile.js";
import svgCaptcha from 'svg-captcha';
import session from "express-session";

const userRouter = express.Router();
const userController = new UserController();

userRouter.get("/captcha", (req, res) => {
  const captcha = svgCaptcha.create({
    size: 5,
    // No crossing lines: they reduce readability for low-vision users.
    noise: 0,
    color: false,
    // Supplying a background makes svg-captcha override `color: false` and
    // generate multicolored characters. Keep the SVG transparent instead.
    background: ''
  });

  req.session.captcha = captcha.text;
  // console.log("Generated CAPTCHA:", captcha.text);

  res.type("svg");
  // svg-captcha otherwise renders non-colored characters in varying greys.
  // Force the challenge characters to solid black for better legibility.
  res.send(captcha.data.replace(/fill="[^"]*"/g, 'fill="#000000"'));
});

// userRouter.get("/test", userController.test);
userRouter.post("/registration", validate(registerSchema), (req, res) =>
  userController.registration(req, res)
);
userRouter.post("/login", validate(loginSchema), (req, res) =>
  userController.login(req, res)
);
userRouter.post("/verify-otp", validate(verifySchema), (req, res) =>
  userController.verifyOtp(req, res)
);

userRouter.post("/sendNotification", authMiddleware, (req, res) =>
  userController.sendNotification(req, res)
);

userRouter.get("/profile", authenticateJWT, userController.profile);


// Admin Login 
userRouter.post("/signIn", validate(loginAdminSchema), (req, res) =>
  userController.signIn(req, res)
);

userRouter.get("/dashboard", authMiddleware, userController.dashboard);
userRouter.get("/stock-chart-data", authMiddleware, (req, res) => userController.stockChartData(req, res));
userRouter.get("/list", authMiddleware, requireRole('admin', 'staff'), userController.list);
userRouter.get("/logout", authMiddleware, userController.logout);
userRouter.get("/my-profile", authMiddleware, userController.myProfile);
userRouter.get("/archived-users", authMiddleware, requireRole('admin', 'staff'), userController.archivedUsers);

userRouter.post(
  '/update-profile',
  authMiddleware,
  uploadFile("userimages").single("profile"),
  (req, res) => userController.update(req, res)
);
userRouter.post(
  '/update-status/:id',
  authMiddleware,
  requireRole('admin', 'staff'),
  (req, res) => userController.updateStatus(req, res)
);

userRouter.get(
  '/delete/:id',
  authMiddleware,
  requireRole('admin', 'staff'),
  (req, res) => userController.delete(req, res)
);

userRouter.get(
  '/revert/:id',
  authMiddleware,
  requireRole('admin', 'staff'),
  (req, res) => userController.updateRevert(req, res)
);

userRouter.get(
  '/team/:id',
  authMiddleware,
  requireRole('admin', 'staff'),
  (req, res) => userController.teamList(req, res)
);

userRouter.get(
  '/permanent-delete/:id',
  authMiddleware,
  requireRole('admin', 'staff'),
  (req, res) => userController.permanentDelete(req, res)
);

userRouter.get(
  '/user-details/:id',
  authMiddleware,
  (req, res) => userController.userDetails(req, res)
);

userRouter.get(
  '/notification/:id',
  authMiddleware,
  (req, res) => userController.notification(req, res)
);

userRouter.get(
  '/add-party', 
  authMiddleware, 
  (req, res) => userController.addParty(req, res)
);

userRouter.post("/createParty", authMiddleware, (req, res) =>
  userController.createParty(req, res)
);

// userRouter.get('/party/:id', authMiddleware, (req, res) => userController.partyList(req, res));

userRouter.get(
  '/party/:id',
  authMiddleware,
  (req, res, next) => userController.partyList(req, res, next)
);

userRouter.get(
  '/edit-user/:id', 
  authMiddleware,
  (req, res) => userController.editUser(req, res)
);

userRouter.get(
  '/add-user', 
  authMiddleware,
  requireRole('admin'),
  (req, res) => userController.addUser(req, res)
);

userRouter.post("/updateUser", authMiddleware, (req, res) =>
  userController.updateUser(req, res)
);

userRouter.get("/update-password", authMiddleware, (req, res) =>
  userController.updatePasswordPage(req, res)
);

userRouter.post("/change-password", authMiddleware, (req, res) =>
  userController.changePassword(req, res)
);

userRouter.post("/update-password", authMiddleware, (req, res) =>
  userController.updatePassword(req, res)
);

export default userRouter;
