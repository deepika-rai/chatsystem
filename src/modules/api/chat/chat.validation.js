import Joi from "joi";

export const createChat = Joi.object({
  type: Joi.string().valid("direct", "group").required(),
  name: Joi.when("type", {
    is: "group",
    then: Joi.string().max(100).required(),
    otherwise: Joi.forbidden()
  }),
  userIds: Joi.array().items(Joi.number().integer()).min(1).required()
});

export const updateChat = Joi.object({
  name: Joi.string().max(100),
  image: Joi.string()
}).min(1);

export const addMembers = Joi.object({
  userIds: Joi.array().items(Joi.number().integer()).min(1).required()
});