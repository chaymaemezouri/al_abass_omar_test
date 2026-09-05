import { useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  Languages,
  MessageCircle,
  Mic,
  Send,
  ShieldCheck,
  Volume2,
  X,
} from "lucide-react";

import assistantAvatar from "@/assets/assistant-avatar.png";
import { identity } from "@/data/program";
import { suggestions, ui, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export const OPEN_CHAT_EVENT = "open-campaign-chat";
export const openChat = () => window.dispatchEvent(new Event(OPEN_CHAT_EVENT));

const assistantIntro = {
  fr: "Bonjour, je suis l assistant numerique du programme electoral 2026. Je peux vous expliquer les propositions concernant l emploi, la sante, l education, l eau, le numerique, la justice, la famille ou la souverainete nationale.",
  ar: "مرحبا، أنا المساعد الرقمي للبرنامج الانتخابي 2026. أستطيع شرح المقترحات المتعلقة بالتشغيل والصحة والتعليم والماء والرقمنة والعدالة والأسرة والسيادة الوطنية.",
};

const sourceByContent = (content: string) => {
  const lower = content.toLowerCase();
  if (lower.includes("pme") || lower.includes("entrepreneur") || lower.includes("marche")) {
    return "Plateforme electorale actualisee 2026, objectif PME et marches publics";
  }
  if (lower.includes("eau") || lower.includes("hydrique") || lower.includes("dessalement")) {
    return "Plateforme electorale actualisee 2026, objectifs securite hydrique et reutilisation des eaux";
  }
  if (
    lower.includes("digital") ||
    lower.includes("numerique") ||
    lower.includes("5g") ||
    lower.includes("administr")
  ) {
    return "Plateforme electorale actualisee 2026, axe transformation numerique";
  }
  if (lower.includes("culture") || lower.includes("identite") || lower.includes("famille")) {
    return "Plateforme electorale actualisee 2026, axe identite et unite nationale";
  }
  return "Plateforme electorale actualisee 2026";
};

export function ChatWidget() {
  const { t, lang, dir } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, loading]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());

      setMessages([...next, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: acc }]);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: t(ui.error) }]);
    } finally {
      setLoading(false);
    }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "ar" ? "ar-MA" : "fr-FR";
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    const win = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (!Ctor) {
      setInput(
        (value) =>
          value ||
          (lang === "ar"
            ? "الميكروفون غير مدعوم في هذا المتصفح."
            : "Le micro n'est pas pris en charge par ce navigateur."),
      );
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new Ctor();
    recognition.lang = lang === "ar" ? "ar-MA" : "fr-FR";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) setInput(transcript);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t(ui.openChat)}
        className={cn(
          "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-sm bg-morocco px-4 py-3 text-sm font-extrabold text-white shadow-elegant transition-colors hover:bg-morocco-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
          dir === "rtl" ? "left-4 sm:left-5" : "right-4 sm:right-5",
          open && "hidden",
        )}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">{t(ui.nav.chat)}</span>
      </button>

      {open && (
        <div dir={dir} className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
          <header className="border-b border-border bg-navy text-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <img src={assistantAvatar} alt="" className="h-11 w-11 rounded-md object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">{t(ui.chatTitle)}</p>
                  <p className="truncate text-xs text-white/72">
                    Assistant IA basé sur le programme officiel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t(ui.closeChat)}
                className="grid h-10 w-10 place-items-center rounded-sm border border-white/20 text-white transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="flex min-h-0 flex-col border-border lg:border-r">
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-ivory p-4 sm:p-6"
              >
                {messages.length === 0 && (
                  <div className="mx-auto max-w-3xl rounded-md border border-border bg-card p-6 shadow-card">
                    <div className="flex items-start gap-4">
                      <img
                        src={assistantAvatar}
                        alt=""
                        className="h-14 w-14 rounded-md object-cover"
                      />
                      <div>
                        <h2 className="text-2xl leading-tight text-navy">
                          {lang === "ar" ? assistantIntro.ar : assistantIntro.fr}
                        </h2>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {["Darija", "العربية", "Français"].map((label) => (
                            <span
                              key={label}
                              className="rounded-sm border border-border px-3 py-2 text-sm font-bold"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[min(760px,92%)] rounded-md px-4 py-3 text-sm leading-relaxed shadow-card",
                        message.role === "user"
                          ? "bg-navy text-white"
                          : "bg-card text-card-foreground",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content || "..."}</p>
                      {message.role === "assistant" && message.content && (
                        <div className="mt-4 border-t border-border pt-3">
                          <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 text-morocco" />
                            Source : {sourceByContent(message.content)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => speak(message.content)}
                              className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-bold hover:bg-secondary"
                            >
                              <Volume2 className="h-4 w-4" />
                              Écouter
                            </button>
                            <a
                              href="#programme"
                              onClick={() => setOpen(false)}
                              className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-bold hover:bg-secondary"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Voir l'engagement complet
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && messages.at(-1)?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="animate-pulse rounded-md bg-card px-4 py-3 text-sm text-muted-foreground shadow-card">
                      L'assistant consulte la base validée...
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  send(input);
                }}
                className="border-t border-border bg-card p-4"
              >
                <div className="mx-auto flex max-w-4xl items-end gap-2">
                  <button
                    type="button"
                    onClick={toggleListening}
                    aria-label="Microphone"
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-border transition-colors hover:bg-secondary",
                      listening && "border-morocco bg-morocco/10 text-morocco",
                    )}
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder={t(ui.placeholder)}
                    className="max-h-32 min-h-11 flex-1 resize-none rounded-sm border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    aria-label={t(ui.send)}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-morocco text-white transition-opacity disabled:opacity-40"
                  >
                    <Send className={cn("h-5 w-5", dir === "rtl" && "-scale-x-100")} />
                  </button>
                </div>
                {listening && (
                  <p className="mx-auto mt-2 max-w-4xl text-xs font-semibold text-morocco">
                    Transcription en cours. Vous pouvez corriger le texte avant l'envoi.
                  </p>
                )}
              </form>
            </section>

            <aside className="hidden min-h-0 overflow-y-auto bg-background p-6 lg:block">
              <div className="rounded-md border border-border bg-card p-5 shadow-card">
                <p className="flex items-center gap-2 text-sm font-extrabold text-navy">
                  <Languages className="h-4 w-4 text-morocco" />
                  Darija العربية Français
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Les réponses signalent leurs sources et refusent les informations absentes de la
                  base validée.
                </p>
              </div>
              <div className="mt-5 rounded-md border border-border bg-card p-5 shadow-card">
                <p className="text-sm font-extrabold text-navy">Questions utiles</p>
                <div className="mt-4 grid gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.fr}
                      type="button"
                      onClick={() => send(t(suggestion))}
                      className="rounded-sm border border-border px-3 py-2 text-start text-sm font-semibold transition-colors hover:border-morocco hover:bg-morocco/5"
                    >
                      {t(suggestion)}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                {identity.party.fr}
              </p>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}
