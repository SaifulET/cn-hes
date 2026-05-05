import AppError from "../../helpers/appError.js";

export const validateStartConversationInput = ({ receiverId }) => {
  if (!receiverId) {
    throw new AppError("receiverId is required.");
  }
};

export const validateSendMessageInput = ({ receiverId, text }) => {
  if (!receiverId || !text?.trim()) {
    throw new AppError("receiverId and text are required.");
  }
};
