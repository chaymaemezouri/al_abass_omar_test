import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  Droplets,
  ExternalLink,
  GraduationCap,
  Languages,
  MessageCircle,
  Mic,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Store,
  Volume2,
  X,
} from "lucide-react";

import assistantAvatar from "@/assets/assistant-avatar.png";
import fabBallotLogo from "@/assets/image.png";
import { Logo, BasmaMark } from "@/components/Logo";
import { identity } from "@/data/program";
import { suggestions, ui, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };
type Bi = { fr: string; ar: string };
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

/** Ouvre la page Avatar Virtuel IA (intégration Avatar_Virtuel). */
export const openChat = () => {
  if (typeof window !== "undefined") {
    window.location.assign("/avatar");
  }
};

export const openChatWithQuestion = (question: string) => {
  if (typeof window !== "undefined") {
    const q = question.trim();
    window.location.assign(q ? `/avatar?q=${encodeURIComponent(q)}` : "/avatar");
  }
};

const bi = (fr: string, ar: string): Bi => ({ fr, ar });

const chatCopy = {
  subtitle: bi("Version numerique basee sur la plateforme electorale officielle", "نسخة رقمية مبنية على الأرضية الانتخابية الرسمية"),
  welcomeTitle: bi("Version numerique d'Omar Al Abass", "النسخة الرقمية لعمر العباس"),
  welcomeLead: bi(
    "Posez une question claire. Je reponds avec les mesures, les objectifs et les sources de la plateforme electorale validee.",
    "اطرح سؤالا واضحا. أجيبك بالإجراءات والأهداف والمصادر الموجودة في الأرضية الانتخابية المعتمدة.",
  ),
  sourceBadge: bi("Sources verifiees", "مصادر موثقة"),
  limitBadge: bi("Plateforme electorale uniquement", "الأرضية الانتخابية فقط"),
  privacyBadge: bi("Dialogue direct", "حوار مباشر"),
  usefulQuestions: bi("Questions utiles", "أسئلة مفيدة"),
  themes: bi("Themes de la plateforme electorale", "مواضيع الأرضية الانتخابية"),
  sourceRuleTitle: bi("Regle de fiabilite", "قاعدة الموثوقية"),
  sourceRule: bi(
    "Les reponses citent la plateforme electorale et refusent les informations absentes de la base validee.",
    "الأجوبة تعتمد على الأرضية الانتخابية وترفض المعلومات غير الموجودة في القاعدة المعتمدة.",
  ),
  quickStart: bi("Commencer rapidement", "ابدأ بسرعة"),
  listening: bi(
    "Transcription en cours. Vous pouvez corriger le texte avant l'envoi.",
    "جاري تحويل الصوت إلى نص. يمكنك تصحيح النص قبل الإرسال.",
  ),
  loading: bi("La version numerique consulte la base validee", "النسخة الرقمية تراجع القاعدة المعتمدة"),
  read: bi("Ecouter", "استمع"),
  seeCommitment: bi("Voir l'engagement complet", "عرض الالتزام كاملا"),
  source: bi("Source", "المصدر"),
  micUnsupported: bi(
    "Le micro n'est pas pris en charge par ce navigateur.",
    "الميكروفون غير مدعوم في هذا المتصفح.",
  ),
  inputHint: bi(
    "La version numerique repond uniquement a partir de la plateforme electorale officielle 2026.",
    "النسخة الرقمية تجيب فقط انطلاقا من الأرضية الانتخابية الرسمية 2026.",
  ),
  officialBase: bi("Base officielle", "قاعدة رسمية"),
  session: bi("Session de dialogue", "جلسة الحوار"),
};

const topicCards = [
  {
    label: bi("Emploi", "التشغيل"),
    prompt: bi(
      "Que propose la plateforme electorale pour l'emploi des jeunes ?",
      "ماذا تقترح الأرضية الانتخابية لتشغيل الشباب؟",
    ),
    icon: BriefcaseBusiness,
  },
  {
    label: bi("Sante", "الصحة"),
    prompt: bi("Comment ameliorer le systeme de sante ?", "كيف تقترح الأرضية الانتخابية تحسين منظومة الصحة؟"),
    icon: Stethoscope,
  },
  {
    label: bi("Education", "التعليم"),
    prompt: bi("Que prevoit la plateforme electorale pour l'education ?", "ماذا تتضمن الأرضية الانتخابية بخصوص التعليم؟"),
    icon: GraduationCap,
  },
  {
    label: bi("Eau", "الماء"),
    prompt: bi(
      "Comment garantir la securite hydrique ?",
      "كيف يمكن ضمان الأمن المائي حسب الأرضية الانتخابية؟",
    ),
    icon: Droplets,
  },
  {
    label: bi("PME", "المقاولات"),
    prompt: bi(
      "Quelles sont les mesures pour les petites entreprises ?",
      "ما هي الإجراءات الموجهة للمقاولات الصغيرة؟",
    ),
    icon: Store,
  },
  {
    label: bi("Justice", "العدالة"),
    prompt: bi(
      "Quelles mesures concernent la justice et la confiance ?",
      "ما هي إجراءات العدالة وتعزيز الثقة؟",
    ),
    icon: Scale,
  },
];

const sourceByContent = (content: string): Bi => {
  const lower = content.toLowerCase();
  if (lower.includes("pme") || lower.includes("entrepreneur") || lower.includes("marche")) {
    return bi(
      "Plateforme electorale actualisee 2026, objectif PME et marches publics",
      "المنصة الانتخابية المحينة 2026، هدف المقاولات والصفقات العمومية",
    );
  }
  if (lower.includes("eau") || lower.includes("hydrique") || lower.includes("dessalement")) {
    return bi(
      "Plateforme electorale actualisee 2026, securite hydrique et reutilisation des eaux",
      "المنصة الانتخابية المحينة 2026، الأمن المائي وإعادة استعمال المياه",
    );
  }
  if (
    lower.includes("digital") ||
    lower.includes("numerique") ||
    lower.includes("5g") ||
    lower.includes("administr")
  ) {
    return bi(
      "Plateforme electorale actualisee 2026, axe transformation numerique",
      "المنصة الانتخابية المحينة 2026، محور التحول الرقمي",
    );
  }
  if (lower.includes("culture") || lower.includes("identite") || lower.includes("famille")) {
    return bi(
      "Plateforme electorale actualisee 2026, axe identite et unite nationale",
      "المنصة الانتخابية المحينة 2026، محور الهوية والوحدة الوطنية",
    );
  }
  return bi("Plateforme electorale actualisee 2026", "المنصة الانتخابية المحينة 2026");
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
  const quickSuggestions = useMemo(() => suggestions.slice(0, 4), []);

  useEffect(() => {
    const handler = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "string") setInput(event.detail);
      setOpen(true);
    };
    window.addEventListener(OPEN_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Avoid iOS auto-zoom: don't autofocus the small field on touch devices.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) return;
    inputRef.current?.focus();
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
      setInput((value) => value || t(chatCopy.micUnsupported));
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
      <div
        className={cn(
          "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex max-w-[calc(100vw-2rem)] flex-col items-center gap-2",
          dir === "rtl" ? "left-4 sm:left-5" : "right-4 sm:right-5",
          open && "hidden",
        )}
      >
        <div className="flex flex-col items-center gap-2 px-1">
          <img
            src={fabBallotLogo}
            alt="Parti des Néo-Démocrates — رمز البصمة"
            className="h-auto w-[min(42vw,150px)] object-contain drop-shadow-sm sm:w-36"
          />
          <div
            className="text-center text-base font-extrabold leading-snug text-navy drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] sm:text-lg"
            dir="rtl"
          >
            <p>صوتوا على الشباب</p>
            <p>صوتوا على رمز البصمة</p>
            <p className="text-morocco">#عمل_جيم_للشباب</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openChat}
          aria-label={t(ui.openChat)}
          className="inline-flex items-center justify-center gap-3 rounded-sm bg-morocco px-4 py-3 text-sm font-extrabold text-white shadow-elegant transition-colors hover:bg-morocco-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">{t(ui.nav.chat)}</span>
        </button>
      </div>

      {open && (
        <div dir={dir} className="fixed inset-0 z-50 flex flex-col bg-ivory text-foreground">
          <header className="border-b border-white/10 bg-navy text-white shadow-elegant">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative grid h-12 w-12 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
                  <img
                    src={assistantAvatar}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <span className="absolute bottom-1 end-1 h-3 w-3 rounded-full border-2 border-navy bg-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold sm:text-base">{t(ui.chatTitle)}</p>
                  <p className="truncate text-xs text-white/72">{t(chatCopy.subtitle)}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <Logo decorative className="hidden h-10 w-auto sm:block" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t(ui.closeChat)}
                  className="grid h-11 w-11 place-items-center rounded-sm border border-white/20 text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="flex min-h-0 flex-col border-border lg:border-r">
              <div
                ref={scrollRef}
                className="relative min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_20%_0%,rgba(194,15,26,0.08),transparent_28%),linear-gradient(180deg,#fbfaf5_0%,#f5f1e7_100%)] p-4 sm:p-6"
              >
                <BasmaMark
                  tone="navy"
                  size="xl"
                  className="pointer-events-none fixed bottom-24 end-4 opacity-[0.05] sm:end-10"
                />
                {messages.length === 0 && (
                  <div className="relative mx-auto grid max-w-4xl gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                    <div className="relative overflow-hidden rounded-md border border-border bg-card p-5 shadow-card sm:p-6">
                      <BasmaMark tone="teal" size="sm" className="-end-4 -top-2 rotate-12" />
                      <div className="relative grid gap-5 md:grid-cols-[auto_minmax(0,1fr)]">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-navy/95 ring-4 ring-white shadow-card">
                          <img
                            src={assistantAvatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="mb-3 flex flex-wrap gap-2">
                            {[chatCopy.sourceBadge, chatCopy.limitBadge, chatCopy.privacyBadge].map(
                              (badge) => (
                                <span
                                  key={badge.fr}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-extrabold text-navy"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 text-morocco" />
                                  {t(badge)}
                                </span>
                              ),
                            )}
                          </div>
                          <h2 className="max-w-2xl text-2xl font-black leading-tight text-navy sm:text-3xl">
                            {t(chatCopy.welcomeTitle)}
                          </h2>
                          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                            {t(chatCopy.welcomeLead)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
                      <div className="rounded-md border border-border bg-card p-4 shadow-card">
                        <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-navy">
                          <Sparkles className="h-4 w-4 text-morocco" />
                          {t(chatCopy.quickStart)}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {quickSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.fr}
                              type="button"
                              onClick={() => send(t(suggestion))}
                              className="group flex min-h-16 items-center justify-between gap-3 rounded-sm border border-border bg-background px-3 py-2 text-start text-sm font-bold text-navy transition-colors hover:border-morocco hover:bg-morocco/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-morocco"
                            >
                              <span>{t(suggestion)}</span>
                              <ArrowRight
                                className={cn(
                                  "h-4 w-4 shrink-0 text-morocco transition-transform group-hover:translate-x-0.5",
                                  dir === "rtl" && "-scale-x-100",
                                )}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-md border border-border bg-navy p-4 text-white shadow-elegant">
                        <p className="mb-3 flex items-center gap-2 text-sm font-extrabold">
                          <BookOpenCheck className="h-4 w-4 text-morocco" />
                          {t(chatCopy.themes)}
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {topicCards.map((topic) => {
                            const Icon = topic.icon;
                            return (
                              <button
                                key={topic.label.fr}
                                type="button"
                                onClick={() => send(t(topic.prompt))}
                                className="group rounded-sm border border-white/15 bg-white/7 p-3 text-start transition-colors hover:border-white/35 hover:bg-white/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                              >
                                <Icon className="mb-2 h-5 w-5 text-morocco" />
                                <span className="text-sm font-extrabold">{t(topic.label)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mx-auto mt-4 max-w-4xl space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex animate-in fade-in slide-in-from-bottom-2 duration-300",
                        message.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[min(760px,92%)] rounded-md px-4 py-3 text-sm leading-relaxed shadow-card",
                          message.role === "user"
                            ? "bg-navy text-white"
                            : "border border-border bg-card text-card-foreground",
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content || "..."}</p>
                        {message.role === "assistant" && message.content && (
                          <div className="mt-4 border-t border-border pt-3">
                            <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                              <ShieldCheck className="h-4 w-4 text-morocco" />
                              {t(chatCopy.source)} : {t(sourceByContent(message.content))}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => speak(message.content)}
                                className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-bold hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-morocco"
                              >
                                <Volume2 className="h-4 w-4" />
                                {t(chatCopy.read)}
                              </button>
                              <a
                                href="#programme"
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-bold hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-morocco"
                              >
                                <ExternalLink className="h-4 w-4" />
                                {t(chatCopy.seeCommitment)}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && messages.at(-1)?.role === "user" && (
                    <div className="flex justify-start">
                      <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-card">
                        <span className="inline-flex items-center gap-2 font-bold">
                          {t(chatCopy.loading)}
                          <span className="flex gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-morocco" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-morocco [animation-delay:120ms]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-morocco [animation-delay:240ms]" />
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  send(input);
                }}
                className="border-t border-border bg-card p-3 shadow-[0_-14px_28px_rgba(2,25,55,0.06)] sm:p-4"
              >
                <div className="mx-auto max-w-4xl">
                  <div className="flex items-end gap-2 rounded-md border border-border bg-background p-2 shadow-card focus-within:ring-2 focus-within:ring-ring">
                    <button
                      type="button"
                      onClick={toggleListening}
                      aria-label={lang === "ar" ? "ميكروفون" : "Microphone"}
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-border transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-morocco",
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
                      className="max-h-32 min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-3 text-base outline-none placeholder:text-muted-foreground md:text-sm"
                    />
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      aria-label={t(ui.send)}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-morocco text-white transition-colors hover:bg-morocco-dark disabled:bg-muted disabled:text-muted-foreground"
                    >
                      <Send className={cn("h-5 w-5", dir === "rtl" && "-scale-x-100")} />
                    </button>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">
                    {listening ? t(chatCopy.listening) : t(chatCopy.inputHint)}
                  </p>
                </div>
              </form>
            </section>

            <aside className="hidden min-h-0 overflow-y-auto bg-background p-5 lg:block">
              <div className="rounded-md border border-border bg-card p-5 shadow-card">
                <p className="flex items-center gap-2 text-sm font-extrabold text-navy">
                  <Languages className="h-4 w-4 text-morocco" />
                  Darija العربية Français
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t(chatCopy.sourceRule)}
                </p>
              </div>

              <div className="mt-4 rounded-md border border-border bg-navy p-5 text-white shadow-elegant">
                <p className="text-sm font-extrabold">{t(chatCopy.session)}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold">
                  <span className="rounded-sm bg-white/10 px-3 py-2">
                    {t(chatCopy.officialBase)}
                  </span>
                  <span className="rounded-sm bg-white/10 px-3 py-2">2026</span>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-border bg-card p-5 shadow-card">
                <p className="text-sm font-extrabold text-navy">{t(chatCopy.themes)}</p>
                <div className="mt-4 grid gap-2">
                  {topicCards.map((topic) => {
                    const Icon = topic.icon;
                    return (
                      <button
                        key={topic.label.fr}
                        type="button"
                        onClick={() => send(t(topic.prompt))}
                        className="flex items-center gap-3 rounded-sm border border-border px-3 py-2 text-start text-sm font-semibold transition-colors hover:border-morocco hover:bg-morocco/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-morocco"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-morocco" />
                        <span>{t(topic.label)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-md border border-border bg-card p-5 shadow-card">
                <p className="text-sm font-extrabold text-navy">{t(chatCopy.usefulQuestions)}</p>
                <div className="mt-4 grid gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.fr}
                      type="button"
                      onClick={() => send(t(suggestion))}
                      className="rounded-sm border border-border px-3 py-2 text-start text-sm font-semibold transition-colors hover:border-morocco hover:bg-morocco/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-morocco"
                    >
                      {t(suggestion)}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                {lang === "ar" ? identity.party.ar : identity.party.fr}
              </p>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}
