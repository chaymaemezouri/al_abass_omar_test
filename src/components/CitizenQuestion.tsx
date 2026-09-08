import { useEffect, useRef, useState } from "react";
import { Check, Copy, Mic, MicOff, PencilLine, Save, Trash2 } from "lucide-react";
import { useLang } from "@/lib/i18n";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};
const draftKey = "campaign-video-question-draft-v1";

export function CitizenQuestion() {
  const { lang } = useLang();
  const ar = lang !== "fr";
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState(lang);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  useEffect(() => {
    const win = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    setSupported(Boolean(win.SpeechRecognition || win.webkitSpeechRecognition));
    try {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        setQuestion(draft.slice(0, 600));
        setSaved(true);
      }
    } catch {
      /* Storage may be disabled by the browser. */
    }
    return () => {
      if (recognition.current) {
        recognition.current.onend = null;
        recognition.current.onresult = null;
        recognition.current.onerror = null;
        recognition.current.abort();
      }
    };
  }, []);

  function dictate() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const win = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Ctor) return;
    const instance = new Ctor();
    recognition.current = instance;
    instance.lang = language === "fr" ? "fr-FR" : "ar-MA";
    instance.continuous = false;
    instance.interimResults = true;
    const prefix = question.trim();
    instance.onresult = (event) => {
      const text = Array.from(event.results)
        .map((item) => item[0]?.transcript ?? "")
        .join(" ");
      setQuestion([prefix, text].filter(Boolean).join(" ").slice(0, 600));
      setSaved(false);
    };
    instance.onend = () => setListening(false);
    instance.onerror = () => {
      setListening(false);
      setMessage(
        ar
          ? "تعذر استعمال الميكروفون. يمكنك كتابة سؤالك."
          : "Le microphone n’est pas disponible. Vous pouvez écrire votre question.",
      );
    };
    setMessage("");
    try {
      instance.start();
      setListening(true);
    } catch {
      setMessage(ar ? "تعذر بدء التسجيل." : "Impossible de démarrer la dictée.");
    }
  }
  function save() {
    if (question.trim().length < 10) {
      setMessage(
        ar
          ? "يرجى كتابة سؤال من 10 أحرف على الأقل."
          : "Votre question doit contenir au moins 10 caractères.",
      );
      return;
    }
    recognition.current?.stop();
    try {
      localStorage.setItem(draftKey, question.trim());
      setSaved(true);
      setMessage(
        ar
          ? "تم حفظ المسودة على هذا الجهاز. لم تُرسل."
          : "Brouillon enregistré sur cet appareil. Il n’a pas été envoyé.",
      );
    } catch {
      setMessage(
        ar
          ? "تعذر حفظ المسودة على الجهاز."
          : "Impossible d’enregistrer le brouillon sur cet appareil.",
      );
    }
  }

  return (
    <section className="citizen-question" aria-labelledby="citizen-question-title">
      <div>
        <p className="vd-eyebrow">
          <PencilLine size={16} />
          {ar ? "مساحة للمواطنين" : "La parole aux citoyens"}
        </p>
        <h3 id="citizen-question-title">
          {ar ? "لم تجد سؤالك؟" : "Vous ne trouvez pas votre question ?"}
        </h3>
        <p className="vd-muted">
          {ar
            ? "حضّر سؤالك كتابةً أو بالصوت. يُحفظ محلياً فقط، والإرسال إلى الفريق غير متاح بعد."
            : "Préparez votre question par écrit ou à la voix. Le brouillon reste sur cet appareil ; l’envoi à l’équipe n’est pas encore disponible."}
        </p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <label className="vd-sr-only" htmlFor="citizen-question-text">
          {ar ? "سؤالك" : "Votre question"}
        </label>
        <textarea
          id="citizen-question-text"
          value={question}
          onChange={(event) => {
            setQuestion(event.target.value);
            setSaved(false);
            setMessage("");
          }}
          maxLength={600}
          rows={3}
          placeholder={ar ? "السؤال الذي أود طرحه…" : "La question que j’aimerais poser…"}
        />
        <div className="citizen-question-tools">
          <div className="vd-segments" aria-label={ar ? "لغة الإملاء" : "Langue de dictée"}>
            {(["fr", "ar", "darija"] as const).map((id) => (
              <button
                type="button"
                key={id}
                aria-pressed={language === id}
                disabled={listening}
                onClick={() => setLanguage(id)}
              >
                {id === "fr" ? "FR" : id === "ar" ? "العربية" : "Darija"}
              </button>
            ))}
          </div>
          <span className="vd-muted">{question.length}/600</span>
          <button
            type="button"
            className="vd-icon"
            disabled={!supported}
            aria-pressed={listening}
            title={
              supported
                ? ar
                  ? "الإملاء الصوتي"
                  : "Dicter ma question"
                : ar
                  ? "الإملاء غير متاح في هذا المتصفح"
                  : "Dictée indisponible dans ce navigateur"
            }
            aria-label={ar ? "الإملاء الصوتي" : "Dicter ma question"}
            onClick={dictate}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            type="button"
            className="vd-icon"
            disabled={!question.trim()}
            title={ar ? "نسخ السؤال" : "Copier ma question"}
            aria-label={ar ? "نسخ السؤال" : "Copier ma question"}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(question);
                setMessage(ar ? "تم نسخ السؤال" : "Question copiée");
              } catch {
                setMessage(
                  ar ? "يمكنك تحديد النص ونسخه." : "Vous pouvez sélectionner et copier le texte.",
                );
              }
            }}
          >
            <Copy size={18} />
          </button>
          <button
            type="button"
            className="vd-icon"
            disabled={!question}
            title={ar ? "حذف المسودة" : "Effacer le brouillon"}
            aria-label={ar ? "حذف المسودة" : "Effacer le brouillon"}
            onClick={() => {
              recognition.current?.abort();
              setQuestion("");
              setSaved(false);
              try {
                localStorage.removeItem(draftKey);
                setMessage("");
              } catch {
                setMessage(
                  ar ? "تعذر حذف المسودة المحفوظة." : "Impossible d’effacer la copie enregistrée.",
                );
              }
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>
        <button type="submit" className="vd-primary" disabled={question.trim().length < 10}>
          {saved ? <Check size={17} /> : <Save size={17} />}
          {ar ? "حفظ مسودتي" : "Enregistrer mon brouillon"}
        </button>
        <p role="status" className="vd-muted">
          {listening ? (ar ? "الميكروفون يستمع…" : "Microphone à l’écoute…") : message}
        </p>
      </form>
    </section>
  );
}
