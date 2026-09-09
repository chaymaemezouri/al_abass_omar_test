export type AvatarChatResponse = {
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
  followups?: string[];
};

const DEFAULT_API = "http://localhost:8000";

export function getAvatarApiUrl(): string {
  const fromEnv = import.meta.env["VITE_AVATAR_API_URL"] as string | undefined;
  return (fromEnv || DEFAULT_API).replace(/\/$/, "");
}

function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${getAvatarApiUrl()}${path}`;
}

function isLocalDebug(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export async function askAvatarText(
  question: string,
  sessionId: string | null,
  languageHint?: string | null,
  includeMedia: boolean = false,
): Promise<AvatarChatResponse> {
  const res = await fetch(`${getAvatarApiUrl()}/api/v1/chat/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      session_id: sessionId,
      language_hint: languageHint || null,
      // Text first = much faster; audio fetched via speakAvatar in parallel after
      include_media: includeMedia,
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail || `Erreur ${res.status}`);
  }
  const data = (await res.json()) as AvatarChatResponse;
  if (isLocalDebug()) {
    console.info("[Avatar RAG]", {
      lang: data.language,
      score: data.similarity_score,
      source_type: data.source_type,
      sources: data.sources,
      fallback: data.used_fallback,
    });
  }
  return {
    ...data,
    audio_url: mediaUrl(data.audio_url),
    video_url: mediaUrl(data.video_url),
  };
}

export type StreamHandlers = {
  onStatus?: (message: string) => void;
  onToken?: (text: string) => void;
};

export async function askAvatarTextStream(
  question: string,
  sessionId: string | null,
  languageHint: string | null | undefined,
  handlers: StreamHandlers = {},
): Promise<AvatarChatResponse> {
  const res = await fetch(`${getAvatarApiUrl()}/api/v1/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({
      question,
      session_id: sessionId,
      language_hint: languageHint || null,
      include_media: false,
    }),
  });
  if (!res.ok || !res.body) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail || `Erreur ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let donePayload: AvatarChatResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part
        .split("\n")
        .find((l) => l.startsWith("data:"));
      if (!line) continue;
      const raw = line.slice(5).trim();
      if (!raw) continue;
      let evt: { type?: string; message?: string; text?: string; data?: AvatarChatResponse; detail?: string };
      try {
        evt = JSON.parse(raw) as typeof evt;
      } catch {
        continue;
      }
      if (evt.type === "status" && evt.message) handlers.onStatus?.(evt.message);
      if (evt.type === "token" && evt.text) handlers.onToken?.(evt.text);
      if (evt.type === "error") throw new Error(evt.detail || "Erreur stream");
      if (evt.type === "done" && evt.data) donePayload = evt.data;
    }
  }

  if (!donePayload) throw new Error("Réponse stream incomplète");
  if (isLocalDebug()) {
    console.info("[Avatar RAG stream]", {
      lang: donePayload.language,
      score: donePayload.similarity_score,
      source_type: donePayload.source_type,
      sources: donePayload.sources,
      fallback: donePayload.used_fallback,
    });
  }
  return {
    ...donePayload,
    audio_url: mediaUrl(donePayload.audio_url),
    video_url: mediaUrl(donePayload.video_url),
  };
}

export async function simplifyAvatarAnswer(
  text: string,
  language: string,
  sessionId?: string | null,
): Promise<string> {
  const lang = language === "ary" || language === "ar" || language === "fr" ? language : "fr";
  const res = await fetch(`${getAvatarApiUrl()}/api/v1/chat/simplify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      language: lang,
      session_id: sessionId || null,
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail || `Erreur ${res.status}`);
  }
  const data = (await res.json()) as { answer?: string };
  return (data.answer || text).trim();
}

export async function speakAvatar(
  text: string,
  language: string,
): Promise<string | null> {
  const lang = language === "ary" || language === "ar" || language === "fr" ? language : "fr";
  const res = await fetch(`${getAvatarApiUrl()}/api/v1/chat/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language: lang }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { audio_url?: string | null; success?: boolean };
  return mediaUrl(data.audio_url ?? null);
}

export async function askAvatarAudio(
  blob: Blob,
  filename: string,
  sessionId: string | null,
  languageHint?: string | null,
): Promise<AvatarChatResponse> {
  const form = new FormData();
  form.append("file", blob, filename);
  if (sessionId) form.append("session_id", sessionId);
  if (languageHint) form.append("language_hint", languageHint);

  const res = await fetch(`${getAvatarApiUrl()}/api/v1/chat/audio`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail || `Erreur ${res.status}`);
  }
  const data = (await res.json()) as AvatarChatResponse;
  return {
    ...data,
    audio_url: mediaUrl(data.audio_url),
    video_url: mediaUrl(data.video_url),
  };
}
