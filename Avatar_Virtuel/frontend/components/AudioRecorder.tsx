"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  disabled?: boolean;
  onRecorded: (blob: Blob, filename: string) => void;
};

export default function AudioRecorder({ disabled, onRecorded }: Props) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
    }
  }, []);

  async function start() {
    if (disabled || recording) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "audio/mp4";
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: mime });
      const ext = mime.includes("webm") ? "webm" : "m4a";
      onRecorded(blob, `question.${ext}`);
    };
    mediaRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stop() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  if (!supported) {
    return <p className="hint">Micro non supporté sur ce navigateur.</p>;
  }

  return (
    <div className="rec">
      {!recording ? (
        <button type="button" className="btn ghost" disabled={disabled} onClick={start}>
          Parler au micro
        </button>
      ) : (
        <button type="button" className="btn danger" onClick={stop}>
          Arrêter l&apos;enregistrement
        </button>
      )}
      <style jsx>{`
        .rec {
          display: inline-flex;
        }
        .hint {
          margin: 0;
          color: var(--muted);
          font-size: 0.9rem;
        }
        .btn {
          border: 1px solid var(--line);
          background: transparent;
          color: var(--ink);
          padding: 0.7rem 1rem;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: var(--accent-soft);
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn.danger {
          border-color: rgba(194, 59, 59, 0.7);
          color: #ffd4d4;
          animation: blink 1.2s ease-in-out infinite;
        }
        @keyframes blink {
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
