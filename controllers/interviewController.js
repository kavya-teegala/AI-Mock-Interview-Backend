import Interview from "../models/Interview.js";

/* =========================
   SAVE INTERVIEW SESSION
========================= */
export const saveInterviewSession = async (req, res) => {
  try {
    const {
      role,
      level,
      techStack,
      transcript,
      overallScore,
      finalReport,
    } = req.body;

    const interview = await Interview.create({
      userId: req.user.id,
      role,
      level,
      techStack,
      transcript,
      overallScore,
      finalReport,
    });

    res.status(201).json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to save interview session",
    });
  }
};

/* =========================
   GET USER INTERVIEW HISTORY
========================= */
export const getInterviewHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      interviews,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch interview history",
    });
  }
};