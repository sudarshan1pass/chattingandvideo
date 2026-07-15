"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CallIcon } from "./call-icons";
import { socket } from "@/app/lib/socket";

type CallType = "audio" | "video";

type StoredUser = {
  id: string;
  name: string;
  email?: string;
};

type CallPayload = {
  callId: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName?: string;
  type: CallType;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

type LiveCallProps = {
  callType: CallType;
};

const rtcConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const createCallId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getStoredUser = () => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  return JSON.parse(storedUser) as StoredUser;
};

export function LiveCall({ callType }: LiveCallProps) {
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const queuedCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callIdRef = useRef("");
  const peerIdRef = useRef("");
  const startedRef = useRef(false);

  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [peerName, setPeerName] = useState("Contact");
  const [status, setStatus] = useState("Preparing call");
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(callType === "video");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let mounted = true;

    const setRemoteStream = (track: MediaStreamTrack) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }

      const hasTrack = remoteStreamRef.current
        .getTracks()
        .some((existingTrack) => existingTrack.id === track.id);

      if (!hasTrack) {
        remoteStreamRef.current.addTrack(track);
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
      }
    };

    const flushQueuedCandidates = async () => {
      const peerConnection = peerConnectionRef.current;

      if (!peerConnection?.remoteDescription) {
        return;
      }

      const candidates = queuedCandidatesRef.current.splice(0);

      for (const candidate of candidates) {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    };

    const createPeerConnection = (remoteUserId: string) => {
      const peerConnection = new RTCPeerConnection(rtcConfig);

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            callId: callIdRef.current,
            userId: remoteUserId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      peerConnection.ontrack = (event) => {
        setRemoteStream(event.track);
      };

      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;

        if (state === "connected") {
          setStatus("Connected");
        }

        if (
          state === "failed" ||
          state === "disconnected"
        ) {
          setStatus("Connection interrupted");
        }
      };

      peerConnectionRef.current = peerConnection;
      return peerConnection;
    };

    const setupLocalMedia = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera and microphone are not available in this browser"
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    };

    const addLocalTracks = (
      peerConnection: RTCPeerConnection,
      stream: MediaStream
    ) => {
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });
    };

    const handleAccepted = async (data: CallPayload) => {
      if (data.callId !== callIdRef.current || !data.answer) {
        return;
      }

      const peerConnection = peerConnectionRef.current;

      if (!peerConnection) return;

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
      await flushQueuedCandidates();
      setStatus("Connected");
    };

    const handleCandidate = async (
      data: CallPayload | RTCIceCandidateInit
    ) => {
      if (
        "callId" in data &&
        data.callId &&
        data.callId !== callIdRef.current
      ) {
        return;
      }

      const candidate =
        "callId" in data
          ? data.candidate
          : data;

      if (!candidate) return;

      const peerConnection = peerConnectionRef.current;

      if (!peerConnection?.remoteDescription) {
        queuedCandidatesRef.current.push(candidate);
        return;
      }

      await peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    };

    const handleEnded = (data?: Partial<CallPayload>) => {
      if (
        data?.callId &&
        callIdRef.current &&
        data.callId !== callIdRef.current
      ) {
        return;
      }

      toast("Call ended");
      cleanup();
      router.push("/dashboard");
    };

    const cleanup = () => {
      socket.off("call-accepted", handleAccepted);
      socket.off("ice-candidate", handleCandidate);
      socket.off("call-ended", handleEnded);

      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;

      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
      remoteStreamRef.current = null;
    };

    const start = async () => {
      try {
        const user = getStoredUser();

        if (!user) {
          router.push("/login");
          return;
        }

        if (!mounted) return;

        setCurrentUser(user);
        socket.connect();
        socket.emit("join", user.id);

        const params = new URLSearchParams(window.location.search);
        const peerId = params.get("peerId");
        const incoming = params.get("incoming") === "1";
        const queryCallId = params.get("callId");
        const queryPeerName = params.get("peerName") || "Contact";

        if (!peerId) {
          setStatus("No contact selected");
          return;
        }

        peerIdRef.current = peerId;
        setPeerName(queryPeerName);

        socket.on("call-accepted", handleAccepted);
        socket.on("ice-candidate", handleCandidate);
        socket.on("call-ended", handleEnded);

        const stream = await setupLocalMedia();
        const peerConnection = createPeerConnection(peerId);
        addLocalTracks(peerConnection, stream);

        if (incoming) {
          if (!queryCallId) {
            throw new Error("Missing call id");
          }

          const storedCall = sessionStorage.getItem(
            `incoming-call:${queryCallId}`
          );

          if (!storedCall) {
            throw new Error("Incoming call data expired");
          }

          const incomingCall = JSON.parse(storedCall) as CallPayload;

          if (!incomingCall.offer) {
            throw new Error("Incoming call has no offer");
          }

          callIdRef.current = incomingCall.callId;
          setPeerName(incomingCall.callerName);
          setStatus("Answering");

          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(incomingCall.offer)
          );
          await flushQueuedCandidates();

          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          socket.emit("answer-call", {
            callId: incomingCall.callId,
            callerId: incomingCall.callerId,
            receiverId: user.id,
            receiverName: user.name,
            type: incomingCall.type,
            answer,
          });

          sessionStorage.removeItem(
            `incoming-call:${queryCallId}`
          );
          setStatus("Connected");
          return;
        }

        const callId = queryCallId || createCallId();
        callIdRef.current = callId;
        setStatus("Calling");

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit("call-user", {
          callId,
          callerId: user.id,
          callerName: user.name,
          receiverId: peerId,
          receiverName: queryPeerName,
          type: callType,
          offer,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to start call";

        setStatus(message);
        toast.error(message);
      }
    };

    start();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [callType, router]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = muted;
    });

    setMuted((value) => !value);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !cameraOn;
    });

    setCameraOn((value) => !value);
  };

  const endCall = () => {
    if (peerIdRef.current) {
      socket.emit("end-call", {
        userId: peerIdRef.current,
        callId: callIdRef.current,
      });
    }

    router.push("/dashboard");
  };

  return (
    <main className="grid min-h-svh bg-[#f4eef5] p-3 text-[#17121d] sm:p-4">
      <section className="mx-auto grid min-h-[calc(100svh-1.5rem)] w-full max-w-5xl overflow-hidden rounded-[8px] border border-[#dfd8e7] bg-white shadow-[0_24px_80px_rgba(37,24,48,0.16)] sm:min-h-[calc(100svh-2rem)]">
        <div className="grid min-h-0 grid-rows-[auto_1fr_auto] bg-[#131019] text-white">
          <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-[#ffcf70]">
                {callType === "video" ? "Video call" : "Audio call"}
              </p>
              <h1 className="truncate text-lg font-semibold">
                {peerName}
              </h1>
            </div>

            <span className="rounded-[8px] bg-white/10 px-3 py-1 text-sm font-semibold">
              {status}
            </span>
          </header>

          <div className="grid min-h-0 place-items-center p-3 sm:p-4">
            {callType === "video" ? (
              <div className="relative h-full min-h-[25rem] w-full overflow-hidden rounded-[8px] border border-white/10 bg-[#08070e]">
                <video
                  autoPlay
                  className="h-full w-full object-cover"
                  playsInline
                  ref={remoteVideoRef}
                />
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{peerName}</p>
                    <p className="text-sm text-white/70">{status}</p>
                  </div>
                </div>

                <video
                  autoPlay
                  className="absolute right-3 top-3 aspect-[4/5] w-[clamp(6rem,24%,9rem)] rounded-[8px] border border-white/20 bg-black object-cover shadow-2xl"
                  muted
                  playsInline
                  ref={localVideoRef}
                />
              </div>
            ) : (
              <div className="grid w-full max-w-xl place-items-center gap-5 rounded-[8px] border border-white/10 bg-white/[0.07] px-4 py-12 text-center">
                <div className="grid size-28 place-items-center rounded-full bg-gradient-to-br from-[#ff5d8f] via-[#f55c45] to-[#f6c453] text-3xl font-bold text-white shadow-xl">
                  {peerName
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-xl font-semibold">{peerName}</p>
                  <p className="mt-1 text-sm text-white/68">{status}</p>
                </div>
              </div>
            )}

            <audio autoPlay ref={remoteAudioRef} />
          </div>

          <footer className="flex flex-wrap items-center justify-center gap-3 border-t border-white/10 px-4 py-4">
            <button
              aria-label={muted ? "Unmute microphone" : "Mute microphone"}
              className={`grid size-12 place-items-center rounded-[8px] border border-white/12 transition ${
                muted
                  ? "bg-[#f04452] text-white"
                  : "bg-white/10 text-white hover:bg-white/18"
              }`}
              onClick={toggleMute}
              title={muted ? "Unmute microphone" : "Mute microphone"}
              type="button"
            >
              <CallIcon name="mic" />
            </button>

            {callType === "video" && (
              <button
                aria-label={cameraOn ? "Turn off camera" : "Turn on camera"}
                className={`grid size-12 place-items-center rounded-[8px] border border-white/12 transition ${
                  cameraOn
                    ? "bg-white/10 text-white hover:bg-white/18"
                    : "bg-[#f04452] text-white"
                }`}
                onClick={toggleCamera}
                title={cameraOn ? "Turn off camera" : "Turn on camera"}
                type="button"
              >
                <CallIcon name="video" />
              </button>
            )}

            <button
              className="h-12 rounded-[8px] bg-[#f04452] px-7 font-semibold text-white transition hover:bg-[#d92d3b]"
              onClick={endCall}
              type="button"
            >
              End
            </button>
          </footer>
        </div>
      </section>
    </main>
  );
}
