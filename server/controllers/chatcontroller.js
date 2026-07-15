const mongoose = require("mongoose");
const Message = require("../models/Message");

const toChatResponse = (message) => ({
  id: message._id.toString(),
  sender_id: message.senderId.toString(),
  receiver_id: message.receiverId.toString(),
  message: message.message,
  created_at: message.createdAt,
});

const ensureObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${label}`);
  }
};

const saveMessage = async (
  senderId,
  receiverId,
  message
) => {
  try {
    ensureObjectId(senderId, "senderId");
    ensureObjectId(receiverId, "receiverId");

    const savedMessage = await Message.create({
      senderId,
      receiverId,
      message,
    });

    return savedMessage._id.toString();
  } catch (error) {
    console.error("Message save error:", {
      name: error.name,
      message: error.message,
    });
    throw error;
  }
};

const getChatHistory = async (user1, user2) => {
  try {
    ensureObjectId(user1, "user1");
    ensureObjectId(user2, "user2");

    const messages = await Message.find({
      $or: [
        {
          senderId: user1,
          receiverId: user2,
        },
        {
          senderId: user2,
          receiverId: user1,
        },
      ],
    }).sort({ createdAt: 1 });

    return messages.map(toChatResponse);
  } catch (error) {
    console.error("Chat history query error:", {
      name: error.name,
      message: error.message,
    });
    throw error;
  }
};

module.exports = {
  saveMessage,
  getChatHistory,
};
