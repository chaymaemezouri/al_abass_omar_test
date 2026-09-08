import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Bi, Lang } from "@/data/program";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (b: Bi) => string; dir: "ltr" | "rtl" };

const LangContext = createContext<Ctx>({
  lang: "ar",
  setLang: () => {},
  t: (b) => b.ar,
  dir: "rtl",
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");
  const dir = lang === "ar" || lang === "darija" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, dir, t: (b: Bi) => (lang === "fr" ? b.fr : b.ar) }),
    [lang, dir],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

export const ui = {
  nav: {
    program: { fr: "La plateforme electorale", ar: "الأرضية الانتخابية" },
    about: { fr: "Qui sommes-nous", ar: "من نحن" },
    axes: { fr: "Axes prioritaires", ar: "المحاور الأساسية" },
    contact: { fr: "Contact", ar: "تواصل معنا" },
    chat: { fr: "Version numerique", ar: "النسخة الرقمية" },
  },
  ctaProgram: { fr: "Découvrir la plateforme electorale", ar: "اكتشف الأرضية الانتخابية" },
  ctaChat: { fr: "Parler a la version numerique", ar: "تحدث مع النسخة الرقمية" },
  keyFigures: { fr: "Chiffres clés", ar: "أرقام أساسية" },
  programTitle: { fr: "Notre plateforme électorale", ar: "أرضيتنا الانتخابية" },
  programLead: {
    fr: "Trois axes officiels : produire la richesse, repondre aux besoins essentiels et renforcer l unite nationale.",
    ar: "ثلاثة محاور رسمية: إنتاج الثروة، تلبية الحاجيات الأساسية وتعزيز الوحدة الوطنية.",
  },
  contactLead: {
    fr: "Une question, une proposition ? Écrivez-nous.",
    ar: "سؤال أو اقتراح؟ راسلونا.",
  },
  chatTitle: { fr: "Version numerique d'Omar Al Abass", ar: "النسخة الرقمية لعمر العباس" },
  online: { fr: "En ligne", ar: "متصل" },
  chatIntro: {
    fr: "Posez votre question en français, en arabe ou en darija. Je réponds uniquement à partir de la plateforme electorale.",
    ar: "اطرح سؤالك بالفرنسية أو العربية أو الدارجة. أجيب فقط انطلاقا من الأرضية الانتخابية.",
  },
  placeholder: { fr: "Écrivez votre question…", ar: "اكتب سؤالك…" },
  send: { fr: "Envoyer", ar: "إرسال" },
  error: {
    fr: "Désolé, une erreur est survenue. Merci de réessayer.",
    ar: "عذرا، وقع خطأ. المرجو المحاولة مرة أخرى.",
  },
  openChat: { fr: "Ouvrir la version numerique", ar: "فتح النسخة الرقمية" },
  closeChat: { fr: "Fermer", ar: "إغلاق" },
  footer: {
    fr: "Site officiel de campagne — Élections législatives 2026",
    ar: "الموقع الرسمي للحملة — الانتخابات التشريعية 2026",
  },
  footerNav: { fr: "Navigation", ar: "التنقل" },
  footerActions: { fr: "Actions", ar: "إجراءات" },
  footerLegal: {
    fr: "Les reponses de la version numerique s'appuient uniquement sur la plateforme electorale officielle 2026.",
    ar: "إجابات النسخة الرقمية مبنية فقط على الأرضية الانتخابية الرسمية 2026.",
  },
  footerBuiltBy: { fr: "Realise avec", ar: "من إنجاز" },
  footerCompany: { fr: "Expertise & Consulting Company", ar: "Expertise & Consulting Company" },
  footerRights: {
    fr: "© 2026 — Tous droits reserves",
    ar: "© 2026 — جميع الحقوق محفوظة",
  },
};

export const suggestions: Bi[] = [
  {
    fr: "Que propose la plateforme electorale pour l emploi des jeunes ?",
    ar: "ماذا تقترح الأرضية الانتخابية لتشغيل الشباب؟",
  },
  { fr: "Comment ameliorer le systeme de sante ?", ar: "كيف يمكن تحسين منظومة الصحة؟" },
  {
    fr: "Quelles sont les mesures pour les petites entreprises ?",
    ar: "ما هي الإجراءات الخاصة بالمقاولات الصغيرة؟",
  },
  { fr: "Comment garantir la securite hydrique ?", ar: "كيف تضمن الأرضية الانتخابية الأمن المائي؟" },
  { fr: "Que prevoit la plateforme electorale pour l education ?", ar: "ماذا تقترح الأرضية الانتخابية للتعليم؟" },
  {
    fr: "Quelles propositions concernent la femme et la famille ?",
    ar: "ما هي المقترحات المتعلقة بالمرأة والأسرة؟",
  },
];
