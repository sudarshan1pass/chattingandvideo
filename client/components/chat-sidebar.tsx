import { CallIcon } from "./call-icons";

const conversations = [
  {
    active: true,
    color: "from-[#ff5d8f] via-[#f55c45] to-[#f6c453]",
    handle: "maya.frames",
    initials: "MF",
    message: "Shared the rooftop reel",
    status: "Online",
    time: "now",
  },
  {
    color: "from-[#2f90ff] to-[#20c997]",
    handle: "noor.wav",
    initials: "NW",
    message: "Audio call ended",
    status: "Active 3m ago",
    time: "3m",
  },
  {
    color: "from-[#ef476f] to-[#8b5cf6]",
    handle: "studio.ri",
    initials: "SR",
    message: "Can you jump on video?",
    status: "Sent a photo",
    time: "17m",
  },
  {
    color: "from-[#00b4d8] to-[#4361ee]",
    handle: "devon.live",
    initials: "DL",
    message: "Typing...",
    status: "Recording",
    time: "1h",
  },
];

export function ChatSidebar() {
  return (
    <aside className="flex min-h-0 flex-col border-b border-[#dfd8e7] bg-white/88 lg:border-b-0 lg:border-r">
      <header className="border-b border-[#eee7f3] px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            {/* <p className="text-sm font-semibold text-[#6f6679]">
              ari.clips
            </p> */}
            <h1 className="text-[1.65rem] font-bold tracking-normal text-[#17121d]">
              Messages
            </h1>
          </div>
          <button
            aria-label="Start a new message"
            className="icon-button text-[#17121d]"
            type="button"
          >
            <CallIcon name="compose" />
          </button>
        </div>

        <label className="mt-4 flex h-11 items-center gap-3 rounded-[8px] bg-[#f4f1f6] px-3 text-[#716777]">
          <CallIcon name="search" />
          <span className="sr-only">Search chats</span>
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-[#17121d] outline-none placeholder:text-[#716777]"
            placeholder="Search"
            type="search"
          />
        </label>
      </header>

      <div className="flex min-h-0 gap-2 overflow-x-auto p-3 lg:flex flex-wrap lg:overflow-y-auto">
        {conversations.map((conversation) => (
          <button
            key={conversation.handle}
            type="button"
            className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-[#f6f1f7] ${conversation.active
                ? "bg-[#f0eaf5] ring-1 ring-[#e7d5f0]"
                : ""
              }`}
          >
            <div className="relative shrink-0">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${conversation.color} text-sm font-bold text-white`}
              >
                {conversation.initials}
              </div>

              {conversation.status === "Online" && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
              )}
            </div>

            <div className="min-w-0 flex-1 ">
              <div className="flex items-center justify-between">
                <p className="truncate font-semibold text-[#19131f]">
                  {conversation.handle}
                </p>

                <span className="text-xs text-gray-500">
                  {conversation.time}
                </span>
              </div>

              <p className="truncate text-sm text-[#695f72]">
                {conversation.message}
              </p>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}



