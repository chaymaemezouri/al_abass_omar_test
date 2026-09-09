import { useEffect, useRef } from "react";

type Props = {
  videoUrl: string | null;
  audioUrl?: string | null;
  idle: boolean;
  speaking: boolean;
  name: string;
  portraitSrc?: string;
  statusLabel?: string;
  onAudioEnded?: () => void;
};

export function AvatarStage({
  videoUrl,
  audioUrl,
  idle,
  speaking,
  name,
  portraitSrc,
  statusLabel,
  onAudioEnded,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoUrl) return;
    el.style.display = "";
    el.load();
    el.play().catch(() => undefined);
  }, [videoUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    el.load();
    el.play().catch(() => undefined);
  }, [audioUrl]);

  const live = speaking || !idle;

  return (
    <div
      className={`avx-stage-inner ${live ? "is-speaking" : ""} ${idle ? "is-idle" : ""}`}
    >
      <div className="avx-avatar-scene">
        <div className="avx-avatar-ring" aria-hidden />
        <div className="avx-avatar-ring avx-avatar-ring--soft" aria-hidden />

        <div className="avx-avatar-card">
          {portraitSrc ? (
            <img src={portraitSrc} alt={name} className="avx-portrait-img" />
          ) : (
            <div className="avx-portrait-fallback">
              <span>AO</span>
            </div>
          )}

          {videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              muted={Boolean(audioUrl)}
              className="avx-video"
              onError={() => {
                if (videoRef.current) videoRef.current.style.display = "none";
              }}
            />
          )}
        </div>

        {live && (
          <div className="avx-eq" aria-hidden>
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <div className="avx-stage-meta">
        <p className="avx-stage-name">{name}</p>
        {statusLabel && (
          <p className={`avx-stage-status ${live ? "is-live" : ""}`}>
            <span className="avx-stage-live-dot" />
            {statusLabel}
          </p>
        )}
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          autoPlay
          className="avx-audio-hidden"
          onEnded={onAudioEnded}
        />
      )}
    </div>
  );
}
