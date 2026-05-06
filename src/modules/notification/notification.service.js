import Notification from "../../models/notification.model.js";
import User from "../../models/user.model.js";
import { getSocketIO } from "../../socket/io.js";

const notificationPopulate = {
  path: "recipientId",
  select: "name email role profileImage"
};

const emitNotification = (notification) => {
  const io = getSocketIO();

  if (!io) {
    return;
  }

  io.to(`user:${notification.recipientId._id || notification.recipientId}`).emit(
    "notification:new",
    notification
  );
};

const emitUnreadCount = async (recipientId) => {
  const io = getSocketIO();

  if (!io) {
    return;
  }

  const unreadCount = await Notification.countDocuments({
    recipientId,
    isRead: false
  });

  io.to(`user:${recipientId}`).emit("notification:unread_count", {
    recipientId,
    unreadCount
  });
};

export const createNotification = async ({
  recipientId,
  recipientRole,
  type,
  title,
  message,
  metadata = null
}) => {
  const notification = await Notification.create({
    recipientId,
    recipientRole,
    type,
    title,
    message,
    metadata
  });

  await notification.populate(notificationPopulate);
  emitNotification(notification);
  await emitUnreadCount(notification.recipientId._id?.toString?.() || notification.recipientId.toString());
  return notification;
};

export const createNotificationsForRole = async ({
  role,
  type,
  title,
  message,
  metadata = null
}) => {
  const users = await User.find({ role }).select("_id role");

  const notifications = await Promise.all(
    users.map((user) =>
      createNotification({
        recipientId: user._id,
        recipientRole: user.role,
        type,
        title,
        message,
        metadata
      })
    )
  );

  return notifications;
};

export const getMyNotifications = async (userId, query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = { recipientId: userId };

  if (query.isRead !== undefined) {
    filter.isRead = String(query.isRead) === "true";
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate(notificationPopulate)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipientId: userId, isRead: false })
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0
    }
  };
};

export const markNotificationAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    recipientId: userId
  }).populate(notificationPopulate);

  if (!notification) {
    return null;
  }

  notification.isRead = true;
  await notification.save();
  await emitUnreadCount(userId.toString());
  return notification;
};

export const markAllNotificationsAsRead = async (userId) => {
  await Notification.updateMany(
    { recipientId: userId, isRead: false },
    { $set: { isRead: true } }
  );
  await emitUnreadCount(userId.toString());

  return {
    updated: true
  };
};

export const getMyUnreadNotificationCount = async (userId) => {
  const unreadCount = await Notification.countDocuments({
    recipientId: userId,
    isRead: false
  });

  return { unreadCount };
};
