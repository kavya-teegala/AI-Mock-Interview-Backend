import User from "../models/User.js";

/* =========================
   GET MY PROFILE
========================= */
export const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        experienceLevel: user.experienceLevel,
        techStack: user.techStack,
        location: user.location,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================
   UPDATE MY PROFILE
========================= */
export const updateMyProfile = async (req, res, next) => {
  try {
    const { name, role, experienceLevel, techStack, location } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only touch fields that were actually sent — partial updates
    // (e.g. just changing location later from Settings) shouldn't
    // wipe out the rest.
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (experienceLevel !== undefined) user.experienceLevel = experienceLevel;
    if (techStack !== undefined) user.techStack = techStack;
    if (location !== undefined) user.location = location;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        experienceLevel: user.experienceLevel,
        techStack: user.techStack,
        location: user.location,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (error) {
    next(error);
  }
};
