import { Sequelize } from "sequelize";
import { UN_DB_CONNECTION } from "../config/db.js";

import users from "./user.model.js";
import greetings from "./greetings.js";

import notification from "./notification.js";
import chatModel from './chat.model.js';
import chatMemberModel from './chatMember.model.js';



/* ================= INIT MODELS ================= */

function initModels(sequelize) {
  const User = users(sequelize, Sequelize);
  const Greeting = greetings(sequelize, Sequelize);
  const Notification = notification(sequelize, Sequelize);
  const ChatModel = chatModel(sequelize, Sequelize);
  const ChatMemberModel = chatMemberModel(sequelize, Sequelize);




  /* ================= USER ================= */

  User.belongsTo(Greeting, { foreignKey: "greetingId" });

  ChatModel.hasMany(ChatMemberModel, { foreignKey: 'chatId', as: 'members' });
  ChatModel.hasOne(ChatMemberModel, { foreignKey: 'chatId', as: 'myMembership' });
  ChatMemberModel.belongsTo(ChatModel, { foreignKey: 'chatId', as: 'chat' });
  ChatMemberModel.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  ChatModel.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });


  /* ================= RETURN ================= */

  return {
    User,
    Greeting,
    Notification,
    Chat: ChatModel,
    ChatMember: ChatMemberModel,
  };
}

const models = initModels(UN_DB_CONNECTION);

/* ================= DB HELPER ================= */

class UN_DB {
  static create(query, model) {
    return model.create(query);
  }

  static update(query, condition, model) {
    return model.update(query, { where: condition });
  }

  static findOne(condition, model) {
    return model.findOne({ where: condition });
  }

  static findAll(condition, model) {
    return model.findAll({ where: condition });
  }

  static findAndCountAll(query, model) {
    return model.findAndCountAll(query);
  }

  static delete(condition, model) {
    return model.destroy({ where: condition });
  }
}

export const {
  User,
  Greeting,
  Notification,
  Chat,
  ChatMember,
} = models;

export { UN_DB, UN_DB_CONNECTION };
