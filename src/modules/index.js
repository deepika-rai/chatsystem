import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import { UN_DB_CONNECTION } from "../models/index.js";
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const reqUploadDir = path.resolve(__dirname, "../uploads/req");
const repUploadDir = path.resolve(__dirname, "../uploads/rep");

const publicReqUpload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(reqUploadDir, { recursive: true });
      cb(null, reqUploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `public-${Date.now()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowed = file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";
    cb(null, allowed);
  }
});

const publicRepUpload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(repUploadDir, { recursive: true });
      cb(null, repUploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `public-${Date.now()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowed = file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";
    cb(null, allowed);
  }
});

const srvUploadDir = path.resolve(__dirname, "../uploads/srv");
const publicSrvUpload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(srvUploadDir, { recursive: true });
      cb(null, srvUploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `public-${Date.now()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowed = file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";
    cb(null, allowed);
  }
});

import userRouter from "./ui/user/user.routes.js"
import chatRouter from "./ui/chat/chat.routes.js";

import authRouter from './api/auth/auth.routes.js'
import userApiRouter from "./api/user/user.routes.js";
import dashboardRouter from "./api/dashboard/dashboard.routes.js";
import settingRouter from "./api/setting/setting.routes.js";
import chatApiRouter from "./api/chat/chat.routes.js";


// ── Public home page — requisition + replacement forms (no auth required) ──
router.get('/', async (req, res) => {
  const isLoggedIn = Boolean(req.cookies?.accessToken);

  try {
    //REDIRECT ON DASHBOARD PAGE IF USER IS LOGGEDIN
    // if (req.cookies && req.cookies.accessToken) {
    //   return res.redirect('/user/dashboard');
    // }

    return res.render('home', { isLoggedIn });
  } catch (err) {
    console.error('[Home Route Error]', err);
    return res.render('home', {
      isLoggedIn
    });
  }
});

// ── Login page ──
router.get('/login', (req, res) => {
  if (req.cookies && req.cookies.accessToken) {
    return res.redirect('/user/dashboard');
  }
  res.render('login');
});

// ── Helper: wrap multer to catch size/type errors and redirect with flash ──
function handleUpload(uploadMiddleware, redirectOnError) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        const msg = err.code === 'LIMIT_FILE_SIZE'
          ? 'File size must be less than 5 MB.'
          : err.message || 'File upload failed.';
        req.flash('error', msg);
        return res.redirect(redirectOnError);
      }
      next();
    });
  };
}






// Ui Routes
router.use("/user", userRouter);
router.use("/chat", chatRouter);


// Api Routes 
router.use("/api/auth", authRouter);
router.use("/api/setting", settingRouter);
router.use("/api/user", userApiRouter);
router.use('/api/dashboard', dashboardRouter);
router.use("/api/chat", chatApiRouter);


export default router;
