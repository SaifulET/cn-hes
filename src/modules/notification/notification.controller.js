import asyncHandler from "../../helpers/asyncHandler.js";
import { sendSuccess } from "../../helpers/apiResponse.js";
import {
  getMyNotifications,
  getMyUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from "./notification.service.js";
import {
  validateNotificationId,
  validateNotificationListQuery
} from "./notification.validation.js";

export const getMyNotificationsController = asyncHandler(async (req, res) => {
  validateNotificationListQuery(req.query);
  const result = await getMyNotifications(req.user._id, req.query);
  return sendSuccess(res, "Notifications fetched successfully.", result);
});

export const getMyUnreadNotificationCountController = asyncHandler(async (req, res) => {
  const result = await getMyUnreadNotificationCount(req.user._id);
  return sendSuccess(res, "Unread notification count fetched successfully.", result);
});

export const markNotificationAsReadController = asyncHandler(async (req, res) => {
  validateNotificationId(req.params.notificationId);
  const notification = await markNotificationAsRead(req.user._id, req.params.notificationId);
  return sendSuccess(res, "Notification marked as read successfully.", {
    notification
  });
});

export const markAllNotificationsAsReadController = asyncHandler(async (req, res) => {
  const result = await markAllNotificationsAsRead(req.user._id);
  return sendSuccess(res, "All notifications marked as read successfully.", result);
});
