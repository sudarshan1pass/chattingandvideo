import { VideoCallPanel } from "@/components/video-call-panel";

export default function VideoCallPage() {
  return (
    <main className="grid min-h-svh bg-[#f4eef5] p-4">
      <section className="mx-auto grid min-h-[calc(100svh-2rem)] w-full max-w-5xl overflow-hidden rounded-[8px] border border-[#dfd8e7] bg-[#131019] shadow-[0_24px_80px_rgba(37,24,48,0.16)]">
        <VideoCallPanel />
      </section>
    </main>
  );
}
