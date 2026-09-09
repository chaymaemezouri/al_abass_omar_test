export type ChatResponse = {
  session_id: string;
  question: string;
  answer: string;
  language: string;
  similarity_score: number | null;
  used_fallback: boolean;
  blocked: boolean;
  audio_url: string | null;
  video_url: string | null;
  sources: string[];
  source_type?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}

function isLocalDebug(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export async function askText(
  question: string,
  sessionId: string | null,
  languageHint?: string | null
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/v1/chat/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      session_id: sessionId,
      language_hint: languageHint || null,
      include_media: true,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erreur ${res.status}`);
  }
  const data: ChatResponse = await res.json();
  if (isLocalDebug()) {
    console.info("[RAG]", {
      lang: data.language,
      score: data.similarity_score,
      source_type: data.source_type,
      sources: data.sources,
      fallback: data.used_fallback,
      blocked: data.blocked,
    });
  }
  return {
    ...data,
    audio_url: mediaUrl(data.audio_url),
    video_url: mediaUrl(data.video_url),
  };
}

export async function askAudio(
  blob: Blob,
  filename: string,
  sessionId: string | null,
  languageHint?: string | null
): Promise<ChatResponse> {
  const form = new FormData();
  form.append("file", blob, filename);
  if (sessionId) form.append("session_id", sessionId);
  if (languageHint) form.append("language_hint", languageHint);

  const res = await fetch(`${API_URL}/api/v1/chat/audio`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erreur ${res.status}`);
  }
  const data: ChatResponse = await res.json();
  if (isLocalDebug()) {
    console.info("[RAG]", {
      lang: data.language,
      score: data.similarity_score,
      source_type: data.source_type,
      sources: data.sources,
      fallback: data.used_fallback,
      blocked: data.blocked,
    });
  }
  return {
    ...data,
    audio_url: mediaUrl(data.audio_url),
    video_url: mediaUrl(data.video_url),
  };
}
