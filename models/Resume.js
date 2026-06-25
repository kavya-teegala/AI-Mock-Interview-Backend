import mongoose from "mongoose";

// One row per upload, so /resume/history can return real, per-user
// data instead of nothing being saved at all. atsScore stays null —
// no real scoring model exists yet, so we don't fabricate one.
const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Resume", resumeSchema);
