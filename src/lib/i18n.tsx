import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Bi, Lang } from "@/data/program";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (b: Bi) => string; dir: "ltr" | "rtl" };

const LangContext = createContext<Ctx>({
  lang: "fr",
  setLang: () => {},
  t: (b) => b.fr,
  dir: "ltr",
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, dir, t: (b: Bi) => (lang === "ar" ? b.ar : b.fr) }),
    [lang, dir],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

export const ui = {
  nav: {
    program: { fr: "Le programme", ar: "البرنامج الانتخابي" },
    about: { fr: "Qui sommes-nous", ar: "من نحن" },
    axes: { fr: "Axes prioritaires", ar: "المحاور الأساسية" },
    contact: { fr: "Contact", ar: "تواصل معنا" },
    chat: { fr: "Assistant IA", ar: "اسأل المساعد" },
  },
  ctaProgram: { fr: "Découvrir le programme", ar: "اكتشف البرنامج" },
  ctaChat: { fr: "Parler à l'assistant", ar: "تحدث مع المساعد" },
  keyFigures: { fr: "Chiffres clés", ar: "أرقام أساسية" },
  programTitle: { fr: "Notre programme électoral", ar: "برنامجنا الانتخابي" },
  programLead: {
    fr: "Cinq axes, des engagements concrets et mesurables.",
    ar: "خمسة محاور، والتزامات ملموسة وقابلة للقياس.",
  },
  contactLead: {
    fr: "Une question, une proposition ? Écrivez-nous.",
    ar: "سؤال أو اقتراح؟ راسلونا.",
  },
  chatTitle: { fr: "Assistant du programme", ar: "مساعد البرنامج" },
  online: { fr: "En ligne", ar: "متصل" },
  chatIntro: {
    fr: "Posez votre question en français, en arabe ou en darija. Je réponds uniquement à partir du programme.",
    ar: "اطرح سؤالك بالفرنسية أو العربية أو الدارجة. أجيب فقط انطلاقا من البرنامج.",
  },
  placeholder: { fr: "Écrivez votre question…", ar: "اكتب سؤالك…" },
  send: { fr: "Envoyer", ar: "إرسال" },
  error: {
    fr: "Désolé, une erreur est survenue. Merci de réessayer.",
    ar: "عذرا، وقع خطأ. المرجو المحاولة مرة أخرى.",
  },
  openChat: { fr: "Ouvrir l'assistant", ar: "فتح المساعد" },
  closeChat: { fr: "Fermer", ar: "إغلاق" },
  footer: {
    fr: "Site officiel de campagne — Élections législatives 2026",
    ar: "الموقع الرسمي للحملة — الانتخابات التشريعية 2026",
  },
};

export const suggestions: Bi[] = [
  { fr: "Quelles mesures pour les PME ?", ar: "شنو هو البرنامج ديال الاقتصاد؟" },
  { fr: "Comment digitaliser l'administration ?", ar: "كيفاش غادي ترقمنو الإدارة؟" },
  { fr: "Que proposez-vous pour l'emploi des jeunes ?", ar: "أشنو كاين لتشغيل الشباب؟" },
];
