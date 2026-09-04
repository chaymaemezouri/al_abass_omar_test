import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

import { useLang, ui, suggestions } from "@/lib/i18n";
import { identity } from "@/data/program";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

export const OPEN_CHAT_EVENT = "open-campaign-chat";
export const openChat = () => window.dispatchEvent(new Event(OPEN_CHAT_EVENT));

export function ChatWidget() {
  const { t, lang, dir } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t(open ? ui.closeChat : ui.openChat)}
        className={cn(
          "fixed bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground shadow-elegant transition-transform hover:scale-105",
          dir === "rtl" ? "left-5" : "right-5",
        )}
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          dir={dir}
          className={cn(
            "fixed bottom-24 z-50 flex h-[min(70vh,560px)] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elegant",
            dir === "rtl" ? "left-5" : "right-5",
          )}
        >
          <header
            className="flex items-center gap-3 px-4 py-3 text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-hero)" }}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-bold">
              {lang === "ar" ? "م" : "A"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{t(ui.chatTitle)}</p>
              <p className="flex items-center gap-1.5 text-xs opacity-90">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                {t(ui.online)}
              </p>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-surface p-4">
            {messages.length === 0 && (
              <>
                <p className="rounded-xl bg-card p-3 text-sm text-muted-foreground shadow-card">
                  {t(ui.chatIntro)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.fr}
                      type="button"
                      onClick={() => send(t(s))}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {t(s)}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground shadow-card",
                  )}
                >
                  {m.content || "…"}
                </div>
              </div>
            ))}

            {loading && messages.at(-1)?.role === "user" && (
              <div className="flex justify-start">
                <div className="animate-pulse rounded-2xl bg-card px-3.5 py-2.5 text-sm text-muted-foreground shadow-card">
                  …
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 border-t border-border bg-card p-3"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={t(ui.placeholder)}
              className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label={t(ui.send)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <Send className={cn("h-4 w-4", dir === "rtl" && "-scale-x-100")} />
            </button>
          </form>
          <p className="sr-only">{identity.party.fr}</p>
        </div>
      )}
    </>
  );
}
