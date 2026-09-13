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
  /** Same portrait frame for idle image + pre-recorded video (no circle). */
  portraitFrame?: boolean;
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
  portraitFrame = false,
  statusLabel,
  onAudioEnded,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastPlayedAudioRef = useRef<string | null>(null);
  const showPortrait = Boolean(portraitSrc) && !videoUrl;
  const usePortraitFrame = portraitFrame || Boolean(videoUrl && videoMuted);

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
    if (!el) return;

    if (!audioUrl) {
      lastPlayedAudioRef.current = null;
      el.pause();
      el.removeAttribute("src");
      el.load();
      return;
    }

    // HeyGen lip-sync carries audio on the video element — skip hidden audio.
    if (!videoMuted && videoUrl) return;
    if (lastPlayedAudioRef.current === audioUrl) return;
    lastPlayedAudioRef.current = audioUrl;

    el.pause();
    el.currentTime = 0;
    el.src = audioUrl;
    void el.play().catch(() => undefined);
  }, [audioUrl, videoMuted, videoUrl]);

  const live = speaking || !idle;

  return (
    <div
      className={`avx-stage-inner ${live ? "is-speaking" : ""} ${idle ? "is-idle" : ""}`}
    >
      <div
        className={`avx-avatar-scene${usePortraitFrame ? " avx-avatar-scene--portrait" : ""}`}
      >
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
            <div className="avx-video-frame">
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
            </div>
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

      <audio ref={audioRef} className="avx-audio-hidden" onEnded={onAudioEnded} />
    </div>
  );
}
