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
    program: { fr: "La plateforme électorale", ar: "الأرضية الانتخابية" },
    about: { fr: "À propos", ar: "حول التطبيق" },
    axes: { fr: "Axes prioritaires", ar: "المحاور الأساسية" },
    contact: { fr: "Contact", ar: "تواصل معنا" },
    chat: { fr: "Version numérique", ar: "النسخة الرقمية" },
  },
  aboutTitle: {
    fr: "Application numérique de la campagne électorale 2026",
    ar: "التطبيق الرقمي للحملة الانتخابية 2026",
  },
  aboutP1: {
    fr: "Cette application a été développée comme une version numérique intelligente du candidat Omar Al Abass, pour sa campagne électorale de 2026, afin de présenter le programme électoral et son contenu aux citoyens de manière numérique, interactive et innovante.",
    ar: "تم تطوير هذا التطبيق باعتباره نسخة رقمية ذكية للمرشح عمر العباس، لحملته الانتخابية لسنة 2026، بهدف تقديم البرنامج الانتخابي ومضامينه للمواطنين بطريقة رقمية تفاعلية ومبتكرة.",
  },
  aboutP2: {
    fr: "L'application a été développée par Expertise and Consulting Company, sous la supervision scientifique et technique du professeur fondateur Mostafa Ezziyyani, expert en intelligence artificielle et en développement de solutions et d'applications intelligentes.",
    ar: "وقد تم تطوير التطبيق من طرف شركة Expertise and Consulting Company، تحت الإشراف العلمي والتقني للأستاذ المؤسس البروفيسور مصطفى الزياني (Mostafa Ezziyyani)، الخبير في الذكاء الاصطناعي وتطوير الحلول والتطبيقات الذكية.",
  },
  aboutP3: {
    fr: "Elle s'appuie sur les techniques d'intelligence artificielle, la science des données et l'interaction numérique pour présenter le programme électoral, expliquer ses axes, répondre aux questions des citoyens sur son contenu, et faciliter l'accès à l'information de manière simplifiée et interactive.",
    ar: "ويعتمد التطبيق على تقنيات الذكاء الاصطناعي وعلوم البيانات والتفاعل الرقمي لتقديم البرنامج الانتخابي، شرح محاوره، الإجابة عن استفسارات المواطنين حول مضامينه، وتسهيل الوصول إلى المعلومات بطريقة مبسطة وتفاعلية.",
  },
  aboutP4: {
    fr: "Cette solution vise à passer de la présentation traditionnelle du programme électoral à un modèle moderne fondé sur la communication numérique, l'interaction, la transparence, et la facilitation de l'accès du citoyen à l'information électorale.",
    ar: "ويهدف هذا الحل إلى الانتقال من العرض التقليدي للبرنامج الانتخابي إلى نموذج حديث يقوم على التواصل الرقمي، التفاعل، الشفافية، وتيسير وصول المواطن إلى المعلومة الانتخابية.",
  },
  aboutContact: { fr: "Contact", ar: "للتواصل" },
  aboutLinkedIn: { fr: "LinkedIn — Mostafa Ezziyyani", ar: "LinkedIn — مصطفى الزياني" },
  ctaProgram: { fr: "Découvrir la plateforme électorale", ar: "اكتشف الأرضية الانتخابية" },
  ctaChat: { fr: "Parler à la version numérique", ar: "تحدث مع النسخة الرقمية" },
  keyFigures: { fr: "Chiffres clés", ar: "أرقام أساسية" },
  programTitle: { fr: "Notre plateforme électorale", ar: "أرضيتنا الانتخابية" },
  programLead: {
    fr: "Trois axes officiels : produire la richesse, répondre aux besoins essentiels et renforcer l'unité nationale.",
    ar: "ثلاثة محاور رسمية: إنتاج الثروة، تلبية الحاجيات الأساسية وتعزيز الوحدة الوطنية.",
  },
  contactLead: {
    fr: "Une question, une proposition ? Écrivez-nous.",
    ar: "سؤال أو اقتراح؟ راسلونا.",
  },
  chatTitle: { fr: "Version numérique d'Omar Al Abass", ar: "النسخة الرقمية لعمر العباس" },
  online: { fr: "En ligne", ar: "متصل" },
  chatIntro: {
    fr: "Posez votre question en français, en arabe ou en darija. Je réponds uniquement à partir de la plateforme électorale.",
    ar: "اطرح سؤالك بالفرنسية أو العربية أو الدارجة. أجيب فقط انطلاقا من الأرضية الانتخابية.",
  },
  placeholder: { fr: "Écrivez votre question…", ar: "اكتب سؤالك…" },
  send: { fr: "Envoyer", ar: "إرسال" },
  error: {
    fr: "Désolé, une erreur est survenue. Merci de réessayer.",
    ar: "عذرا، وقع خطأ. المرجو المحاولة مرة أخرى.",
  },
  openChat: { fr: "Ouvrir la version numérique", ar: "فتح النسخة الرقمية" },
  closeChat: { fr: "Fermer", ar: "إغلاق" },
  footer: {
    fr: "Site officiel de campagne — Élections législatives 2026",
    ar: "الموقع الرسمي للحملة — الانتخابات التشريعية 2026",
  },
  footerNav: { fr: "Navigation", ar: "التنقل" },
  footerActions: { fr: "Actions", ar: "إجراءات" },
  footerLegal: {
    fr: "Les réponses de la version numérique s'appuient uniquement sur la plateforme électorale officielle 2026.",
    ar: "إجابات النسخة الرقمية مبنية فقط على الأرضية الانتخابية الرسمية 2026.",
  },
  footerBuiltBy: { fr: "Réalisé avec", ar: "من إنجاز" },
  footerCompany: { fr: "Expertise & Consulting Company", ar: "Expertise & Consulting Company" },
  footerRights: {
    fr: "© 2026 — Tous droits réservés",
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
