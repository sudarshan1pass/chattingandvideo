const express = require("express");

const router = express.Router();

const {
  saveMessage,
  getChatHistory,
} = require("../controllers/chatController");

const authMiddleware = require("../middleware/authMiddleware");


// ================= SEND MESSAGE =================

router.post("/send", authMiddleware, async (req, res) => {

  try {

    const senderId = req.user.id;

    const { receiverId, message } = req.body;

    console.log({
      senderId,
      receiverId,
      message
    });

    console.log("BODY =>", req.body);
    const messageId = await saveMessage(
      senderId,
      receiverId,
      message
    );


    res.status(200).json({
      success: true,
      message: "Message Saved",
      messageId,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


// ================= CHAT HISTORY =================

router.get(
  "/history/:user2",
  authMiddleware,
  async (req, res) => {

    try {

      const user1 = req.user.id;

      const { user2 } = req.params;

      const chats = await getChatHistory(
        user1,
        user2
      );

      res.status(200).json({
        success: true,
        chats,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

module.exports = router;