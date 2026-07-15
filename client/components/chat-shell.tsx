import { ChatSidebar } from "./chat-sidebar";
import { ConversationPanel } from "./conversation-panel";
import { VideoCallPanel } from "./video-call-panel";

export function ChatShell() {
  return (
    <main className="grid min-h-svh bg-[#f4eef5] p-2 sm:p-4">
      <section className="chat-shell mx-auto grid min-h-[calc(100svh-1rem)] w-full max-w-[92rem] overflow-hidden rounded-[8px] border border-[#dfd8e7] bg-white shadow-[0_24px_80px_rgba(37,24,48,0.16)] sm:min-h-[calc(100svh-2rem)]">
        <ChatSidebar />
        <ConversationPanel />
        <VideoCallPanel />
      </section>
    </main>
  );
}
