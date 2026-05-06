import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
  getMyNotificationsController,
  getMyUnreadNotificationCountController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController
} from "./notification.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getMyNotificationsController);
router.get("/unread-count", getMyUnreadNotificationCountController);
router.patch("/read-all", markAllNotificationsAsReadController);
router.patch("/:notificationId/read", markNotificationAsReadController);

export default router;
