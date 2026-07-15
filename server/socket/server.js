const { saveMessage } = require('../controllers/chatcontroller');

module.exports = (io) => {
     io.on("connection", (socket) => {

    socket.on("join", (userId) => {
      socket.join(userId.toString());
    });

    // Chat
    socket.on("send-message", (data) => {
      io.to(data.receiverId.toString())
        .emit("receive-message", data);
    });

    // Video Call
    socket.on("call-user", (data) => {
      if (!data?.receiverId) return;

      io.to(data.receiverId.toString())
        .emit("incoming-call", {
          ...data,
          fromSocketId: socket.id,
        });
    });

    socket.on("answer-call", (data) => {
      if (!data?.callerId) return;

      io.to(data.callerId.toString())
        .emit("call-accepted", data);
    });

    socket.on("ice-candidate", (data) => {
      if (!data?.userId) return;

      io.to(data.userId.toString())
        .emit("ice-candidate", data);
    });

    socket.on("end-call", (data) => {
      if (!data?.userId) return;

      io.to(data.userId.toString())
        .emit("call-ended", data);
    });

  });
};
