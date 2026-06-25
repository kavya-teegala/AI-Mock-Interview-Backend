export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: result.error.errors?.[0]?.message || "Validation error",
      });
    }

    // optional: replace body with validated data (clean practice)
    req.body = result.data;

    next();
  } catch (err) {
    return res.status(500).json({
      message: "Server validation error",
    });
  }
};