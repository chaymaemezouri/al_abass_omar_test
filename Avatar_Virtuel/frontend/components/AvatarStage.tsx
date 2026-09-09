"use client";

import { useEffect, useRef } from "react";

type Props = {
  videoUrl: string | null;
  idle: boolean;
  speaking: boolean;
};

export default function AvatarStage({ videoUrl, idle, speaking }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoUrl) return;
    el.load();
    el.play().catch(() => undefined);
  }, [videoUrl]);

  return (
    <section className="avatar-stage" aria-label="Avatar du candidat">
      <div className={`frame ${speaking ? "speaking" : ""} ${idle ? "idle" : ""}`}>
        {videoUrl ? (
          <video ref={videoRef} src={videoUrl} controls playsInline className="avatar-video" />
        ) : (
          <div className="portrait">
            <div className="portrait-glow" />
            <div className="portrait-core">
              <span className="initials">AO</span>
              <p>Al Abass Omar</p>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .avatar-stage {
          width: 100%;
          min-height: 320px;
        }
        .frame {
          position: relative;
          overflow: hidden;
          width: 100%;
          aspect-ratio: 16 / 10;
          background:
            linear-gradient(180deg, rgba(20, 40, 55, 0.2), rgba(8, 14, 20, 0.85)),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23d4c4a8' stroke-opacity='0.08'%3E%3Cpath d='M0 40h80M40 0v80'/%3E%3C/g%3E%3C/svg%3E");
          border-bottom: 1px solid var(--line);
          animation: breathe 6s ease-in-out infinite;
        }
        .frame.speaking {
          box-shadow: inset 0 0 0 2px rgba(196, 92, 38, 0.45);
        }
        .avatar-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .portrait {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
        }
        .portrait-glow {
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232, 168, 124, 0.35), transparent 70%);
          animation: pulse 3.2s ease-in-out infinite;
        }
        .portrait-core {
          position: relative;
          text-align: center;
        }
        .initials {
          display: grid;
          place-items: center;
          width: 112px;
          height: 112px;
          margin: 0 auto 0.75rem;
          border-radius: 50%;
          border: 1px solid rgba(212, 196, 168, 0.45);
          background: rgba(14, 26, 36, 0.65);
          font-family: var(--font-display);
          font-size: 2rem;
          letter-spacing: 0.04em;
        }
        .portrait-core p {
          margin: 0;
          color: var(--sand-bright);
          font-family: var(--font-display);
          font-size: 1.15rem;
        }
        @keyframes breathe {
          0%,
          100% {
            filter: saturate(1);
          }
          50% {
            filter: saturate(1.08) brightness(1.03);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}
