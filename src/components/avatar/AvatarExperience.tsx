import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Copy,
  Mic,
  RotateCcw,
  Send,
  ShieldCheck,
  Square,
  Volume2,
  VolumeX,
  Wand2,
} from "lucide-react";

import candidatePortraitFallback from "@/assets/Avatar.png";
import { useLang, suggestions } from "@/lib/i18n";
import {
  askAvatarAudio,
  askAvatarTextStream,
  generateAvatarVideo,
  simplifyAvatarAnswer,
  speakAvatar,
  type AvatarChatResponse,
} from "@/lib/avatar-api";
import { AvatarStage } from "@/components/avatar/AvatarStage";
import {
  CANDIDATE_IDLE_PORTRAIT,
  isPrerecordedAvatarEnabled,
  pickSpeakingClip,
} from "@/lib/prerecorded-avatar";
import "@/components/avatar/avatar-experience.css";

type Bi = { fr: string; ar: string };
const bi = (fr: string, ar: string): Bi => ({ fr, ar });

type Turn = {
  role: "user" | "assistant";
  text: string;
  meta?: string;
  streaming?: boolean;
};

type VoiceMode = "text" | "voice";
const VOICE_MODE_KEY = "avx-voice-mode";

type Props = {
  initialQuestion?: string;
};

function loadVoiceMode(): VoiceMode {
  if (typeof window === "undefined") return "voice";
  const v = window.localStorage.getItem(VOICE_MODE_KEY);
  return v === "text" ? "text" : "voice";
}

export function AvatarExperience({ initialQuestion = "" }: Props) {
  const { lang, t, setLang, dir } = useLang();
  const ar = lang === "ar" || lang === "darija";
  const languageHint = lang === "fr" ? "fr" : lang === "darija" ? "ary" : "ar";
  const [question, setQuestion] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [recording, setRecording] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>(loadVoiceMode);
  const [simplifying, setSimplifying] = useState(false);
  const [avatarGenerating, setAvatarGenerating] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastQuestionRef = useRef<string>("");
  const lastLanguageRef = useRef<string>("fr");
  const speakReqRef = useRef(0);
  const avatarStartedRef = useRef(false);
  const earlyPrefixRef = useRef("");
  const ttsQueueRef = useRef<string[]>([]);
  const ttsPlayingRef = useRef(false);
  const speakingClipRef = useRef("");
  const prerecordedAvatarEnabled = isPrerecordedAvatarEnabled();
  const candidatePortrait = prerecordedAvatarEnabled
    ? CANDIDATE_IDLE_PORTRAIT
    : candidatePortraitFallback;

  const copy = {
    brand: "Al Abass Omar",
    kicker: bi("Version numérique Al Abass Omar", "النسخة الرقمية Al Abass Omar"),
    badge: bi("Version numérique officielle", "النسخة الرقمية الرسمية"),
    title: bi("Parlez à l'avatar", "تحدث مع الأفاتار"),
    emptyTitle: bi("Posez votre première question", "اطرح سؤالك الأول"),
    empty: bi(
      "Choisissez une suggestion ou écrivez librement. L'avatar répond à partir de la base officielle.",
      "اختر اقتراحا أو اكتب بحرية. يجيب الأفاتار انطلاقا من القاعدة الرسمية.",
    ),
    related: bi("Pour aller plus loin", "لمعرفة المزيد"),
    suggestions: bi("Suggestions", "اقتراحات"),
    placeholder: bi("Écrivez votre question…", "اكتب سؤالك…"),
    send: bi("Envoyer", "إرسال"),
    back: bi("Retour", "رجوع"),
    online: bi("En ligne", "متصل"),
    listening: bi("En écoute…", "يستمع…"),
    speak: bi("Micro", "ميكروفون"),
    stop: bi("Stop", "إيقاف"),
    foot: bi(
      "Réponses limitées à la plateforme electorale officielle 2026.",
      "الإجابات مقيدة بالأرضية الانتخابية الرسمية 2026.",
    ),
    offline: bi(
      "Service Avatar indisponible. Vérifiez que le backend tourne.",
      "خدمة الأفاتار غير متاحة. تأكد أن الـ backend يعمل.",
    ),
    statusSpeaking: bi("L'avatar répond…", "الأفاتار يجيب…"),
    statusIdle: bi("Prêt à vous écouter", "جاهز للاستماع"),
    statusGenerating: bi("Génération de l'avatar…", "جاري إنشاء الأفاتار…"),
    newChat: bi("Nouvelle conversation", "محادثة جديدة"),
    stopAudio: bi("Couper le son", "إيقاف الصوت"),
    copyAnswer: bi("Copier la réponse", "نسخ الجواب"),
    copied: bi("Copié", "تم النسخ"),
    retry: bi("Réessayer", "إعادة المحاولة"),
    hideSuggestions: bi("Masquer", "إخفاء"),
    showSuggestions: bi("Suggestions", "اقتراحات"),
    simplify: bi("Plus simple", "بصيغة أبسط"),
    simplifying: bi("Reformulation…", "جاري التبسيط…"),
    modeText: bi("Texte seul", "نص فقط"),
    modeVoice: bi("Avec voix", "مع الصوت"),
  };

  function resizeInput() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function stopVoice() {
    speakReqRef.current += 1;
    avatarStartedRef.current = false;
    earlyPrefixRef.current = "";
    ttsQueueRef.current = [];
    ttsPlayingRef.current = false;
    speakingClipRef.current = "";
    setAudioUrl(null);
    setVideoUrl(null);
    setSpeaking(false);
    setAvatarGenerating(false);
  }

  function toggleVoiceMode() {
    setVoiceMode((prev) => {
      const next: VoiceMode = prev === "voice" ? "text" : "voice";
      window.localStorage.setItem(VOICE_MODE_KEY, next);
      if (next === "text") stopVoice();
      return next;
    });
  }

  function resetConversation() {
    stopVoice();
    setSessionId(null);
    setTurns([]);
    setError(null);
    setQuestion("");
    setFollowups([]);
    setShowSuggestions(true);
    lastQuestionRef.current = "";
    inputRef.current?.focus();
  }

  useEffect(() => {
    historyRef.current?.scrollTo({
      top: historyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, loading]);

  useEffect(() => {
    resizeInput();
  }, [question]);

  function assistantMeta(data: AvatarChatResponse): string | undefined {
    if (data.used_fallback) {
      return ar ? "رد احتياطي / خارج القاعدة" : "Réponse de repli / hors base";
    }
    if (data.sources?.length) {
      return `${ar ? "المصادر" : "Sources"}: ${data.sources.join(", ")}`;
    }
    return undefined;
  }

  // HeyGen lip-sync DISABLED — Bitmoji + Edge TTS only (fast).
  const heygenVideoEnabled = false;

  function normalizeSpeakText(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  /** First sentence so TTS can start while the answer is still streaming. */
  function firstSpeakableClip(text: string): string | null {
    const cleaned = normalizeSpeakText(text);
    if (cleaned.length < 18) return null;
    for (const sep of [". ", "! ", "? ", "۔", "؟", "\n"]) {
      const idx = cleaned.indexOf(sep);
      if (idx >= 16) {
        const clip = cleaned.slice(0, idx + (sep === "\n" ? 0 : 1)).trim();
        if (clip.length >= 16) return clip;
      }
    }
    if (cleaned.length >= 48) return cleaned.slice(0, 220);
    return null;
  }

  function splitIntoTtsSegments(text: string, maxLen = 480): string[] {
    const cleaned = normalizeSpeakText(text);
    if (!cleaned) return [];
    if (cleaned.length <= maxLen) return [cleaned];

    const segments: string[] = [];
    let rest = cleaned;
    while (rest.length > maxLen) {
      let cut = -1;
      for (const sep of [". ", "! ", "? ", "۔", "؟"]) {
        const idx = rest.lastIndexOf(sep, maxLen);
        if (idx > maxLen * 0.35) cut = Math.max(cut, idx + sep.length);
      }
      if (cut <= 0) cut = rest.lastIndexOf(" ", maxLen);
      if (cut <= 0) cut = maxLen;
      segments.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) segments.push(rest);
    return segments.filter(Boolean);
  }

  function remainderAfterPrefix(full: string, prefix: string): string | null {
    const f = normalizeSpeakText(full);
    const p = normalizeSpeakText(prefix);
    if (!p) return f;
    if (f.startsWith(p)) return f.slice(p.length).trim() || null;
    const idx = f.indexOf(p);
    if (idx >= 0) {
      const rest = f.slice(idx + p.length).trim();
      return rest || null;
    }
    return null;
  }

  function ensureSpeakingClip() {
    if (!prerecordedAvatarEnabled || voiceMode !== "voice") return;
    if (speakingClipRef.current) return;
    const clip = pickSpeakingClip();
    if (!clip) return;
    speakingClipRef.current = clip;
    setVideoUrl(clip);
  }

  function clearSpeakingClip() {
    speakingClipRef.current = "";
    if (prerecordedAvatarEnabled) setVideoUrl(null);
  }

  async function playTtsQueue(gen: number, language: string) {
    if (ttsPlayingRef.current || speakReqRef.current !== gen) return;
    const next = ttsQueueRef.current.shift();
    if (!next) {
      ttsPlayingRef.current = false;
      setSpeaking(false);
      clearSpeakingClip();
      return;
    }
    ttsPlayingRef.current = true;
    ensureSpeakingClip();
    const url = await speakAvatar(next, language);
    if (!url || speakReqRef.current !== gen) {
      ttsQueueRef.current = [];
      ttsPlayingRef.current = false;
      setSpeaking(false);
      clearSpeakingClip();
      return;
    }
    if (!prerecordedAvatarEnabled) setVideoUrl(null);
    setAudioUrl(url);
    setSpeaking(true);
  }

  function enqueueTtsSegments(segments: string[], language: string, gen: number) {
    if (!segments.length || voiceMode !== "voice") return;
    ttsQueueRef.current.push(...segments);
    void playTtsQueue(gen, language);
  }

  function handleAudioEnded() {
    ttsPlayingRef.current = false;
    void playTtsQueue(speakReqRef.current, lastLanguageRef.current);
  }

  function speakFullAnswer(answer: string, language: string, blocked: boolean, gen: number) {
    if (voiceMode !== "voice" || !answer || blocked) return;
    const full = normalizeSpeakText(answer);
    if (!full) return;

    if (avatarStartedRef.current && earlyPrefixRef.current) {
      const rest = remainderAfterPrefix(full, earlyPrefixRef.current);
      earlyPrefixRef.current = "";
      if (rest) enqueueTtsSegments(splitIntoTtsSegments(rest), language, gen);
      return;
    }

    avatarStartedRef.current = true;
    earlyPrefixRef.current = "";
    enqueueTtsSegments(splitIntoTtsSegments(full), language, gen);
  }

  function speakEarlyClip(clip: string, language: string, gen: number) {
    if (voiceMode !== "voice" || !clip) return;
    avatarStartedRef.current = true;
    earlyPrefixRef.current = clip;
    enqueueTtsSegments([clip], language, gen);
  }

  async function maybeAvatarVideo(
    answer: string,
    language: string,
    blocked: boolean,
    gen: number,
  ) {
    if (!heygenVideoEnabled || !answer || blocked) return false;
    setAvatarGenerating(true);
    try {
      const url = await generateAvatarVideo(answer, language);
      if (url && speakReqRef.current === gen) {
        // One voice only: HeyGen video audio — never overlap Edge TTS.
        setAudioUrl(null);
        setVideoUrl(url);
        setSpeaking(true);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      if (speakReqRef.current === gen) setAvatarGenerating(false);
    }
  }

  async function applyAssistant(data: AvatarChatResponse, replaceStreaming = false) {
    setSessionId(data.session_id);
    lastLanguageRef.current = data.language || "fr";
    const meta = assistantMeta(data);
    setTurns((prev) => {
      if (replaceStreaming && prev.length > 0 && prev[prev.length - 1]?.role === "assistant") {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          text: data.answer,
          ...(meta ? { meta } : {}),
        };
        return next;
      }
      return [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          ...(meta ? { meta } : {}),
        },
      ];
    });

    if (data.video_url) {
      setAudioUrl(null);
      setVideoUrl(data.video_url);
      setSpeaking(true);
    }
    setFollowups(data.followups?.filter(Boolean).slice(0, 3) ?? []);
    const wide =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 981px)").matches;
    setShowSuggestions(wide);

    const gen = speakReqRef.current;
    if (data.video_url || data.blocked) return;

    // Bitmoji + Edge TTS: read full answer (early clip + rest queued).
    if (!heygenVideoEnabled) {
      if (!data.audio_url) {
        speakFullAnswer(data.answer, data.language, data.blocked, gen);
      }
      return;
    }

    if (avatarStartedRef.current) return;
    avatarStartedRef.current = true;
    void (async () => {
      const gotVideo = await maybeAvatarVideo(
        data.answer,
        data.language,
        data.blocked,
        gen,
      );
      if (!gotVideo && speakReqRef.current === gen) {
        speakFullAnswer(data.answer, data.language, data.blocked, gen);
      }
    })();
  }

  async function submitQuestion(text: string) {
    const cleaned = text.trim();
    if (!cleaned || loading) return;

    lastQuestionRef.current = cleaned;
    setQuestion("");
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    stopVoice();
    avatarStartedRef.current = false;
    const gen = speakReqRef.current;
    setTurns((prev) => [
      ...prev,
      { role: "user", text: cleaned },
      { role: "assistant", text: "", streaming: true },
    ]);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
        inputRef.current.focus();
      }
    });

    let streamed = "";
    try {
      const data = await askAvatarTextStream(cleaned, sessionId, languageHint, {
        onToken: (chunk) => {
          streamed += chunk;
          const snapshot = streamed;
          setTurns((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, text: snapshot, streaming: true };
            }
            return next;
          });
          // Start voice ASAP on first sentence (don't wait for full RAG + long TTS).
          if (!avatarStartedRef.current) {
            const clip = firstSpeakableClip(snapshot);
            if (clip) {
              avatarStartedRef.current = true;
              lastLanguageRef.current = languageHint || "fr";
              if (heygenVideoEnabled) {
                void maybeAvatarVideo(clip, languageHint || "fr", false, gen);
              } else {
                speakEarlyClip(clip, languageHint || "fr", gen);
              }
            }
          }
        },
      });
      await applyAssistant(data, true);
    } catch (err) {
      setTurns((prev) => {
        if (prev.length && prev[prev.length - 1]?.role === "assistant" && prev[prev.length - 1]?.streaming) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      setError(err instanceof Error ? err.message : t(copy.offline));
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await submitQuestion(question);
  }

  async function onAudio(blob: Blob, filename: string) {
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    stopVoice();
    try {
      const data = await askAvatarAudio(blob, filename, sessionId, languageHint);
      lastQuestionRef.current = data.question;
      setTurns((prev) => [...prev, { role: "user", text: data.question }]);
      await applyAssistant(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(copy.offline));
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    if (loading || recording) return;
    try {
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
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        const ext = mime.includes("webm") ? "webm" : "m4a";
        void onAudio(blob, `question.${ext}`);
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError(t(copy.offline));
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  async function copyLastAnswer() {
    const last = [...turns].reverse().find((t) => t.role === "assistant");
    if (!last?.text) return;
    try {
      await navigator.clipboard.writeText(last.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  async function simplifyLastAnswer() {
    const last = [...turns].reverse().find((t) => t.role === "assistant" && t.text);
    if (!last?.text || simplifying || loading) return;
    setSimplifying(true);
    setError(null);
    stopVoice();
    try {
      const simpler = await simplifyAvatarAnswer(
        last.text,
        lastLanguageRef.current,
        sessionId,
      );
      setTurns((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          if (next[i]?.role === "assistant") {
            next[i] = {
              ...next[i],
              text: simpler,
              meta: ar ? "صيغة أبسط" : "Version plus simple",
            };
            break;
          }
        }
        return next;
      });
      speakFullAnswer(simpler, lastLanguageRef.current, false, speakReqRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(copy.offline));
    } finally {
      setSimplifying(false);
    }
  }

  useEffect(() => {
    if (bootstrapped || !initialQuestion.trim()) return;
    setBootstrapped(true);
    void submitQuestion(initialQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once
  }, [initialQuestion, bootstrapped]);

  useEffect(() => {
    document.documentElement.classList.add("avx-lock");
    document.body.classList.add("avx-lock");
    return () => {
      document.documentElement.classList.remove("avx-lock");
      document.body.classList.remove("avx-lock");
    };
  }, []);

  const starterSuggestions = suggestions.slice(0, 3);
  const activeSuggestions = followups.length > 0 ? followups : starterSuggestions.map((s) => t(s));
  const suggestionsTitle = followups.length > 0 ? t(copy.related) : t(copy.suggestions);
  const lastAssistant = [...turns].reverse().find((t) => t.role === "assistant" && t.text);

  return (
    <div className="avx" dir={dir}>
      <header className="avx-bar">
        <Link to="/" className="avx-back">
          <ArrowLeft className={`avx-back-icon ${ar ? "is-rtl" : ""}`} />
          <span>{t(copy.back)}</span>
        </Link>
        <div className="avx-bar-brand">
          <span className="avx-dot" />
          <span>{t(copy.badge)}</span>
        </div>
        <div className="avx-lang" role="group" aria-label="Language">
          <button
            type="button"
            className={lang === "ar" ? "is-active" : undefined}
            onClick={() => setLang("ar")}
          >
            عربي
          </button>
          <button
            type="button"
            className={lang === "darija" ? "is-active" : undefined}
            onClick={() => setLang("darija")}
          >
            دارجة
          </button>
          <button
            type="button"
            className={lang === "fr" ? "is-active" : undefined}
            onClick={() => setLang("fr")}
          >
            FR
          </button>
        </div>
      </header>

      <main className="avx-shell">
        <section className="avx-stage" aria-label={copy.brand}>
          <div className="avx-stage-glow" aria-hidden />
          <AvatarStage
            videoUrl={videoUrl}
            audioUrl={audioUrl}
            videoMuted={prerecordedAvatarEnabled && Boolean(videoUrl)}
            portraitFrame={prerecordedAvatarEnabled}
            idle={!loading && !speaking}
            speaking={speaking}
            name={copy.brand}
            portraitSrc={candidatePortrait}
            statusLabel={
              avatarGenerating
                ? t(copy.statusGenerating)
                : loading || speaking
                  ? t(copy.statusSpeaking)
                  : t(copy.statusIdle)
            }
            onAudioEnded={handleAudioEnded}
          />
        </section>

        <section className={`avx-panel${turns.length > 0 ? " has-chat" : ""}`}>
          <div className="avx-panel-head">
            <div className="avx-panel-head-copy">
              <p className="avx-kicker">
                <span className="avx-online-dot" aria-hidden />
                {t(copy.kicker)}
              </p>
              <h1>{t(copy.title)}</h1>
            </div>
            <div className="avx-panel-actions" role="group" aria-label="Actions">
              <button
                type="button"
                className={`avx-icon-btn ${voiceMode === "voice" ? "is-on" : ""}`}
                onClick={toggleVoiceMode}
                aria-label={voiceMode === "voice" ? t(copy.modeVoice) : t(copy.modeText)}
                title={voiceMode === "voice" ? t(copy.modeVoice) : t(copy.modeText)}
              >
                {voiceMode === "voice" ? (
                  <Volume2 className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <VolumeX className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
              <button
                type="button"
                className="avx-icon-btn"
                onClick={resetConversation}
                disabled={loading || (turns.length === 0 && !sessionId)}
                aria-label={t(copy.newChat)}
                title={t(copy.newChat)}
              >
                <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="avx-suggestions" aria-label={suggestionsTitle}>
            {(turns.length === 0 || showSuggestions) && (
              <p className="avx-suggestions-label">{suggestionsTitle}</p>
            )}
            {turns.length > 0 && (
              <button
                type="button"
                className="avx-linkish"
                onClick={() => setShowSuggestions((v) => !v)}
              >
                {showSuggestions ? t(copy.hideSuggestions) : t(copy.showSuggestions)}
              </button>
            )}
            {showSuggestions && (
              <div className="avx-chips">
                {activeSuggestions.map((item, index) => (
                  <button
                    key={`${item}-${index}`}
                    type="button"
                    className="avx-chip"
                    disabled={loading}
                    onClick={() => void submitQuestion(item)}
                  >
                    <span className="avx-chip-text">{item}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={historyRef} className="avx-history" aria-live="polite">
            {turns.length === 0 && !loading ? (
              <div className="avx-empty">
                <div className="avx-empty-badge">
                  <ShieldCheck className="avx-empty-icon" />
                </div>
                <h2>{t(copy.emptyTitle)}</h2>
                <p>{t(copy.empty)}</p>
              </div>
            ) : (
              turns.map((turn, i) => (
                <article
                  key={`${turn.role}-${i}`}
                  className={`avx-bubble ${turn.role}${turn.streaming ? " is-streaming" : ""}`}
                >
                  <p>
                    {turn.text}
                    {turn.streaming && !turn.text ? "…" : null}
                    {turn.streaming && turn.text ? (
                      <span className="avx-cursor" aria-hidden>
                        |
                      </span>
                    ) : null}
                  </p>
                  {turn.meta && <small>{turn.meta}</small>}
                </article>
              ))
            )}
            {loading && !turns.some((t) => t.streaming) && (
              <div className="avx-typing" aria-hidden>
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          {lastAssistant && (
            <div className="avx-toolbar">
              <button
                type="button"
                className="avx-tool-btn"
                disabled={loading || simplifying}
                onClick={() => void copyLastAnswer()}
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copied ? t(copy.copied) : t(copy.copyAnswer)}</span>
              </button>
              <button
                type="button"
                className="avx-tool-btn"
                disabled={loading || simplifying}
                onClick={() => void simplifyLastAnswer()}
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span>{simplifying ? t(copy.simplifying) : t(copy.simplify)}</span>
              </button>
              {(speaking || audioUrl) && (
                <button type="button" className="avx-tool-btn" onClick={stopVoice}>
                  <VolumeX className="h-3.5 w-3.5" />
                  <span>{t(copy.stopAudio)}</span>
                </button>
              )}
              {error && lastQuestionRef.current && (
                <button
                  type="button"
                  className="avx-tool-btn"
                  disabled={loading}
                  onClick={() => void submitQuestion(lastQuestionRef.current)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{t(copy.retry)}</span>
                </button>
              )}
            </div>
          )}

          <form onSubmit={onSubmit} className="avx-composer">
            <div className="avx-composer-shell">
              <div className="avx-composer-box">
                <button
                  type="button"
                  className={`avx-mic ${recording ? "is-rec" : ""}`}
                  disabled={loading}
                  onClick={() => (recording ? stopRecording() : void startRecording())}
                  aria-label={recording ? t(copy.stop) : t(copy.speak)}
                >
                  {recording ? (
                    <Square strokeWidth={1.75} className="h-[1rem] w-[1rem]" />
                  ) : (
                    <Mic strokeWidth={1.75} className="h-[1.15rem] w-[1.15rem]" />
                  )}
                </button>
                <textarea
                  ref={inputRef}
                  id="avatar-q"
                  rows={1}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submitQuestion(question);
                    }
                  }}
                  placeholder={recording ? t(copy.listening) : t(copy.placeholder)}
                  disabled={loading || recording}
                  maxLength={2000}
                />
                <button
                  type="submit"
                  className="avx-send"
                  disabled={loading || !question.trim()}
                  aria-label={t(copy.send)}
                >
                  <Send
                    strokeWidth={1.75}
                    className={`h-[1.1rem] w-[1.1rem] ${ar ? "is-rtl" : ""}`}
                  />
                </button>
              </div>
            </div>
            {error && (
              <p className="avx-error" role="alert">
                {error}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
