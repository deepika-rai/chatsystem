import { Op } from "sequelize";
import { User, Chat, ChatMember, UN_DB_CONNECTION } from "../../../models/index.js";
import { handleErrorUi } from "../../../utils/errorHandlerUi.js";

const userAttrs = ["id", "name", "profile", "role"];
const activeUser = { is_deleted: 0, status: "active" };

// logged-in admin id
const currentUserId = (req) => req.user?.userId;

const getMembership = (chatId, userId) =>
  ChatMember.findOne({ where: { chatId, userId, leftAt: null } });

// all chats of this user, shaped for the sidebar in chat.pug
async function fetchMyChats(userId) {
  const rows = await Chat.findAll({
    order: [["lastMessageAt", "DESC"], ["createdAt", "DESC"]],
    include: [
      {
        model: ChatMember, as: "myMembership", required: true,
        where: { userId, leftAt: null },
        attributes: ["role", "isMuted", "lastReadAt"]
      },
      {
        model: ChatMember, as: "members", required: false,
        where: { leftAt: null },
        attributes: ["userId", "role"],
        include: [{ model: User, as: "user", attributes: userAttrs }]
      }
    ]
  });

  return rows.map((chat) => {
    const c = chat.toJSON();
    const other = c.type === "direct" ? c.members.find((m) => m.userId !== userId) : null;
    const lastRead = c.myMembership?.lastReadAt;
    return {
      ...c,
      title: c.type === "group" ? c.name : other?.user?.name || "Unknown",
      avatar: c.type === "group" ? c.image : other?.user?.profile,
      hasUnread: !!c.lastMessageAt && (!lastRead || new Date(c.lastMessageAt) > new Date(lastRead))
    };
  });
}

class ChatController {
  // GET /chat  -> chat list, no conversation open
  async index(req, res) {
    try {
      const chats = await fetchMyChats(currentUserId(req));
      console.log("chat list====>>",chats)
      return res.render("pages/admin/chat", { chats, activeChat: null, id: null });
    } catch (err) {
      return handleErrorUi(res, err, "ChatController.index");
    }
  }

  // GET /chat/:id  -> open one conversation
  async message(req, res) {
    try {
      const { id } = req.params;
      const userId = currentUserId(req);

      const membership = await getMembership(id, userId);
      if (!membership) {
        return res.status(403).render("error", { message: "You are not a member of this chat" });
      }

      const chats = await fetchMyChats(userId);
      const activeChat = chats.find((c) => String(c.id) === String(id));
      if (!activeChat) {
        return res.status(404).render("error", { message: "Chat not found" });
      }

      return res.render("pages/admin/chat", {
        chats,
        activeChat,
        id,                      
        myId: userId,
        isAdmin: membership.role === "admin"
      });
    } catch (err) {
      return handleErrorUi(res, err, "ChatController.message");
    }
  }

  // POST /chat/start  body: { userId }  -> open or create a direct chat
  async startDirect(req, res) {
    const t = await UN_DB_CONNECTION.transaction();
    try {
      const me = currentUserId(req);
      const otherId = Number(req.body.userId);

      if (!otherId || otherId === me) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Invalid user" });
      }

      const other = await User.findOne({ where: { id: otherId, ...activeUser }, transaction: t });
      if (!other) {
        await t.rollback();
        return res.status(404).json({ success: false, message: "User not found or inactive" });
      }

      const directKey = [me, otherId].sort((a, b) => a - b).join("_");
      let chat = await Chat.findOne({ where: { directKey }, transaction: t });

      if (!chat) {
        chat = await Chat.create({ type: "direct", directKey, createdBy: me }, { transaction: t });
        await ChatMember.bulkCreate(
          [me, otherId].map((userId) => ({ chatId: chat.id, userId })),
          { transaction: t }
        );
      }

      await t.commit();
      return res.json({ success: true, redirect: `/chat/${chat.id}` });
    } catch (err) {
      await t.rollback();
      return handleErrorUi(res, err, "ChatController.startDirect");
    }
  }

  // GET /chat/users/search?q=ravi  -> JSON for the "new chat" modal
  async searchUsers(req, res) {
    try {
      const q = (req.query.q || "").trim();
      const users = await User.findAll({
        where: {
          ...activeUser,
          id: { [Op.ne]: currentUserId(req) },
          ...(q && { name: { [Op.like]: `%${q}%` } })
        },
        attributes: userAttrs,
        limit: 20,
        order: [["name", "ASC"]]
      });
      return res.json({ success: true, data: users });
    } catch (err) {
      return handleErrorUi(res, err, "ChatController.searchUsers");
    }
  }
}

export default ChatController;