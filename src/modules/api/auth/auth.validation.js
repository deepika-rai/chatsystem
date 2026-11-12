import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.empty": "Name is required",
      "string.min": "Name must be at least 3 characters",
      "string.max": "Name cannot exceed 50 characters",
    }),
    language: Joi.string().valid("English", "Hindi").required(),
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Invalid email format",
    }),

  phone: Joi.number()
    .integer()
    .min(1000000000)
    .max(9999999999)
    .required()
    .messages({
      "number.base": "Phone must be a number",
      "number.min": "Phone must be a valid 10-digit number",
      "number.max": "Phone must be a valid 10-digit number",
      "any.required": "Phone is required",
    }),

  password: Joi.string()
    .min(8)
    .max(20)
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?#&]).+$")
    )
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password cannot exceed 20 characters",
      "string.pattern.base":
        "Password must contain uppercase, lowercase, number, and special character",
    }),

  confirm_password: Joi.any()
    .equal(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "any.required": "Confirm password is required",
    }),

geoLocation: Joi.string()
  .max(255)
  .optional()
  .messages({
    "string.base": "Geo location must be a string",
    "string.max": "Geo location cannot exceed 255 characters",
  })

});

export const loginSchema = Joi.object({
  phone: Joi.number()
    .integer()
    .min(1000000000)
    .max(9999999999)
    .required()
    .messages({
      "number.base": "Phone must be a number",
      "number.min": "Phone must be a valid 10-digit number",
      "number.max": "Phone must be a valid 10-digit number",
      "any.required": "Phone is required",
    })
});

export const verifySchema = Joi.object({
  phone: Joi.number()
    .integer()
    .min(1000000000)
    .max(9999999999)
    .required()
    .messages({
      "number.base": "Phone must be a number",
      "number.min": "Phone must be a valid 10-digit number",
      "number.max": "Phone must be a valid 10-digit number",
      "any.required": "Phone is required",
    }),

  otp: Joi.string()
    .length(6) // OTP is always 6 digits
    .pattern(/^[0-9]+$/) // only digits allowed
    .required()
    .messages({
      "string.base": "OTP must be a string",
      "string.length": "OTP must be a 6-digit code",
      "string.pattern.base": "OTP must contain only digits",
      "any.required": "OTP is required",
    }),
});

export const loginAdminSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Invalid email format",
    }),
  password: Joi.string()
    .min(8)
    .max(20)
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?#&]).+$")
    )
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password cannot exceed 20 characters",
      "string.pattern.base":
        "Password must contain uppercase, lowercase, number, and special character",
    })
});