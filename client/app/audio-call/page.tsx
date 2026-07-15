import { CallIcon } from "@/components/call-icons";

const controls = [
  { icon: "mic", label: "Mute microphone" },
  { icon: "audio", label: "Audio settings" },
  { icon: "info", label: "Call details" },
] as const;

export default function AudioCallPage() {
  return (
    <main className="grid min-h-svh bg-[#f4eef5] p-4 text-[#17121d]">
      <section className="mx-auto grid w-full max-w-3xl content-center gap-6">
        <div className="rounded-[8px] border border-[#dfd8e7] bg-white p-5 shadow-[0_24px_80px_rgba(37,24,48,0.14)] sm:p-8">
          <header className="flex items-center justify-between gap-4 border-b border-[#eee7f3] pb-5">
            <div>
              <p className="text-sm font-semibold uppercase text-[#8a4b74]">
                Audio call
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-normal">
                Maya Frames
              </h1>
            </div>
            <span className="rounded-[8px] bg-[#f0eaf5] px-3 py-1 text-sm font-semibold">
              04:31
            </span>
          </header>

          <div className="grid place-items-center gap-5 py-10">
            <div className="grid size-28 place-items-center rounded-full bg-gradient-to-br from-[#ff5d8f] via-[#f55c45] to-[#f6c453] text-3xl font-bold text-white shadow-xl">
              MF
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Connected</p>
              <p className="text-sm text-[#695f72]">Studio earbuds</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {controls.map((control) => (
              <button
                aria-label={control.label}
                className="grid size-12 place-items-center rounded-[8px] border border-[#dfd8e7] bg-[#f8f5fa] text-[#17121d] transition hover:bg-[#f0eaf5]"
                key={control.label}
                title={control.label}
                type="button"
              >
                <CallIcon name={control.icon} />
              </button>
            ))}

            <button
              className="h-12 rounded-[8px] bg-[#f04452] px-6 font-semibold text-white transition hover:bg-[#d92d3b]"
              type="button"
            >
              End
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
