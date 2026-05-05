import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
  getConversationMessagesController,
  getMyConversationsController,
  markConversationAsReadController,
  sendMessageController,
  startConversationController
} from "./chat.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/conversations", startConversationController);
router.get("/conversations", getMyConversationsController);
router.get("/conversations/:conversationId/messages", getConversationMessagesController);
router.post("/messages", sendMessageController);
router.patch("/conversations/:conversationId/read", markConversationAsReadController);

export default router;
