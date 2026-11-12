import { User, Chat, ChatMember, UN_DB_CONNECTION as sequelize } from "../../../models/index.js";
import db from "../../../config/firebase.js";

// safe columns only, never expose password
const userAttrs = ["id", "name", "profile", "role"];
const activeUser = { is_deleted: 0, status: "active" };

// JWT payload uses `userId`, not `id`
const getUid = (req) => req.user?.userId ?? req.user?.id;

const getMembership = (chatId, userId) =>
  ChatMember.findOne({ where: { chatId, userId, leftAt: null } });

const fail = (res, err) => {
  console.error(err);
  return res.status(500).json({ success: false, message: err.message || "Something went wrong" });
};

// Update last seen for a user in Firestore: chats/{chatId}/members/{userId}
async function updateLastSeen(chatId, userId, lastMessageId) {
  await db
    .collection("chats")
    .doc(String(chatId))
    .collection("members")
    .doc(String(userId))
    .set(
      {
        userId,
        lastSeenAt: new Date().toISOString(),
        lastSeenMessageId: lastMessageId || null,
      },
      { merge: true }
    );
}

// Mark a specific message as read by this user
// Firestore path: chats/{chatId}/messages/{messageId}/readBy/{userId}
async function markMessageReadInFirestore(chatId, messageId, userId) {
  await db
    .collection("chats")
    .doc(String(chatId))
    .collection("messages")
    .doc(String(messageId))
    .collection("readBy")
    .doc(String(userId))
    .set({ userId, readAt: new Date().toISOString() });
}

export default class ChatController {
  // POST /create
  async createChat(req, res) {
    const t = await sequelize.transaction();
    try {
      const me = getUid(req);
      const { type, name } = req.body;
      const userIds = [...new Set(req.body.userIds)].filter((id) => id !== me);

      if (!userIds.length) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Select at least one other user" });
      }

      const found = await User.count({ where: { id: userIds, ...activeUser }, transaction: t });
      if (found !== userIds.length) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "One or more users not found or inactive" });
      }

      let chat;
      if (type === "direct") {
        if (userIds.length !== 1) {
          await t.rollback();
          return res.status(400).json({ success: false, message: "Direct chat needs exactly one user" });
        }
        const directKey = [me, userIds[0]].sort((a, b) => a - b).join("_");
        const existing = await Chat.findOne({ where: { directKey }, transaction: t });
        if (existing) {
          await t.commit();
          return res.json({ success: true, message: "Chat already exists", data: existing });
        }
        chat = await Chat.create({ type, directKey, createdBy: me }, { transaction: t });
        await ChatMember.bulkCreate(
          [me, userIds[0]].map((userId) => ({ chatId: chat.id, userId })),
          { transaction: t }
        );
      } else {
        chat = await Chat.create({ type, name, createdBy: me }, { transaction: t });
        await ChatMember.bulkCreate(
          [
            { chatId: chat.id, userId: me, role: "admin" },
            ...userIds.map((userId) => ({ chatId: chat.id, userId }))
          ],
          { transaction: t }
        );
      }

      await t.commit();
      return res.status(201).json({ success: true, message: "Chat created", data: chat });
    } catch (err) {
      await t.rollback();
      return fail(res, err);
    }
  }

  // GET /list?page=1&limit=20
  async getMyChats(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);

      const { rows, count } = await Chat.findAndCountAll({
        distinct: true,
        limit,
        offset: (page - 1) * limit,
        order: [["lastMessageAt", "DESC"], ["createdAt", "DESC"]],
        include: [
          {
            model: ChatMember, as: "myMembership", required: true,
            where: { userId: getUid(req), leftAt: null },
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

      return res.json({ success: true, data: rows, pagination: { page, limit, total: count } });
    } catch (err) {
      return fail(res, err);
    }
  }

  // GET /details/:id
  async getChat(req, res) {
    try {
      if (!(await getMembership(req.params.id, getUid(req))))
        return res.status(403).json({ success: false, message: "Not a member of this chat" });

      const chat = await Chat.findByPk(req.params.id, {
        include: [{
          model: ChatMember, as: "members", required: false, where: { leftAt: null },
          include: [{ model: User, as: "user", attributes: userAttrs }]
        }]
      });
      return res.json({ success: true, data: chat });
    } catch (err) {
      return fail(res, err);
    }
  }

  // POST /update/:id  (group admin only)
  async updateChat(req, res) {
    try {
      const chat = await Chat.findByPk(req.params.id);
      if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
      if (chat.type !== "group")
        return res.status(400).json({ success: false, message: "Only group chats can be edited" });

      const m = await getMembership(chat.id, getUid(req));
      if (!m || m.role !== "admin")
        return res.status(403).json({ success: false, message: "Admin only" });

      await chat.update({ name: req.body.name ?? chat.name, image: req.body.image ?? chat.image });
      return res.json({ success: true, message: "Chat updated", data: chat });
    } catch (err) {
      return fail(res, err);
    }
  }

  // POST /add-members/:id  (group admin only)
  async addMembers(req, res) {
    try {
      const chat = await Chat.findByPk(req.params.id);
      if (!chat || chat.type !== "group")
        return res.status(404).json({ success: false, message: "Group chat not found" });

      const m = await getMembership(chat.id, getUid(req));
      if (!m || m.role !== "admin")
        return res.status(403).json({ success: false, message: "Admin only" });

      const userIds = [...new Set(req.body.userIds)];
      const found = await User.count({ where: { id: userIds, ...activeUser } });
      if (found !== userIds.length)
        return res.status(400).json({ success: false, message: "One or more users not found or inactive" });

      for (const userId of userIds) {
        const [row, created] = await ChatMember.findOrCreate({
          where: { chatId: chat.id, userId },
          defaults: { role: "member" }
        });
        if (!created && row.leftAt) await row.update({ leftAt: null, joinedAt: new Date() });
      }
      return res.json({ success: true, message: "Members added" });
    } catch (err) {
      return fail(res, err);
    }
  }

  // POST /remove-member/:id/:userId  (admin removes someone, or you leave)
  async removeMember(req, res) {
    try {
      const { id, userId } = req.params;
      const me = getUid(req);

      const chat = await Chat.findByPk(id);
      if (!chat || chat.type !== "group")
        return res.status(404).json({ success: false, message: "Group chat not found" });

      const mine = await getMembership(id, me);
      if (!mine) return res.status(403).json({ success: false, message: "Not a member" });
      if (Number(userId) !== me && mine.role !== "admin")
        return res.status(403).json({ success: false, message: "Admin only" });

      const target = await getMembership(id, userId);
      if (!target) return res.status(404).json({ success: false, message: "Member not found" });

      await target.update({ leftAt: new Date() });

      // if the last admin left, promote the oldest remaining member
      const admins = await ChatMember.count({ where: { chatId: id, role: "admin", leftAt: null } });
      if (!admins) {
        const successor = await ChatMember.findOne({
          where: { chatId: id, leftAt: null },
          order: [["joinedAt", "ASC"]]
        });
        if (successor) await successor.update({ role: "admin" });
      }
      return res.json({ success: true, message: "Member removed" });
    } catch (err) {
      return fail(res, err);
    }
  }

  // POST /mark-read/:id
  async markRead(req, res) {
    try {
      const m = await getMembership(req.params.id, getUid(req));
      if (!m) return res.status(403).json({ success: false, message: "Not a member" });
      await m.update({ lastReadAt: new Date() });
      return res.json({ success: true, message: "Marked as read" });
    } catch (err) {
      return fail(res, err);
    }
  }

  // POST /messages/:chatId  — send a message, write to Firestore
  async sendMessage(req, res) {
    try {
      const chatId = req.params.chatId;
      const userId = getUid(req);
      const text = (req.body.text || "").trim();

      if (!text) {
        return res.status(400).json({ success: false, message: "Message text is required" });
      }

      // verify membership in MySQL
      const membership = await getMembership(chatId, userId);
      if (!membership) {
        return res.status(403).json({ success: false, message: "Not a member of this chat" });
      }

      const user = await User.findByPk(userId, { attributes: userAttrs });

      const msgData = {
        senderId: userId,
        senderName: user.name,
        text,
        createdAt: new Date().toISOString(),
      };

      // write to Firestore: chats/{chatId}/messages/{auto-id}
      const docRef = await db.collection("chats").doc(String(chatId)).collection("messages").add(msgData);

      // update lastMessage + lastMessageAt in MySQL
      await Chat.update(
        { lastMessage: text, lastMessageAt: new Date() },
        { where: { id: chatId } }
      );

      // sender has obviously seen their own message
      updateLastSeen(chatId, userId, docRef.id).catch((e) =>
        console.error("lastSeen update failed:", e.message)
      );

      return res.status(201).json({ success: true, data: { id: docRef.id, ...msgData } });
    } catch (err) {
      return fail(res, err);
    }
  }

  // GET /messages/:chatId?limit=50  — fetch last N messages from Firestore
  async getMessages(req, res) {
    try {
      const chatId = req.params.chatId;
      const userId = getUid(req);
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);

      // verify membership
      const membership = await getMembership(chatId, userId);
      if (!membership) {
        return res.status(403).json({ success: false, message: "Not a member of this chat" });
      }

      const snapshot = await db
        .collection("chats")
        .doc(String(chatId))
        .collection("messages")
        .orderBy("createdAt", "asc")
        .limitToLast(limit)
        .get();

      const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // update last seen to the most recent message the user just read
      if (messages.length) {
        const lastMsg = messages[messages.length - 1];
        updateLastSeen(chatId, userId, lastMsg.id).catch((e) =>
          console.error("lastSeen update failed:", e.message)
        );
      }

      return res.json({ success: true, data: messages });
    } catch (err) {
      return fail(res, err);
    }
  }

  // GET /last-seen/:chatId  — fetch lastSeen for every member in this chat
  async getLastSeen(req, res) {
    try {
      const chatId = req.params.chatId;
      const userId = getUid(req);

      const membership = await getMembership(chatId, userId);
      if (!membership) {
        return res.status(403).json({ success: false, message: "Not a member of this chat" });
      }

      const snapshot = await db
        .collection("chats")
        .doc(String(chatId))
        .collection("members")
        .get();

      const result = {};
      snapshot.docs.forEach((doc) => {
        result[doc.id] = doc.data(); // keyed by userId string
      });

      return res.json({ success: true, data: result });
    } catch (err) {
      return fail(res, err);
    }
  }

  // POST /messages/:chatId/message/:messageId/read
  // Mark a single message as read by the current user + update their lastSeen
  async markMessageRead(req, res) {
    try {
      const { chatId, messageId } = req.params;
      const userId = getUid(req);

      const membership = await getMembership(chatId, userId);
      if (!membership) {
        return res.status(403).json({ success: false, message: "Not a member of this chat" });
      }

      // Write read receipt: chats/{chatId}/messages/{messageId}/readBy/{userId}
      await markMessageReadInFirestore(chatId, messageId, userId);

      // Also bump lastSeen so the sidebar "last seen" stays up to date
      await updateLastSeen(chatId, userId, messageId);

      return res.json({ success: true, message: "Message marked as read" });
    } catch (err) {
      return fail(res, err);
    }
  }

  // GET /messages/:chatId/message/:messageId/read
  // Return who has read a message { userId: { readAt } }
  async getMessageReadReceipts(req, res) {
    try {
      const { chatId, messageId } = req.params;
      const userId = getUid(req);

      const membership = await getMembership(chatId, userId);
      if (!membership) {
        return res.status(403).json({ success: false, message: "Not a member of this chat" });
      }

      const snapshot = await db
        .collection("chats")
        .doc(String(chatId))
        .collection("messages")
        .doc(String(messageId))
        .collection("readBy")
        .get();

      const result = {};
      snapshot.docs.forEach((doc) => { result[doc.id] = doc.data(); });

      return res.json({ success: true, data: result });
    } catch (err) {
      return fail(res, err);
    }
  }

  // POST /lastseen/:chatId
  // Explicitly update lastSeen for the current user (body: { messageId })
  async postLastSeen(req, res) {
    try {
      const { chatId } = req.params;
      const userId = getUid(req);
      const messageId = req.body.messageId || null;

      const membership = await getMembership(chatId, userId);
      if (!membership) {
        return res.status(403).json({ success: false, message: "Not a member of this chat" });
      }

      await updateLastSeen(chatId, userId, messageId);

      return res.json({ success: true, message: "Last seen updated" });
    } catch (err) {
      return fail(res, err);
    }
  }
}
