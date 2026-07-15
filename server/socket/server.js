const { saveMessage } = require('../controllers/chatController');

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
      io.to(data.receiverId.toString())
        .emit("incoming-call", data);
    });

    socket.on("answer-call", (data) => {
      io.to(data.callerId.toString())
        .emit("call-accepted", data);
    });

    socket.on("ice-candidate", (data) => {
      io.to(data.userId.toString())
        .emit("ice-candidate", data.candidate);
    });

    socket.on("end-call", (data) => {
      io.to(data.userId.toString())
        .emit("call-ended");
    });

  });
};