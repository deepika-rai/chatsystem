export function handleErrorUi(reqOrRes, resOrErr, errOrContext = "", maybeContext = "") {
  const req = typeof reqOrRes?.flash === "function" ? reqOrRes : reqOrRes?.req;
  const res = typeof reqOrRes?.flash === "function" ? resOrErr : reqOrRes;
  const err = typeof reqOrRes?.flash === "function" ? errOrContext : resOrErr;
  const context = typeof reqOrRes?.flash === "function" ? maybeContext : errOrContext;

  console.error(`[${new Date().toISOString()}] Error in ${context}:`, err);

  const flashError = (message) => {
    if (typeof req?.flash === "function") {
      return req.flash("error", message);
    }

    res.locals.error = Array.isArray(message) ? message : [message];
    return res.locals.error;
  };

  // Sequelize Unique Constraint Error
  if (err.name === "SequelizeUniqueConstraintError") {
    const field = err.errors?.[0]?.path || "field";
    return flashError(`${field} already exists`);
  }

  // Sequelize Validation Error
  if (err.name === "SequelizeValidationError") {
    const messages = err.errors.map(e => e.message);
    return flashError(messages);
  }

  // Joi validation errors (already pre-handled but kept for safety)
  if (err.isJoi) {
    return flashError(err.details.map(d => d.message));
  }

  // Default Internal Server Error
  return flashError(err.message);
}


