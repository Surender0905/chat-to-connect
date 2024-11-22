import Message from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Get messages between two users
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "username profilePic")
      .populate("receiver", "username profilePic");

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    throw new ApiError(500, error?.message || "Error fetching messages");
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const receiverId = req.params.id;
    const files = req.files;
    const senderId = req.user._id;

    let attachments = [];

    // Handle file uploads if any
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await uploadOnCloudinary(file.path);
        if (result) {
          attachments.push({
            url: result.secure_url,
            type: result.resource_type,
            name: file.originalname,
            size: file.size,
          });
        }
      }
    }

    // Create and save the message
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      attachments,
    });

    // Populate sender and receiver details
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profilePic")
      .populate("receiver", "username profilePic");

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    throw new ApiError(500, error?.message || "Error sending message");
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { readAt: new Date() },
      { new: true }
    );

    if (!message) {
      throw new ApiError(404, "Message not found");
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    throw new ApiError(500, error?.message || "Error marking message as read");
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      throw new ApiError(404, "Message not found");
    }

    // Verify message ownership
    if (message.sender.toString() !== userId.toString()) {
      throw new ApiError(403, "Unauthorized to delete this message");
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    throw new ApiError(500, error?.message || "Error deleting message");
  }
};
