"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CallIcon } from "@/components/call-icons";
import api from "../lib/api";
import { socket } from "../lib/socket";

type User = {
  id: string;
  name: string;
  email: string;
};

type Message = {
  id?: string;
  sender_id: string;
  receiver_id?: string;
  message: string;
  created_at?: string;
};

type IncomingCall = {
  callId: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  type: "audio" | "video";
  offer: RTCSessionDescriptionInit;
};

type CallEndedPayload = {
  callId?: string;
  message?: string;
  reason?: string;
};

const getMissedCallType = (text: string) => {
  if (text === "Missed audio call") return "audio";
  if (text === "Missed video call") return "video";

  return null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [message, setMessage] =
    useState("");

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);
  const [onlineUserIds, setOnlineUserIds] =
    useState<Set<string>>(new Set());
  const [incomingCall, setIncomingCall] =
    useState<IncomingCall | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      const storedUser =
        localStorage.getItem("user");

      if (storedUser && mounted) {
        setCurrentUser(
          JSON.parse(storedUser)
        );
      }

      try {
        const { data } =
          await api.get("/api/auth/users");

        if (data.success && mounted) {
          setUsers(data.users);
        }
      } catch (error) {
        console.log(error);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const handleOnlineUsers = (userIds: string[]) => {
      setOnlineUserIds(
        new Set(userIds.map((userId) => userId.toString()))
      );
    };

    const joinCurrentUser = () => {
      socket.emit("join", currentUser.id);
    };

    const handleIncomingCall = (call: IncomingCall) => {
      if (call.callerId === currentUser.id) return;

      setIncomingCall(call);
    };

    const handleCallEnded = (data: CallEndedPayload) => {
      setIncomingCall((call) =>
        call?.callId && call.callId === data.callId
          ? null
          : call
      );
    };

    const handleChatMessage = (chatMessage: Message) => {
      if (!selectedUser || !chatMessage.receiver_id) return;

      const isCurrentConversation =
        (chatMessage.sender_id === currentUser.id &&
          chatMessage.receiver_id === selectedUser.id) ||
        (chatMessage.sender_id === selectedUser.id &&
          chatMessage.receiver_id === currentUser.id);

      if (!isCurrentConversation) return;

      setMessages((prev) => {
        if (
          chatMessage.id &&
          prev.some((item) => item.id === chatMessage.id)
        ) {
          return prev;
        }

        return [...prev, chatMessage];
      });
    };

    socket.on("online-users", handleOnlineUsers);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-ended", handleCallEnded);
    socket.on("receive-message", handleChatMessage);
    socket.on("call-log-message", handleChatMessage);
    socket.on("connect", joinCurrentUser);

    socket.connect();

    if (socket.connected) {
      joinCurrentUser();
    }

    return () => {
      socket.off("online-users", handleOnlineUsers);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-ended", handleCallEnded);
      socket.off("receive-message", handleChatMessage);
      socket.off("call-log-message", handleChatMessage);
      socket.off("connect", joinCurrentUser);
    };
  }, [currentUser, selectedUser]);

  useEffect(() => {
    if (!selectedUser) return;

    let mounted = true;

    const loadChatHistory = async () => {
      try {
        const { data } = await api.get(
          `/api/chat/history/${selectedUser.id}`
        );

        if (data.success && mounted) {
          setMessages(data.chats);
        }
      } catch (error) {
        console.log(error);
      }
    };

    loadChatHistory();

    return () => {
      mounted = false;
    };
  }, [selectedUser]);

  const sendMessage = async () => {
    if (!message.trim() || !currentUser || !selectedUser) {
      return;
    }

    try {
      const { data } = await api.post(
        "/api/chat/send",
        {
          receiverId: selectedUser?.id,
          message,
        }
      );

      if (data.success) {
        const sentMessage = {
          id: data.messageId,
          sender_id: currentUser.id,
          receiver_id: selectedUser.id,
          message,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [
          ...prev,
          sentMessage,
        ]);
        socket.emit("send-message", sentMessage);

        setMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const startCall = (type: "audio" | "video") => {
    if (!selectedUser || !currentUser) {
      toast.error("Select a user first");
      return;
    }

    const path =
      type === "video" ? "/video-call" : "/audio-call";

    const query = new URLSearchParams({
      peerId: selectedUser.id,
      peerName: selectedUser.name,
    });

    router.push(`${path}?${query.toString()}`);
  };

  const acceptIncomingCall = () => {
    if (!incomingCall) return;

    sessionStorage.setItem(
      `incoming-call:${incomingCall.callId}`,
      JSON.stringify(incomingCall)
    );

    const path =
      incomingCall.type === "video"
        ? "/video-call"
        : "/audio-call";

    const query = new URLSearchParams({
      peerId: incomingCall.callerId,
      peerName: incomingCall.callerName,
      incoming: "1",
      callId: incomingCall.callId,
    });

    setIncomingCall(null);
    router.push(`${path}?${query.toString()}`);
  };

  const declineIncomingCall = () => {
    if (!incomingCall) return;

    socket.emit("end-call", {
      userId: incomingCall.callerId,
      callId: incomingCall.callId,
    });

    setIncomingCall(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    socket.disconnect();


    router.push("/login");
    toast.success(
      "logout suceesfuly"
    );

  };

  const selectedUserIsOnline =
    !!selectedUser && onlineUserIds.has(selectedUser.id);

  const getMessageSenderName = (msg: Message) => {
    if (msg.sender_id === currentUser?.id) {
      return currentUser.name;
    }

    if (msg.sender_id === selectedUser?.id) {
      return selectedUser.name;
    }

    return "Unknown user";
  };

  return (
    <main className="h-screen bg-gray-100">
      <div className="flex h-full overflow-hidden">

        {/* Sidebar */}
        <aside
          className={`
    ${selectedUser
              ? "hidden md:flex"
              : "flex"
            }
    w-full md:w-80
    flex-col
    border-r
    bg-white
  `}
        >
          <div className="border-b p-4">
            <div className="flex items-center justify-between">

              <div>
                <h1 className="text-2xl font-bold">
                  Messages
                </h1>

                <p className="text-sm text-gray-500">
                  {currentUser?.name || ""}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-500 px-3 py-2 text-white"
              >
                Logout
              </button>

            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {users.map((user) => {
              const isOnline = onlineUserIds.has(user.id);

              return (
              <button
                key={user.id}
                onClick={() =>
                  setSelectedUser(user)
                }
                className={`mb-3 flex w-full items-center gap-3 rounded-2xl p-3 transition ${selectedUser?.id === user.id
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-100"
                  }`}
              >
                <div className="relative shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  <span
                    className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                      isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>

                <div className="flex-1 text-left">
                  <h3 className="font-semibold">
                    {user.name}
                  </h3>

                  <p className="truncate text-sm opacity-70">
                    {user.email}
                  </p>

                  <p
                    className={`text-xs font-medium ${
                      selectedUser?.id === user.id
                        ? "text-white/75"
                        : isOnline
                          ? "text-green-600"
                          : "text-gray-500"
                    }`}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </button>
              );
            })}
          </div>
        </aside>

        {/* Chat Area */}
        <section
          className={`
          ${selectedUser ? "flex" : "hidden md:flex"}
          flex-1 flex-col bg-gray-50
        `}
        >
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">

                <div className="flex items-center gap-3">

                  <button
                    onClick={() =>
                      setSelectedUser(null)
                    }
                    className="rounded-lg p-2 hover:bg-gray-100 md:hidden"
                  >
                    ←
                  </button>

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold">
                    {selectedUser.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h2 className="font-bold">
                      {selectedUser.name}
                    </h2>

                    <p
                      className={`text-xs font-medium ${
                        selectedUserIsOnline
                          ? "text-green-500"
                          : "text-gray-500"
                      }`}
                    >
                      {selectedUserIsOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    aria-label="Start audio call"
                    className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-800 transition hover:bg-gray-200"
                    onClick={() => startCall("audio")}
                    title="Start audio call"
                    type="button"
                  >
                    <CallIcon name="audio" />
                  </button>

                  <button
                    aria-label="Start video call"
                    className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-800 transition hover:bg-gray-200"
                    onClick={() => startCall("video")}
                    title="Start video call"
                    type="button"
                  >
                    <CallIcon name="video" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {messages.map((msg, index) => {
                  const isSentByCurrentUser =
                    msg.sender_id === currentUser?.id;
                  const missedCallType =
                    getMissedCallType(msg.message);

                  return (
                    <div
                      key={msg.id || index}
                      className={`mb-3 flex ${
                        isSentByCurrentUser
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex max-w-[80%] flex-col ${
                          isSentByCurrentUser
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        <p className="mb-1 max-w-full truncate px-2 text-xs font-semibold text-gray-500">
                          {getMessageSenderName(msg)}
                        </p>

                        <div
                          className={`rounded-3xl px-4 py-3 shadow ${
                            isSentByCurrentUser
                              ? "bg-black text-white"
                              : "bg-white text-gray-900"
                          }`}
                        >
                          {missedCallType ? (
                            <span className="inline-flex items-center gap-2">
                              <CallIcon name={missedCallType} />
                              <span>{msg.message}</span>
                            </span>
                          ) : (
                            msg.message
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="border-t bg-white p-3">
                <div className="flex items-center gap-2 rounded-full border px-3 py-2">

                  <input
                    value={message}
                    onChange={(e) =>
                      setMessage(e.target.value)
                    }
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent outline-none"
                  />

                  <button
                    onClick={sendMessage}
                    className="rounded-full bg-black px-5 py-2 text-white"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="hidden flex-1 items-center justify-center md:flex">
              <h2 className="text-3xl font-bold text-gray-300">
                Select User
              </h2>
            </div>
          )}
        </section>
      </div>

      {incomingCall && (
        <div className="fixed inset-x-3 top-3 z-50 mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-white">
              {incomingCall.callerName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {incomingCall.callerName}
              </p>
              <p className="text-sm text-gray-500">
                Incoming {incomingCall.type} call
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              className="rounded-lg bg-gray-100 px-4 py-2 font-semibold text-gray-800"
              onClick={declineIncomingCall}
              type="button"
            >
              Decline
            </button>

            <button
              className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white"
              onClick={acceptIncomingCall}
              type="button"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
