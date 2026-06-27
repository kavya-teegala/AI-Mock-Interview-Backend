import express from "express";
import Interview from "../models/Interview.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/history",
  protect,
  async (req, res) => {
    try {
      const interviews = await Interview.find({
        userId: req.user.id,
      }).sort({ createdAt: -1 });

      res.json({ interviews });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: "Failed to fetch history",
      });
    }
  }
);

router.post(
  "/save-session",
  protect,
  async (req, res) => {
    try {
      const interview = await Interview.create({
        ...req.body,
        userId: req.user.id,
      });

      res.status(201).json(interview);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: "Failed to save session",
      });
    }
  }
);

export default router;
