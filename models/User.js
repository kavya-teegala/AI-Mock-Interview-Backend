import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
    },

    // Onboarding fields. All optional at the schema level so this
    // doesn't break existing users/documents — completeness is derived
    // via the isProfileComplete virtual below, not a separate stored
    // boolean that could fall out of sync.
    role: { type: String, trim: true, default: "" },
    experienceLevel: { type: String, trim: true, default: "" },
    techStack: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.virtual("isProfileComplete").get(function () {
  return Boolean(this.role && this.experienceLevel && this.techStack && this.location);
});

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);