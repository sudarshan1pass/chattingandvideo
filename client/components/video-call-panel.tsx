import { CallIcon } from "./call-icons";

const controls = [
  { icon: "mic", label: "Mute microphone" },
  { icon: "video", label: "Turn off camera" },
  { icon: "camera", label: "Switch camera" },
] as const;

export function VideoCallPanel() {
  return (
    <aside className="flex min-h-0 flex-col bg-[#131019] text-white">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs font-semibold uppercase text-[#ffcf70]">
            Video call
          </p>
          <p className="text-base font-semibold">Live with Maya</p>
        </div>
        <p className="rounded-[8px] bg-white/10 px-2.5 py-1 text-sm font-semibold">
          04:31
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="call-stage relative min-h-[17rem] flex-1 overflow-hidden rounded-[8px] border border-white/10">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#0e5967,#274c77_47%,#421b38)]" />
          <div className="absolute left-[10%] top-[12%] h-[45%] w-[38%] rounded-[8px] bg-[#f2c2a0]/20" />
          <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-[linear-gradient(180deg,transparent,rgba(8,7,14,0.92))]" />
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">Maya Frames</p>
              <p className="text-sm text-white/72">Camera on</p>
            </div>
            <span className="flex items-center gap-1 rounded-[8px] bg-[#17b26a] px-2 py-1 text-xs font-bold">
              HD
            </span>
          </div>

          <div className="absolute right-3 top-3 grid aspect-[4/5] w-[clamp(5.8rem,26%,7.8rem)] place-items-end overflow-hidden rounded-[8px] border border-white/20 bg-[linear-gradient(145deg,#ef476f,#ffa62b)] p-2 shadow-2xl">
            <span className="rounded-[8px] bg-black/35 px-2 py-1 text-xs font-semibold">
              You
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex items-center gap-2">
            {controls.map((control) => (
              <button
                aria-label={control.label}
                className="grid size-11 place-items-center rounded-[8px] border border-white/12 bg-white/10 text-white transition hover:bg-white/18"
                key={control.label}
                title={control.label}
                type="button"
              >
                <CallIcon name={control.icon} />
              </button>
            ))}
          </div>

          <button
            aria-label="End call"
            className="grid h-11 min-w-16 place-items-center rounded-[8px] bg-[#f04452] px-3 font-semibold transition hover:bg-[#d92d3b]"
            type="button"
          >
            End
          </button>
        </div>

        <div className="grid gap-2 rounded-[8px] border border-white/10 bg-white/[0.07] p-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-white/58">Audio</p>
            <p className="font-semibold">Studio earbuds</p>
          </div>
          <div>
            <p className="text-white/58">Network</p>
            <p className="font-semibold text-[#6ce9a6]">Stable</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
