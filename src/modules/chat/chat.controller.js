import asyncHandler from "../../helpers/asyncHandler.js";
import { sendSuccess } from "../../helpers/apiResponse.js";
import {
  getConversationMessagesForUser,
  getMyConversations,
  markConversationAsRead,
  persistMessage,
  startConversation
} from "./chat.service.js";
import {
  validateSendMessageInput,
  validateStartConversationInput
} from "./chat.validation.js";

export const startConversationController = asyncHandler(async (req, res) => {
  validateStartConversationInput(req.body);
  const conversation = await startConversation(req.user._id, req.body.receiverId);
  return sendSuccess(res, "Conversation started successfully.", { conversation }, 201);
});

export const getMyConversationsController = asyncHandler(async (req, res) => {
  const conversations = await getMyConversations(req.user._id);
  return sendSuccess(res, "Conversations fetched successfully.", { conversations });
});

export const getConversationMessagesController = asyncHandler(async (req, res) => {
  const messages = await getConversationMessagesForUser(req.user._id, req.params.conversationId);
  return sendSuccess(res, "Messages fetched successfully.", { messages });
});

export const sendMessageController = asyncHandler(async (req, res) => {
  validateSendMessageInput(req.body);
  const message = await persistMessage({
    senderId: req.user._id,
    receiverId: req.body.receiverId,
    text: req.body.text,
    conversationId: req.body.conversationId
  });
  return sendSuccess(res, "Message sent successfully.", { message }, 201);
});

export const markConversationAsReadController = asyncHandler(async (req, res) => {
  const result = await markConversationAsRead(req.user._id, req.params.conversationId);
  return sendSuccess(res, "Conversation marked as read.", result);
});
