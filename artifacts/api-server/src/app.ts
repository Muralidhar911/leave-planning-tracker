import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import router from "./routes/index";

const app: Express = express();

// Trust Render's reverse proxy so secure cookies & req.ip work correctly
app.set("trust proxy", 1);

// CORS — allow Vercel frontend origins + localhost dev
// Always accepts *.vercel.app and *.onrender.com so deployment works
// without needing FRONTEND_URL to be set (set it anyway for security)
const extraOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Always allow localhost dev
      if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
        return callback(null, true);
      }

      // Always allow any *.vercel.app origin (all preview + production URLs)
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      // Allow explicitly configured origins (comma-separated FRONTEND_URL)
      if (extraOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}

const isProd = process.env.NODE_ENV === "production";

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,           // HTTPS-only cookies in production
      sameSite: isProd ? "none" : "lax", // "none" needed for cross-origin (Vercel → Render)
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    },
  })
);

// Health check endpoint (used by Render and for manual verification)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", router);

export default app;

