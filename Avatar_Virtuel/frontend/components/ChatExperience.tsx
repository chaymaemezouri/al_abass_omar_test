"use client";

import { FormEvent, useEffect, useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import AvatarStage from "@/components/AvatarStage";
import { askAudio, askText, ChatResponse } from "@/lib/api";

type Turn = {
  role: "user" | "assistant";
  text: string;
  meta?: string;
  debug?: string;
};

export default function ChatExperience() {
  const [question, setQuestion] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    setShowDebug(host === "localhost" || host === "127.0.0.1");
  }, []);

  async function handleResponse(data: ChatResponse) {
    setSessionId(data.session_id);
    const local =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");
    const score =
      data.similarity_score == null ? "—" : data.similarity_score.toFixed(3);
    const debug = local
      ? `score=${score} · source=${data.source_type || "—"} · lang=${data.language}`
      : undefined;
    setTurns((prev) => [
      ...prev,
      { role: "user", text: data.question },
      {
        role: "assistant",
        text: data.answer,
        meta: data.used_fallback
          ? "Réponse de repli / hors base"
          : data.sources?.length
            ? `Sources: ${data.sources.join(", ")}`
            : undefined,
        debug,
      },
    ]);
    setVideoUrl(data.video_url);
    setAudioUrl(data.audio_url);
    setSpeaking(Boolean(data.audio_url || data.video_url));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await askText(question.trim(), sessionId);
      setQuestion("");
      await handleResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function onAudio(blob: Blob, filename: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await askAudio(blob, filename, sessionId);
      await handleResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur audio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <p className="brand">Al Abass Omar</p>
        <h1>Avatar virtuel conversationnel</h1>
        <p className="lead">
          Posez votre question en français, arabe ou darija. Les réponses s&apos;appuient
          exclusivement sur le programme documenté.
        </p>
      </header>

      <AvatarStage videoUrl={videoUrl} idle={!loading && !speaking} speaking={speaking} />

      <section className="panel">
        <div className="history" aria-live="polite">
          {turns.length === 0 && (
            <p className="empty">La conversation apparaîtra ici.</p>
          )}
          {turns.map((t, i) => (
            <article key={i} className={`bubble ${t.role}`}>
              <p>{t.text}</p>
              {t.meta && <small>{t.meta}</small>}
              {t.debug && <small className="debug">{t.debug}</small>}
            </article>
          ))}
        </div>

        {audioUrl && (
          <audio
            src={audioUrl}
            controls
            autoPlay
            onEnded={() => setSpeaking(false)}
            className="audio"
          />
        )}

        <form onSubmit={onSubmit} className="composer">
          <label htmlFor="q" className="sr">
            Votre question
          </label>
          <textarea
            id="q"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex. Quelles sont vos priorités pour l'eau et l'agriculture ?"
            disabled={loading}
            maxLength={2000}
          />
          <div className="actions">
            <AudioRecorder disabled={loading} onRecorded={onAudio} />
            <button type="submit" className="btn primary" disabled={loading || !question.trim()}>
              {loading ? "Réflexion…" : "Envoyer"}
            </button>
          </div>
        </form>

        {error && <p className="error" role="alert">{error}</p>}
        {loading && <p className="status">Analyse de la question et recherche dans le programme…</p>}
        {showDebug && (
          <p className="debug-hint">
            Mode local : score RAG + type de source sous chaque réponse (console F12 → [RAG]).
          </p>
        )}
      </section>

      <footer className="foot">
        Réponses strictement limitées à la base de connaissances officielle. Hors périmètre =
        « je n&apos;ai pas cette information ».
      </footer>

      <style jsx>{`
        .page {
          max-width: 920px;
          margin: 0 auto;
          padding: 1.25rem 1rem 3rem;
        }
        .hero {
          padding: 1.5rem 0 1rem;
          animation: rise 0.7s ease both;
        }
        .brand {
          margin: 0 0 0.35rem;
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3rem);
          color: var(--sand-bright);
          letter-spacing: 0.01em;
        }
        h1 {
          margin: 0;
          font-size: clamp(1.05rem, 2.4vw, 1.35rem);
          font-weight: 500;
          color: var(--muted);
        }
        .lead {
          margin: 0.85rem 0 0;
          max-width: 38rem;
          color: var(--sand);
          line-height: 1.55;
        }
        .panel {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--panel);
          border: 1px solid var(--line);
          backdrop-filter: blur(8px);
          animation: rise 0.9s ease both;
        }
        .history {
          display: grid;
          gap: 0.75rem;
          max-height: 320px;
          overflow: auto;
          margin-bottom: 1rem;
          padding-right: 0.25rem;
        }
        .empty {
          color: var(--muted);
          margin: 0.5rem 0;
        }
        .bubble {
          padding: 0.75rem 0.9rem;
          border: 1px solid var(--line);
        }
        .bubble.user {
          background: rgba(212, 196, 168, 0.08);
        }
        .bubble.assistant {
          background: rgba(61, 139, 110, 0.1);
          border-color: rgba(61, 139, 110, 0.28);
        }
        .bubble p {
          margin: 0;
          white-space: pre-wrap;
          line-height: 1.5;
        }
        .bubble small {
          display: block;
          margin-top: 0.4rem;
          color: var(--muted);
        }
        .bubble small.debug {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.72rem;
          color: rgba(232, 168, 124, 0.85);
        }
        .debug-hint {
          margin: 0.65rem 0 0;
          font-size: 0.75rem;
          color: var(--muted);
        }
        .composer textarea {
          width: 100%;
          resize: vertical;
          min-height: 90px;
          padding: 0.85rem;
          border: 1px solid var(--line);
          background: rgba(8, 14, 20, 0.55);
          color: var(--ink);
          outline: none;
        }
        .composer textarea:focus {
          border-color: var(--accent-soft);
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: space-between;
          margin-top: 0.85rem;
        }
        .btn {
          border: 1px solid var(--line);
          background: transparent;
          color: var(--ink);
          padding: 0.7rem 1.15rem;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .btn.primary {
          background: var(--accent);
          border-color: transparent;
          color: #fff8f2;
        }
        .btn.primary:hover:not(:disabled) {
          transform: translateY(-1px);
          background: #d4682d;
        }
        .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .error {
          color: #ffb4b4;
          margin: 0.75rem 0 0;
        }
        .status {
          color: var(--accent-soft);
          margin: 0.75rem 0 0;
          animation: pulse 1.4s ease-in-out infinite;
        }
        .audio {
          width: 100%;
          margin-bottom: 0.75rem;
        }
        .foot {
          margin-top: 1.25rem;
          color: var(--muted);
          font-size: 0.85rem;
          line-height: 1.45;
        }
        .sr {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }
        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes pulse {
          50% {
            opacity: 0.55;
          }
        }
        @media (max-width: 640px) {
          .actions {
            flex-direction: column;
            align-items: stretch;
          }
          .btn,
          .actions :global(button) {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
