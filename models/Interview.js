import mongoose from "mongoose";

const transcriptSchema = new mongoose.Schema(
  {
    question: String,
    answer: String,
    feedback: Object,
    tag: String,
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      required: true,
    },

    level: {
      type: String,
      required: true,
    },

    techStack: {
      type: String,
      required: true,
    },

    questions: [Object],

    transcript: [transcriptSchema],

    overallScore: {
      type: Number,
      default: 0,
    },

    finalReport: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Interview",
  interviewSchema
);