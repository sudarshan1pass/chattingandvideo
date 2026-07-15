"use client";

import { useState } from "react";

export function ConversationPanel() {
  const [messages, setMessages] = useState([
    {
      body: "The color pass is done. Want to see the vertical cut before we post?",
      direction: "received",
      time: "4:28 PM",
    },
    {
      body: "Yes. Start a call and show me the transitions on screen.",
      direction: "sent",
      time: "4:29 PM",
    },
  ]);

  const [input, setInput] = useState("");

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const newMessage = {
      body: input,
      direction: "sent",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, newMessage]);
    setInput("");
  };

  return (
    <section className="flex min-h-0 flex-col bg-[#fcfafc]">

      <div className="space-y-3 p-5">
        {messages.map((message, index) => (
          <article
            key={index}
            className={`flex flex-col ${
              message.direction === "sent"
                ? "items-end"
                : "items-start"
            }`}
          >
            <p
              className={`max-w-[min(28rem,88%)] rounded-[8px] px-4 py-3 text-sm ${
                message.direction === "sent"
                  ? "bg-black text-white"
                  : "bg-white border"
              }`}
            >
              {message.body}
            </p>

            <time className="text-xs mt-1">
              {message.time}
            </time>
          </article>
        ))}
      </div>

      <form
        onSubmit={sendMessage}
        className="border-t bg-white p-3"
      >
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message..."
            className="flex-1 border text-black  rounded-lg px-3 py-2 "
          />

          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded-lg"
          >
            Send
          </button>
        </div>
      </form>
    </section>
  );
}
