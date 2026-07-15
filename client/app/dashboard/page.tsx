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
  sender_id: string;
  receiver_id?: string;
  message: string;
};

type IncomingCall = {
  callId: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  type: "audio" | "video";
  offer: RTCSessionDescriptionInit;
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
  const [incomingCall, setIncomingCall] =
    useState<IncomingCall | null>(null);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

    if (storedUser) {
      setCurrentUser(
        JSON.parse(storedUser)
      );
    }

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    socket.connect();
    socket.emit("join", currentUser.id);

    const handleIncomingCall = (call: IncomingCall) => {
      if (call.callerId === currentUser.id) return;

      setIncomingCall(call);
    };

    socket.on("incoming-call", handleIncomingCall);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
    };
  }, [currentUser]);

  useEffect(() => {
    if (selectedUser) {
      fetchChatHistory();
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const { data } =
        await api.get("/api/auth/users");

      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const { data } = await api.get(
        `/api/chat/history/${selectedUser?.id}`
      );

      if (data.success) {
        setMessages(data.chats);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      const { data } = await api.post(
        "/api/chat/send",
        {
          receiverId: selectedUser?.id,
          message,
        }
      );

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender_id: currentUser?.id || "",
            receiver_id:
              selectedUser?.id,
            message,
          },
        ]);

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


    router.push("/login");
    toast.success(
      "logout suceesfuly"
    );

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
            {users.map((user) => (
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
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 text-left">
                  <h3 className="font-semibold">
                    {user.name}
                  </h3>

                  <p className="truncate text-sm opacity-70">
                    {user.email}
                  </p>
                </div>
              </button>
            ))}
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

                    <p className="text-xs text-green-500">
                      Online
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
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-3 flex ${msg.sender_id === currentUser?.id
                      ? "justify-end"
                      : "justify-start"
                      }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-3xl px-4 py-3 shadow ${msg.sender_id === currentUser?.id
                        ? "bg-black text-white"
                        : "bg-white"
                        }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
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
