import Joi from "joi";

export const staffSchema = Joi.object({
  name: Joi.string()
    .max(250)
    .required()
    .messages({
      "string.base": "User Name must be a string",
      "string.empty": "User Name is required",
      "any.required": "User Name is required",
      "string.max": "User Name must not exceed 250 characters",
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.base": "Mobile Number must be a string",
      "string.empty": "Mobile Number is required",
      "any.required": "Mobile Number is required",
      "string.pattern.base": "Mobile Number must be a valid 10-digit number",
    }),

  address: Joi.string()
    .allow("")
    .max(500)
    .messages({
      "string.base": "Address must be a string",
      "string.max": "Address must not exceed 500 characters",
    }),
});
