export function handleError(res, err, context = "") {
  console.error(`[${new Date().toISOString()}] Error in ${context}:`, err);

  // Sequelize Unique Constraint Error
  if (err.name === "SequelizeUniqueConstraintError") {
    const field = err.errors?.[0]?.path || "field";
    return res.status(400).json({
      status: false,
      message: `${field} already exists`
    });
  }

  // Sequelize Validation Error
  if (err.name === "SequelizeValidationError") {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({
      status: false,
      errors: messages
    });
  }

  // Joi validation errors (already pre-handled but kept for safety)
  if (err.isJoi) {
    return res.status(400).json({
      status: false,
      errors: err.details.map(d => d.message)
    });
  }

  // Default Internal Server Error
  return res.status(500).json({
    status: false,
    message: "Internal Server Error",
    error: err.message
  });
}