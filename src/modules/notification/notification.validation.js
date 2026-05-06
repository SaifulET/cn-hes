import mongoose from "mongoose";
import AppError from "../../helpers/appError.js";

export const validateNotificationListQuery = ({ page, limit, isRead }) => {
  if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) <= 0)) {
    throw new AppError("page must be a positive integer.");
  }

  if (limit !== undefined && (!Number.isInteger(Number(limit)) || Number(limit) <= 0)) {
    throw new AppError("limit must be a positive integer.");
  }

  if (isRead !== undefined && !["true", "false"].includes(String(isRead))) {
    throw new AppError("isRead must be true or false.");
  }
};

export const validateNotificationId = (notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new AppError("Invalid notification id.");
  }
};
