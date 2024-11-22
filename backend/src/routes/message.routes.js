import express from "express";

import {
  sendMessage,
  getMessages,
  markMessageAsRead,
  deleteMessage,
} from "../controllers/message.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Send a new message
router.post("/send/:id", upload.array("attachments", 10), sendMessage);

// Get messages between two users
router.get("/:receiverId", getMessages);

// Mark message as read
router.patch("/:messageId/read", markMessageAsRead);

// Delete a message
router.delete("/:messageId", deleteMessage);

export default router;
