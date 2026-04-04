import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  startConversation,
  getInboxConversations,
  getMessageRequests,
  getUnreadSummary,
  getConversationMessages,
  sendMessage,
  acceptMessageRequest,
  togglePinConversation,
  toggleMuteConversation,
  toggleBlockConversation,
  deleteConversationForCurrentUser,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.post("/start", protect, startConversation);
router.get("/", protect, getInboxConversations);
router.get("/requests", protect, getMessageRequests);
router.get("/unread-summary", protect, getUnreadSummary);

router.get("/:conversationId/messages", protect, getConversationMessages);
router.post("/:conversationId/messages", protect, sendMessage);

router.patch("/:conversationId/accept", protect, acceptMessageRequest);
router.patch("/:conversationId/pin", protect, togglePinConversation);
router.patch("/:conversationId/mute", protect, toggleMuteConversation);
router.patch("/:conversationId/block", protect, toggleBlockConversation);

router.delete("/:conversationId", protect, deleteConversationForCurrentUser);

export default router;