import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import ServiceController from "../service/service.controller.js";
import {authMiddleware} from "../../../middlewares/authMiddleware.js"
import { Section } from "../../../models/index.js";
const serviceRouter = express.Router();
const serviceController = new ServiceController();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../../uploads/ser");

function safeFileName(value) {
  return String(value || "requisition")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "requisition";
}

const requisitionUpload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      (async () => {
        const section = await Section.findOne({
          attributes: ["name"],
          where: { id: req.body.sectionId }
        });
        const sectionName = safeFileName(section?.name);
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${sectionName}-${Date.now()}${extension}`);
      })().catch(err => cb(err));
    }
  }),
  fileFilter: (req, file, cb) => {
    const isAllowedFile = file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";
    if (!isAllowedFile) {
      return cb(new Error("Only image or PDF files are allowed."));
    }
    return cb(null, true);
  }
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

serviceRouter.get(
  '/file/:filename',
  authMiddleware,
  (req, res) => {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(uploadDir, safeName);

    if (!fs.existsSync(filePath)) {
      req.flash("error", "Uploaded file not found!");
      return res.redirect("/service/request-list");
    }

    return res.sendFile(filePath);
  }
);

// ENTRY OF SERVICES
serviceRouter.get("/list", authMiddleware, (req, res) => serviceController.serviceList(req, res));

serviceRouter.get(
  '/check-similar',
  authMiddleware,
  (req, res) => serviceController.checkSimilar(req, res)
);

serviceRouter.post(
  '/update-status/:id',
  authMiddleware,
  (req, res) => serviceController.updateStatus(req, res)
);
serviceRouter.post(
  '/create',
  authMiddleware,
  (req, res) => serviceController.create(req, res)
);
serviceRouter.get(
  '/delete/:id',
  authMiddleware,
  (req, res) => serviceController.delete(req, res)
);
serviceRouter.get(
  '/add',
  authMiddleware,
  (req, res) => serviceController.add(req, res)
);
serviceRouter.get(
  '/edit/:id',
  authMiddleware,
  (req, res) => serviceController.edit(req, res)
);
serviceRouter.post(
  '/update',
  authMiddleware,
  (req, res) => serviceController.update(req, res)
);

// ENTRY OF SERVICE REQUEST

serviceRouter.get("/request-list", authMiddleware, (req, res) => serviceController.serviceRequestList(req, res));

serviceRouter.get(
  '/add-request',
  authMiddleware,
  (req, res) => serviceController.addServiceRequest(req, res)
);

serviceRouter.post(
  '/create-request',
  authMiddleware,
  handleUpload(requisitionUpload.single("image"), "/service/add-request"),
  (req, res) => serviceController.createServiceRequest(req, res)
);

serviceRouter.get(
  '/view-request/:id',
  authMiddleware,
  (req, res) => serviceController.viewServiceRequest(req, res)
);

serviceRouter.post(
  '/issue/:id',
  authMiddleware,
  (req, res) => serviceController.issue(req, res)
);


serviceRouter.get("/archived-list", authMiddleware, serviceController.archivedRequestList);

serviceRouter.get(
  '/delete-request/:id',
  authMiddleware,
  (req, res) => serviceController.deleteRequest(req, res)
);

serviceRouter.get(
  '/permanent-delete-request/:id',
  authMiddleware,
  (req, res) => serviceController.permanentDelete(req, res)
);

serviceRouter.get(
  '/revert-request/:id',
  authMiddleware,
  (req, res) => serviceController.revert(req, res)
);


export default serviceRouter;
