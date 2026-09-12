import { useEffect, useRef } from "react";

type Props = {
  videoUrl: string | null;
  audioUrl?: string | null;
  /** Pre-recorded loop: video muted + loop, TTS audio separate. */
  videoMuted?: boolean;
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
  videoMuted = false,
  idle,
  speaking,
  name,
  portraitSrc,
  statusLabel,
  onAudioEnded,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const showPortrait = Boolean(portraitSrc) && !videoUrl;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoUrl) return;

    if (videoMuted) {
      el.muted = true;
      el.loop = true;
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      el.muted = false;
      el.loop = false;
    }

    el.style.display = "";
    el.load();
    el.play().catch(() => undefined);
  }, [videoUrl, videoMuted]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    if (!videoMuted && videoUrl) return;
    el.load();
    el.play().catch(() => undefined);
  }, [audioUrl, videoUrl, videoMuted]);

  const live = speaking || !idle;

  return (
    <div
      className={`avx-stage-inner ${live ? "is-speaking" : ""} ${idle ? "is-idle" : ""}`}
    >
      <div className="avx-avatar-scene">
        <div className="avx-avatar-ring" aria-hidden />
        <div className="avx-avatar-ring avx-avatar-ring--soft" aria-hidden />

        <div className={`avx-avatar-card${videoUrl ? " has-video" : ""}`}>
          {showPortrait ? (
            <img src={portraitSrc} alt={name} className="avx-portrait-img" />
          ) : !videoUrl ? (
            <div className="avx-portrait-fallback">
              <span>AO</span>
            </div>
          ) : null}

          {videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              muted={videoMuted}
              loop={videoMuted}
              className="avx-video"
              onEnded={videoMuted ? undefined : onAudioEnded}
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

      {audioUrl && (videoMuted || !videoUrl) && (
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
