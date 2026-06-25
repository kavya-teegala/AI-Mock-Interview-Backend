import express from "express";
import multer from "multer";
import pdf from "pdf-parse/lib/pdf-parse.js";

import { protect } from "../middleware/authMiddleware.js";
import Resume from "../models/Resume.js";

const router = express.Router();

/* MULTER CONFIG */
const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files allowed"));
    }

    cb(null, true);
  },
});

/* =========================
   UPLOAD RESUME
========================= */
router.post(
  "/upload",
  protect,
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const data = await pdf(req.file.buffer);

      // Persist so this user can see it again in their resume history
      // — previously nothing was saved here at all.
      const resume = await Resume.create({
        userId: req.user.id,
        fileName: req.file.originalname,
      });

      res.status(200).json({
        success: true,
        extractedText: data.text,
        resume,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Resume upload failed",
      });
    }
  }
);

/* =========================
   RESUME HISTORY (user-specific)
========================= */
router.get("/history", protect, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      resumes,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to load resume history",
    });
  }
});

export default router;
