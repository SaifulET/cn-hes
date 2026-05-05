import mongoose from "mongoose";
import socketAuth from "./socketAuth.js";
import {
  addUserSocket,
  getUserSocketIds,
  isUserOnline,
  removeUserSocket
} from "../helpers/socketStore.js";
import {
  ensureConversationForUsers,
  formatConversationListItem,
  getConversationMessagesForUser,
  markConversationAsRead,
  persistMessage
} from "../modules/chat/chat.service.js";

const emitToUser = (io, userId, eventName, payload) => {
  const socketIds = getUserSocketIds(userId);
  socketIds.forEach((socketId) => {
    io.to(socketId).emit(eventName, payload);
  });
};

export const registerChatSocket = (io) => {
  io.use(socketAuth);

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    addUserSocket(userId, socket.id);
    socket.join(`user:${userId}`);
    io.emit("chat:user_online", { userId, isOnline: true });

    socket.on("chat:join_conversation", async ({ receiverId, conversationId }, callback) => {
      try {
        let resolvedConversationId = conversationId;

        if (!resolvedConversationId && receiverId) {
          const conversation = await ensureConversationForUsers(userId, receiverId);
          resolvedConversationId = conversation._id.toString();
        }

        if (!resolvedConversationId || !mongoose.Types.ObjectId.isValid(resolvedConversationId)) {
          throw new Error("Valid conversationId or receiverId is required.");
        }

        socket.join(`conversation:${resolvedConversationId}`);
        const messages = await getConversationMessagesForUser(userId, resolvedConversationId);
        callback?.({
          success: true,
          conversationId: resolvedConversationId,
          messages
        });
      } catch (error) {
        callback?.({
          success: false,
          message: error.message
        });
      }
    });

    socket.on("chat:send_message", async ({ receiverId, text, conversationId }, callback) => {
      try {
        const savedMessage = await persistMessage({
          senderId: userId,
          receiverId,
          text,
          conversationId
        });

        const senderConversation = await formatConversationListItem(
          savedMessage.conversationId,
          userId
        );
        const receiverConversation = await formatConversationListItem(
          savedMessage.conversationId,
          receiverId
        );

        io.to(`conversation:${savedMessage.conversationId}`).emit("chat:new_message", savedMessage);
        emitToUser(io, userId, "chat:conversation_updated", senderConversation);
        emitToUser(io, receiverId, "chat:conversation_updated", receiverConversation);
        callback?.({
          success: true,
          message: savedMessage
        });
      } catch (error) {
        callback?.({
          success: false,
          message: error.message
        });
      }
    });

    socket.on("chat:mark_read", async ({ conversationId }, callback) => {
      try {
        const result = await markConversationAsRead(userId, conversationId);
        io.to(`conversation:${conversationId}`).emit("chat:messages_read", {
          conversationId,
          userId,
          readMessageIds: result.readMessageIds
        });
        callback?.({
          success: true,
          ...result
        });
      } catch (error) {
        callback?.({
          success: false,
          message: error.message
        });
      }
    });

    socket.on("chat:typing", ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit("chat:typing", {
        conversationId,
        user: {
          id: userId,
          name: socket.user.name,
          profileImage: socket.user.profileImage
        },
        isTyping: Boolean(isTyping)
      });
    });

    socket.on("disconnect", () => {
      removeUserSocket(userId, socket.id);
      if (!isUserOnline(userId)) {
        io.emit("chat:user_online", { userId, isOnline: false });
      }
    });
  });
};
