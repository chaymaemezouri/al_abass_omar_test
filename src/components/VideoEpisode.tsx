import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, Copy, Film, Play, RotateCcw, Subtitles } from "lucide-react";
import type { CandidateVideo, VideoLanguage, VideoRecording } from "@/data/videos";
import { useLang } from "@/lib/i18n";
import partyLogo from "@/assets/logo.png";

export const mediaTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};
const languages: { id: VideoLanguage; label: string }[] = [
  { id: "fr", label: "FR" },
  { id: "ar", label: "العربية" },
  { id: "darija", label: "Darija" },
];
type Props = {
  video: CandidateVideo;
  recording: VideoRecording;
  shouldPlay: boolean;
  onEnded: () => void;
  onPlaying: (value: boolean) => void;
  onDuration: (value: number) => void;
  onPrevious?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
  position: string;
};

export function VideoEpisode({
  video,
  recording,
  shouldPlay,
  onEnded,
  onPlaying,
  onDuration,
  onPrevious,
  onNext,
  position,
}: Props) {
  const { lang, t } = useLang();
  const ar = lang !== "fr";
  const player = useRef<HTMLVideoElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introShown = useRef(false);
  const touch = useRef<{ x: number; y: number; at: number } | null>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(recording.durationSeconds ?? 0);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [intro, setIntro] = useState(false);
  const [captionLang, setCaptionLang] = useState<VideoLanguage>(lang === "fr" ? "fr" : "ar");
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [copied, setCopied] = useState("");
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const cues = recording.cues?.[captionLang] ?? [];
  const currentCue = cues.find((cue) => time >= cue.start && time < cue.end);
  const showIdleCover = Boolean(recording.src) && !failed && !started && time < 0.2;
  const hasLanguage = (id: string) =>
    Boolean(
      recording.cues?.[id as VideoLanguage]?.length ||
      recording.captions?.some((track) => track.lang === id),
    );
  const hasCaptions = languages.some((item) => hasLanguage(item.id));
  const availableLanguage = languages.find((item) => hasLanguage(item.id))?.id;

  useEffect(() => {
    setCaptionLang(lang === "fr" ? "fr" : "ar");
  }, [lang]);

  useEffect(() => {
    setStarted(false);
    setTime(0);
    setFailed(false);
  }, [recording.src, retry]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    onPlaying(false);
    return () => onPlaying(false);
  }, [onPlaying]);
  useEffect(() => {
    const tracks = player.current?.textTracks;
    if (!tracks) return;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      if (track)
        track.mode =
          captionsEnabled &&
          cues.length === 0 &&
          track.language === (captionLang === "darija" ? "ar-MA" : captionLang)
            ? "showing"
            : "disabled";
    }
  }, [captionLang, captionsEnabled, cues.length, retry]);

  function seek(seconds: number) {
    if (!player.current || !Number.isFinite(seconds)) return;
    player.current.currentTime = Math.min(Math.max(0, seconds), player.current.duration || seconds);
    setTime(player.current.currentTime);
  }
  async function copyExcerpt() {
    const text = currentCue?.text ?? cues[0]?.text;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(ar ? "تم نسخ المقطع" : "Extrait copié");
    } catch {
      setCopied(text);
    }
  }
  function playing() {
    onPlaying(true);
  }

  // Show question overlay only when user clicks a question (shouldPlay=true)
  useEffect(() => {
    if (!recording.src || !shouldPlay) return;
    setIntro(true);
    introShown.current = true;
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    timer.current = setTimeout(() => setIntro(false), mobile ? 2000 : 10000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [recording.src, shouldPlay]);



  // Ref for the blurred background video
  const bgPlayer = useRef<HTMLVideoElement>(null);

  // Sync blur video with main video time
  useEffect(() => {
    const main = player.current;
    const bg = bgPlayer.current;
    if (!main || !bg) return;
    const syncTime = () => {
      if (bg && Math.abs(bg.currentTime - main.currentTime) > 0.5) {
        bg.currentTime = main.currentTime;
      }
    };
    const syncPlay = () => { bg?.play().catch(() => {}); };
    const syncPause = () => { bg?.pause(); };
    main.addEventListener("play", syncPlay);
    main.addEventListener("pause", syncPause);
    main.addEventListener("seeked", syncTime);
    const interval = setInterval(syncTime, 2000);
    return () => {
      main.removeEventListener("play", syncPlay);
      main.removeEventListener("pause", syncPause);
      main.removeEventListener("seeked", syncTime);
      clearInterval(interval);
    };
  }, [retry, recording.src]);

  return (
    <>
      <div className="episode-stage">
        {/* ── Blurred background video ── */}
        {recording.src && (
          <video
            ref={bgPlayer}
            className="episode-bg-blur"
            src={recording.src}
            muted
            playsInline
            loop
            preload="metadata"
            aria-hidden="true"
          />
        )}
        <div className="episode-meta">
          <span>
            {video.test
              ? ar
                ? "فيديو تجريبي"
                : "CAPSULE DE TEST"
              : ar
                ? "رد مسجل"
                : "RÉPONSE ENREGISTRÉE"}
          </span>
          <span className="episode-position">{position}</span>
        </div>
        <div className="episode-layout">
          <div
            className="episode-frame"
            tabIndex={0}
            aria-label={ar ? "مشغل الرد بالفيديو" : "Lecteur de réponse vidéo"}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === "ArrowDown" && onNext) {
                event.preventDefault();
                onNext();
              }
              if (event.key === "ArrowUp" && onPrevious) {
                event.preventDefault();
                onPrevious();
              }
            }}
            onTouchStart={(event) => {
              const point = event.touches[0];
              if (!point) return;
              const box = event.currentTarget.getBoundingClientRect();
              // Keep the native video controls and caption actions available to touch.
              touch.current =
                point.clientY < box.bottom - 70
                  ? { x: point.clientX, y: point.clientY, at: Date.now() }
                  : null;
            }}
            onTouchEnd={(event) => {
              const start = touch.current;
              touch.current = null;
              if (!start) return;
              const point = event.changedTouches[0];
              if (!point) return;
              const dy = point.clientY - start.y;
              if (
                Math.abs(dy) > 65 &&
                Math.abs(dy) > Math.abs(point.clientX - start.x) * 1.5 &&
                Date.now() - start.at < 800
              ) {
                if (dy < 0) onNext?.();
                else onPrevious?.();
              }
            }}
          >
            {!recording.src ? (
              <div className="episode-empty">
                <Film size={30} />
                <span>{ar ? "الرد بالفيديو قريباً" : "Réponse vidéo à venir"}</span>
                <p>
                  {ar
                    ? "هذا السؤال ينتظر تسجيل إجابته."
                    : "Cette question attend son enregistrement."}
                </p>
              </div>
            ) : failed ? (
              <div role="alert" className="episode-empty">
                <Film size={30} />
                <span>{ar ? "تعذر تحميل الفيديو" : "Vidéo indisponible"}</span>
                <button
                  type="button"
                  className="episode-retry"
                  onClick={() => {
                    setFailed(false);
                    setRetry((value) => value + 1);
                  }}
                >
                  <RotateCcw size={18} />
                  {ar ? "إعادة المحاولة" : "Réessayer"}
                </button>
              </div>
            ) : (
              <>
              {showIdleCover && (
                <div className="episode-idle" aria-hidden>
                  <img src={partyLogo} alt="" className="episode-idle-logo" />
                  <span className="episode-idle-play">
                    <Play size={20} fill="currentColor" />
                  </span>
                </div>
              )}
              <video
                ref={player}
                key={retry}
                src={recording.src}
                poster={recording.poster}
                controls
                playsInline
                preload="metadata"
                aria-label={
                  video.test ? (ar ? "فيديو تجريبي" : "Vidéo de démonstration") : t(video.question)
                }
                onLoadedMetadata={(event) => {
                  const d = event.currentTarget.duration;
                  if (Number.isFinite(d)) {
                    setDuration(d);
                    onDuration(d);
                  }
                }}
                onCanPlay={() => {
                  if (shouldPlay && player.current)
                    void player.current.play().catch(() => onPlaying(false));
                }}
                onPlay={() => {
                  setStarted(true);
                  playing();
                }}
                onPause={() => onPlaying(false)}
                onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
                onEnded={() => {
                  onPlaying(false);
                  onEnded();
                }}
                onError={() => {
                  setFailed(true);
                  onPlaying(false);
                }}
              >
                {recording.captions?.map((track) => (
                  <track
                    key={track.lang}
                    kind="captions"
                    src={track.src}
                    srcLang={track.lang === "darija" ? "ar-MA" : track.lang}
                    label={track.label}
                  />
                ))}
              </video>
              </>
            )}
            {intro && (
              <div className="episode-question" role="status">
                <span>
                  {video.test
                    ? ar
                      ? "سؤال مقترح · تجربة"
                      : "QUESTION PROPOSÉE · DÉMO"
                    : ar
                      ? "سؤالكم"
                      : "VOTRE QUESTION"}
                </span>
                <p>{t(video.question)}</p>
              </div>
            )}
            {captionsEnabled && currentCue && (
              <p className="episode-cue" dir={captionLang === "fr" ? "ltr" : "rtl"}>
                {currentCue.text}
              </p>
            )}
            <div
              className="episode-progress"
              role="progressbar"
              aria-label={ar ? "تقدم القراءة" : "Progression de lecture"}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(duration ? (time / duration) * 100 : 0)}
            >
              <span
                style={{ width: `${duration ? Math.min((time / duration) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
          <div className="episode-navigation">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!onPrevious}
              className="vd-icon"
              title={ar ? "الرد السابق" : "Réponse précédente"}
              aria-label={ar ? "الرد السابق" : "Réponse précédente"}
            >
              <ArrowUp size={20} />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              className="vd-icon"
              title={ar ? "الرد التالي" : "Réponse suivante"}
              aria-label={ar ? "الرد التالي" : "Réponse suivante"}
            >
              <ArrowDown size={20} />
            </button>
          </div>
        </div>
        <div className="episode-footer">
          <span className="episode-position">
            {mediaTime(time)} / {duration ? mediaTime(duration) : "--:--"}
          </span>
          <button
            type="button"
            className="vd-icon"
            disabled={!hasCaptions}
            aria-pressed={captionsEnabled}
            title={
              hasCaptions
                ? ar
                  ? "الترجمة"
                  : "Sous-titres"
                : ar
                  ? "الترجمة غير متوفرة"
                  : "Sous-titres non fournis"
            }
            aria-label={ar ? "تفعيل الترجمة" : "Activer les sous-titres"}
            onClick={() => {
              setCaptionsEnabled((value) => !value);
              if (!hasLanguage(captionLang) && availableLanguage) setCaptionLang(availableLanguage);
            }}
          >
            <Subtitles size={19} />
          </button>
          <div className="episode-languages">
            {languages.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!hasLanguage(item.id)}
                aria-pressed={captionsEnabled && captionLang === item.id}
                title={
                  hasLanguage(item.id)
                    ? item.label
                    : ar
                      ? "الترجمة غير متوفرة"
                      : "Sous-titres non fournis"
                }
                onClick={() => {
                  setCaptionLang(item.id);
                  setCaptionsEnabled(true);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {video.test && (
        <p className="vd-test-note">
          {ar
            ? "فيديو تجريبي، وليس جواباً معتمداً لهذا السؤال."
            : "Vidéo de démonstration, non validée comme réponse à cette question."}
        </p>
      )}
      {Boolean(recording.chapters?.length) && (
        <nav
          className="episode-chapters"
          aria-label={ar ? "فصول الفيديو" : "Chapitres de la vidéo"}
        >
          {recording.chapters!.map((chapter) => (
            <button key={chapter.time} type="button" onClick={() => seek(chapter.time)}>
              <span>{mediaTime(chapter.time)}</span>
              {t(chapter.label)}
            </button>
          ))}
        </nav>
      )}
      <div className="episode-transcript">
        <button
          type="button"
          className="episode-transcript-toggle"
          aria-expanded={transcriptOpen}
          onClick={() => setTranscriptOpen((value) => !value)}
        >
          <Subtitles size={18} />
          {ar ? "النص المتزامن" : "Transcription synchronisée"}
          <span>{transcriptOpen ? "−" : "+"}</span>
        </button>
        {transcriptOpen && (
          <div>
            <div className="episode-transcript-tools">
              <div className="episode-languages">
                {languages.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!recording.cues?.[item.id]?.length}
                    aria-pressed={captionLang === item.id}
                    onClick={() => setCaptionLang(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="vd-icon"
                onClick={copyExcerpt}
                disabled={!cues.length}
                title={ar ? "نسخ المقطع" : "Copier un extrait"}
                aria-label={ar ? "نسخ المقطع" : "Copier un extrait"}
              >
                {copied ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>
            {cues.length ? (
              cues.map((cue) => (
                <button
                  type="button"
                  key={cue.start}
                  className={`episode-transcript-line ${currentCue === cue ? "is-current" : ""}`}
                  aria-current={currentCue === cue ? "true" : undefined}
                  onClick={() => seek(cue.start)}
                >
                  <span>{mediaTime(cue.start)}</span>
                  <span dir={captionLang === "fr" ? "ltr" : "rtl"}>{cue.text}</span>
                </button>
              ))
            ) : (
              <p className="vd-muted">
                {ar
                  ? "لم يتم توفير نص متزامن لهذه النسخة بعد."
                  : "Aucune transcription synchronisée n’a encore été fournie pour cette version."}
              </p>
            )}
            <p role="status" className="vd-muted">
              {copied}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
