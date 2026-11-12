import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from './src/config/session.js';
import router from './src/modules/index.js';
import flash from "connect-flash";
// import {swaggerUi, swaggerSpec} from "./swagger.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'src/views'));

// Middleware
app.use(cookieParser());
app.use(session);
app.use(flash());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Make flash vars available in all views
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Log every incoming request (Postman + Browser)
app.use((req, res, next) => {
  console.log("=== API Request ===");
  console.log("Time:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Headers:", req.headers);

  if (req.method !== "GET") {
    console.log("Body:", req.body);
  }
  console.log("===================");
  next();
});

// Swagger UI route
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/", router);

// Global error handler (logs + response)
app.use((err, req, res, next) => {
  console.error("=== API Error ===");
  console.error("Time:", new Date().toISOString());
  console.error("Method:", req.method);
  console.error("URL:", req.originalUrl);
  console.error("Headers:", req.headers);
  console.error("Body:", req.body);
  console.error("Error:", err.stack || err.message);
  console.error("=================");

  // API request (JSON expected)
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }

  // UI request (render error page)
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

export default app;
