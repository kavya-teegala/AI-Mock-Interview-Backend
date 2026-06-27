import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

connectDB();

const app = express();

app.use("/api/interview", interviewRoutes);

/* =========================
   SECURITY
========================= */

app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ai-mock-interview-platform-coral.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));

/* =========================
   RATE LIMIT
========================= */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

app.use("/api/auth", authLimiter);

/* =========================
   ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/interview", interviewRoutes);

/* =========================
   TEST ROUTE
========================= */

app.get("/", (req, res) => {
  res.send("API running...");
});

/* =========================
   ERROR HANDLER
========================= */

app.use(errorHandler);

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});