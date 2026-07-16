const { saveMessage } = require("../controllers/chatcontroller");

const MISSED_CALL_TIMEOUT_MS = 45000;

const activeCalls = new Map();
const onlineUsers = new Map();

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const addUserSocket = (userId, socketId) => {
  const normalizedUserId = userId?.toString();

  if (!normalizedUserId) return null;

  const sockets =
    onlineUsers.get(normalizedUserId) || new Set();

  sockets.add(socketId);
  onlineUsers.set(normalizedUserId, sockets);

  return normalizedUserId;
};

const removeUserSocket = (userId, socketId) => {
  const normalizedUserId = userId?.toString();

  if (!normalizedUserId) return;

  const sockets = onlineUsers.get(normalizedUserId);

  if (!sockets) return;

  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(normalizedUserId);
  }
};

const emitOnlineUsers = (io) => {
  io.emit("online-users", getOnlineUserIds());
};

const isUserOnline = (userId) =>
  onlineUsers.has(userId?.toString());

const buildMissedCallText = (type) =>
  `Missed ${type === "video" ? "video" : "audio"} call`;

const clearCallTimer = (call) => {
  if (call?.timer) {
    clearTimeout(call.timer);
  }
};

const emitCallLogMessage = (io, chatMessage) => {
  io.to(chatMessage.sender_id).emit(
    "call-log-message",
    chatMessage
  );
  io.to(chatMessage.receiver_id).emit(
    "call-log-message",
    chatMessage
  );
};

const saveMissedCallMessage = async (io, call) => {
  if (!call || call.answered || call.logged) return null;

  call.logged = true;

  const text = buildMissedCallText(call.type);
  const messageId = await saveMessage(
    call.callerId,
    call.receiverId,
    text
  );

  const chatMessage = {
    id: messageId,
    sender_id: call.callerId,
    receiver_id: call.receiverId,
    message: text,
    created_at: new Date().toISOString(),
  };

  emitCallLogMessage(io, chatMessage);

  return chatMessage;
};

const finishCall = (callId) => {
  const call = activeCalls.get(callId);

  if (call) {
    clearCallTimer(call);
    activeCalls.delete(callId);
  }

  return call;
};

const timeoutMissedCall = async (io, callId) => {
  const call = activeCalls.get(callId);

  if (!call || call.answered) return;

  try {
    await saveMissedCallMessage(io, call);

    const payload = {
      callId,
      reason: "missed",
      message: buildMissedCallText(call.type),
    };

    io.to(call.callerId).emit("call-ended", payload);
    io.to(call.receiverId).emit("call-ended", payload);
  } catch (error) {
    console.error("Missed call save error:", {
      name: error.name,
      message: error.message,
    });
  } finally {
    finishCall(callId);
  }
};

module.exports = (io) => {
     io.on("connection", (socket) => {
    socket.emit("online-users", getOnlineUserIds());

    socket.on("join", (userId) => {
      const normalizedUserId = addUserSocket(userId, socket.id);

      if (!normalizedUserId) return;

      socket.data.userId = normalizedUserId;
      socket.join(normalizedUserId);
      emitOnlineUsers(io);
    });

    // Chat
    socket.on("send-message", (data) => {
      const receiverId =
        data?.receiverId || data?.receiver_id;

      if (!receiverId) return;

      io.to(receiverId.toString())
        .emit("receive-message", {
          ...data,
          receiver_id: receiverId.toString(),
        });
    });

    // Video Call
    socket.on("call-user", async (data) => {
      if (!data?.receiverId) return;

      const callId = data.callId?.toString();
      const callerId = data.callerId?.toString();
      const receiverId = data.receiverId?.toString();

      if (!callId || !callerId || !receiverId) return;

      const call = {
        callId,
        callerId,
        receiverId,
        type: data.type === "video" ? "video" : "audio",
        answered: false,
        logged: false,
      };

      activeCalls.set(callId, {
        ...call,
        timer: setTimeout(
          () => timeoutMissedCall(io, callId),
          MISSED_CALL_TIMEOUT_MS
        ),
      });

      if (!isUserOnline(receiverId)) {
        const activeCall = finishCall(callId) || call;

        try {
          await saveMissedCallMessage(io, activeCall);
        } catch (error) {
          console.error("Offline missed call save error:", {
            name: error.name,
            message: error.message,
          });
        }

        io.to(callerId).emit("call-unavailable", {
          callId,
          reason: "offline",
          message: buildMissedCallText(call.type),
        });
        return;
      }

      io.to(receiverId)
        .emit("incoming-call", {
          ...data,
          fromSocketId: socket.id,
        });
    });

    socket.on("answer-call", (data) => {
      if (!data?.callerId) return;

      const call = activeCalls.get(data.callId?.toString());

      if (call) {
        call.answered = true;
        clearCallTimer(call);
      }

      io.to(data.callerId.toString())
        .emit("call-accepted", data);
    });

    socket.on("ice-candidate", (data) => {
      if (!data?.userId) return;

      io.to(data.userId.toString())
        .emit("ice-candidate", data);
    });

    socket.on("end-call", async (data) => {
      if (!data?.userId) return;

      const call = finishCall(data.callId?.toString());

      if (call && !call.answered) {
        try {
          await saveMissedCallMessage(io, call);
        } catch (error) {
          console.error("Missed call save error:", {
            name: error.name,
            message: error.message,
          });
        }
      }

      io.to(data.userId.toString())
        .emit("call-ended", data);
    });

    socket.on("disconnect", () => {
      removeUserSocket(socket.data.userId, socket.id);
      emitOnlineUsers(io);
    });

  });
};
