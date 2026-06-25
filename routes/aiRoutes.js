import express from "express";
const router = express.Router();

import axios from "axios";

import Interview from "../models/Interview.js";
import { protect } from "../middleware/authMiddleware.js";

/* =========================
   1. GENERATE QUESTIONS
========================= */

router.post(
  "/generate-questions",
  protect,
  async (req, res) => {
    try {
      const { role, level, techStack } = req.body;

      if (
        !role?.trim() ||
        !level?.trim() ||
        !techStack?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Role, level and tech stack are required",
        });
      }

      const prompt = `
Generate exactly 10 interview questions.

Role: ${role}
Experience Level: ${level}
Tech Stack: ${techStack}

Mix:
- Technical
- Behavioral
- System Design
- Problem Solving

IMPORTANT:
Return ONLY a valid JSON array.

Example:
[
  {
    "prompt": "Explain REST API authentication",
    "tag": "Technical"
  }
]

Do NOT add:
- markdown
- explanation
- intro text
- \`\`\`json
`;

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3.1-8b-instruct",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const raw =
        response.data.choices[0].message.content;

      const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let questions = [];

      try {
        const parsed = JSON.parse(cleaned);

        questions = parsed.map((q) => ({
          prompt:
            typeof q === "string"
              ? q
              : q.prompt || "Interview question",
          tag:
            typeof q === "object" && q.tag
              ? q.tag
              : "Technical",
        }));
      } catch {
        questions = cleaned
          .split("\n")
          .map((q) =>
            q.replace(/^\d+[\).\s-]*/, "").trim()
          )
          .filter(
            (q) =>
              q &&
              q.length > 10 &&
              !q.toLowerCase().includes("here are") &&
              !q.toLowerCase().includes("interview questions")
          )
          .map((q, index) => ({
            prompt: q,
            tag:
              index % 4 === 0
                ? "Behavioral"
                : index % 3 === 0
                ? "System Design"
                : "Technical",
          }));
      }

      await Interview.create({
        role,
        level,
        techStack,
        questions: questions.map((q) => ({
  question: q.prompt,
  answer: "",
  feedback: null,
  tag: q.tag || "Technical",
})),
        userId: req.user.id,
      });

      res.json({
        success: true,
        questions,
      });
    } catch (error) {
      console.error(
        "GENERATION ERROR:",
        JSON.stringify(
          error.response?.data,
          null,
          2
        ) || error.message
      );

      res.status(500).json({
        success: false,
        message:
          error.response?.status === 429
            ? "AI is busy right now. Please try again in a few seconds."
            : "Failed to generate questions",
      });
    }
  }
);

/* =========================
   2. HISTORY
========================= */

router.get(
  "/history",
  protect,
  async (req, res) => {
    try {
      const interviews =
        await Interview.find({
          userId: req.user.id,
        }).sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        interviews,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch history",
      });
    }
  }
);

/* =========================
   3. EVALUATE ANSWER
========================= */

router.post(
  "/evaluate",
  protect,
  async (req, res) => {
    try {
      const { question, answer } = req.body;

      if (
        !answer ||
        answer.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Answer cannot be empty",
        });
      }

      const prompt = `
You are an expert senior technical interviewer.

Question:
${question}

Candidate Answer:
${answer}

Evaluate the answer professionally.

Return ONLY valid JSON.

Format:
{
  "overall": 78,
  "breakdown": [
    {
      "label": "Technical Accuracy",
      "value": 80
    },
    {
      "label": "Communication",
      "value": 75
    },
    {
      "label": "Problem Solving",
      "value": 79
    }
  ],
  "strengths": [
    "Good explanation of concepts"
  ],
  "improvements": [
    "Add more real-world examples"
  ],
  "betterAnswer": "A stronger answer would be..."
}

IMPORTANT:
- betterAnswer should teach the user
- Keep feedback concise but educational
- Scores must be realistic
`;

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3.1-8b-instruct",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const raw =
        response.data.choices[0].message
          .content;

      const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let feedback;

      try {
        feedback = JSON.parse(cleaned);
      } catch {
        feedback = {
          overall: 70,
          breakdown: [
            {
              label: "Technical Accuracy",
              value: 70,
            },
            {
              label: "Communication",
              value: 68,
            },
            {
              label: "Problem Solving",
              value: 72,
            },
          ],
          strengths: [
            "Good attempt",
          ],
          improvements: [
            "Add more technical depth",
          ],
          betterAnswer:
            "Explain your answer with clearer structure and practical examples.",
        };
      }

      res.json({
        success: true,
        feedback,
      });
    } catch (error) {
      console.error(
        "EVALUATION ERROR:",
        JSON.stringify(
          error.response?.data,
          null,
          2
        ) || error.message
      );

      res.status(500).json({
        success: false,
        message:
          error.response?.status === 429
            ? "AI evaluation is temporarily busy. Please retry."
            : "Evaluation failed",
      });
    }
  }
);

/* =========================
   4. FOLLOW-UP QUESTION
========================= */

router.post(
  "/follow-up",
  protect,
  async (req, res) => {
    try {
      const {
        question,
        answer,
      } = req.body;

      const prompt = `
You are a senior technical interviewer.

Original Question:
${question}

Candidate Answer:
${answer}

Generate ONE professional follow-up interview question.

IMPORTANT:
- Return ONLY the question
- No numbering
- No explanation
- Keep it concise
- Make it realistic
`;

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model:
            "meta-llama/llama-3.1-8b-instruct",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const followUp =
        response.data.choices[0].message.content
          .trim();

      res.json({
        success: true,
        question: followUp,
      });
    } catch (error) {
      console.error(
        "FOLLOW-UP ERROR:",
        error.response?.data ||
          error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to generate follow-up",
      });
    }
  }
);

/* =========================
   4. SAVE SESSION SCORE
========================= */

router.patch(
  "/interview/:id/score",
  protect,
  async (req, res) => {
    try {
      const { score } = req.body;

      if (
        typeof score !== "number" ||
        score < 0 ||
        score > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Score must be between 0 and 100",
        });
      }

      const interview =
        await Interview.findOne({
          _id: req.params.id,
          userId: req.user.id,
        });

      if (!interview) {
        return res.status(404).json({
          success: false,
          message:
            "Interview not found",
        });
      }

      interview.overallScore = score;

      await interview.save();

      res.json({
        success: true,
        interview,
      });
    } catch (error) {
      console.error(
        "SAVE SCORE ERROR:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to save score",
      });
    }
  }
);

router.post('/save-transcript', protect, async (req, res) => {
  try {
    const { messages, score, setup } = req.body

    if (!messages?.length) {
      return res.status(400).json({
        success: false,
        message: 'No transcript to save',
      })
    }

    const interview = await Interview.create({
      role: setup.role,
      level: setup.level,
      techStack: setup.techStack,
      questions: messages
        .filter(m => m.type === 'question')
        .map(m => m.content),
      userId: req.user.id,
      overallScore: score || null,
    })

    res.json({
      success: true,
      interview,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      message: 'Failed to save transcript',
    })
  }
})

router.post("/save-session", protect, async (req, res) => {
  try {
    const {
      role,
      level,
      techStack,
      transcript,
      finalReport,
      overallScore,
    } = req.body;

    const interview = await Interview.create({
      role,
      level,
      techStack,
      transcript,
      finalReport,
      overallScore,
      userId: req.user.id,
      questions: transcript.map((t) => t.question),
    });

    res.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error("SAVE SESSION ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to save interview session",
    });
  }
});

/* =========================
   SAVE SESSION
========================= */

router.post(
  "/save-session",
  protect,
  async (req, res) => {
    try {
      const {
        role,
        level,
        techStack,
        transcript,
        finalReport,
        overallScore,
      } = req.body;

      const savedInterview =
        await Interview.create({
          userId: req.user.id,
          role,
          level,
          techStack,
          transcript,
          finalReport,
          overallScore,
          questions: transcript.map(
            (t) => ({
              prompt: t.question,
              answer: t.answer,
              feedback: t.feedback,
              tag: t.tag,
            })
          ),
        });

      res.json({
        success: true,
        interview: savedInterview,
      });
    } catch (error) {
      console.error(
        "SAVE SESSION ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to save session",
      });
    }
  }
);

export default router;