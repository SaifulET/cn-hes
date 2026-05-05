import mongoose from "mongoose";
import AppError from "../../helpers/appError.js";
import Conversation from "../../models/conversation.model.js";
import Message from "../../models/message.model.js";
import User from "../../models/user.model.js";
import { isUserOnline } from "../../helpers/socketStore.js";

const conversationPopulate = {
  path: "participants",
  select: "name profileImage role"
};

const messagePopulate = {
  path: "senderId receiverId",
  select: "name profileImage role"
};

const ensureValidObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}.`);
  }
};

const formatParticipant = (participant) => ({
  id: participant._id,
  name: participant.name,
  profileImage: participant.profileImage,
  role: participant.role,
  isOnline: isUserOnline(participant._id.toString())
});

const getParticipantIdString = (participant) => {
  return participant?._id?.toString?.() || participant?.toString?.() || "";
};

export const formatMessage = (message) => ({
  id: message._id,
  conversationId: message.conversationId,
  text: message.text,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  readBy: message.readBy,
  sender: message.senderId?._id
    ? {
        id: message.senderId._id,
        name: message.senderId.name,
        profileImage: message.senderId.profileImage,
        role: message.senderId.role
      }
    : message.senderId,
  receiver: message.receiverId?._id
    ? {
        id: message.receiverId._id,
        name: message.receiverId.name,
        profileImage: message.receiverId.profileImage,
        role: message.receiverId.role
      }
    : message.receiverId
});

export const ensureConversationForUsers = async (userId, receiverId) => {
  ensureValidObjectId(receiverId, "receiver id");

  if (userId === receiverId) {
    throw new AppError("You cannot chat with yourself.");
  }

  const receiver = await User.findById(receiverId);

  if (!receiver) {
    throw new AppError("Receiver not found.", 404);
  }

  let conversation = await Conversation.findOne({
    participants: {
      $all: [userId, receiverId],
      $size: 2
    }
  }).populate(conversationPopulate);

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, receiverId]
    });
    await conversation.populate(conversationPopulate);
  }

  return conversation;
};

export const formatConversationListItem = async (conversationId, currentUserId) => {
  const conversation = await Conversation.findById(conversationId)
    .populate(conversationPopulate)
    .populate("lastMessage");

  if (!conversation) {
    throw new AppError("Conversation not found.", 404);
  }

  const otherParticipant = conversation.participants.find(
    (participant) => participant._id.toString() !== currentUserId.toString()
  );

  const unreadCount = await Message.countDocuments({
    conversationId: conversation._id,
    receiverId: currentUserId,
    readBy: { $ne: currentUserId }
  });

  return {
    id: conversation._id,
    participant: otherParticipant ? formatParticipant(otherParticipant) : null,
    lastMessageText: conversation.lastMessageText,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount
  };
};

export const getMyConversations = async (userId) => {
  const conversations = await Conversation.find({
    participants: userId
  })
    .populate(conversationPopulate)
    .sort({ lastMessageAt: -1 });

  const items = await Promise.all(
    conversations.map((conversation) => formatConversationListItem(conversation._id, userId))
  );

  return items;
};

export const getConversationMessagesForUser = async (userId, conversationId) => {
  ensureValidObjectId(conversationId, "conversation id");

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId
  });

  if (!conversation) {
    throw new AppError("Conversation not found.", 404);
  }

  const messages = await Message.find({ conversationId })
    .populate(messagePopulate)
    .sort({ createdAt: 1 });

  return messages.map(formatMessage);
};

export const persistMessage = async ({ senderId, receiverId, text, conversationId }) => {
  if (!text?.trim()) {
    throw new AppError("Message text is required.");
  }

  let conversation;

  if (conversationId) {
    ensureValidObjectId(conversationId, "conversation id");
    conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId
    });

    if (!conversation) {
      throw new AppError("Conversation not found.", 404);
    }
  } else {
    conversation = await ensureConversationForUsers(senderId, receiverId);
  }

  const normalizedParticipantIds = conversation.participants.map(getParticipantIdString);
  const actualReceiverId =
    receiverId ||
    normalizedParticipantIds.find((participantId) => participantId !== senderId.toString());

  if (!actualReceiverId) {
    throw new AppError("Receiver not found.");
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    receiverId: actualReceiverId,
    text: text.trim(),
    readBy: [senderId]
  });

  conversation.lastMessage = message._id;
  conversation.lastMessageText = message.text;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  const populatedMessage = await Message.findById(message._id).populate(messagePopulate);

  return formatMessage(populatedMessage);
};

export const markConversationAsRead = async (userId, conversationId) => {
  ensureValidObjectId(conversationId, "conversation id");

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId
  });

  if (!conversation) {
    throw new AppError("Conversation not found.", 404);
  }

  const unreadMessages = await Message.find({
    conversationId,
    receiverId: userId,
    readBy: { $ne: userId }
  });

  const readMessageIds = unreadMessages.map((message) => message._id);

  if (readMessageIds.length) {
    await Message.updateMany(
      { _id: { $in: readMessageIds } },
      { $addToSet: { readBy: userId } }
    );
  }

  return {
    conversationId,
    readMessageIds
  };
};

export const startConversation = async (userId, receiverId) => {
  const conversation = await ensureConversationForUsers(userId, receiverId);
  return formatConversationListItem(conversation._id, userId);
};
