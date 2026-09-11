import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  Droplets,
  Factory,
  Globe2,
  FileText,
  GraduationCap,
  Heart,
  Menu,
  MessageSquareText,
  Mic,
  Mail,
  MonitorSmartphone,
  Phone,
  RadioTower,
  Scale,
  Send,
  ShieldCheck,
  Store,
  Sparkles,
  Target,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import heroBackground from "@/assets/AriierePlan.png";
import assistantPortrait from "@/assets/Avatar.png";
import candidatePortrait from "@/assets/image-original-cutout.png";
import programmePdf from "@/assets/programme-electoral-2026.pdf";
import companyLogo from "@/assets/expertise-consulting.png";
import companyLogoMark from "@/assets/expertise-consulting-mark.png";
import linkedInQr from "@/assets/QR_LinkedIn_Mostafa_Ezziyyani.png";
import carte1 from "@/assets/cartes/carte1 (1).png";
import carte2 from "@/assets/cartes/carte1 (2).png";
import carte3 from "@/assets/cartes/carte1 (3).png";
import carte4 from "@/assets/cartes/carte1 (4).png";
import carte5 from "@/assets/cartes/carte1 (5).png";
import carte6 from "@/assets/cartes/carte1 (6).png";
import carte7 from "@/assets/cartes/carte1 (7).png";
import carte8 from "@/assets/cartes/carte1 (8).png";
import carte9 from "@/assets/cartes/carte1 (9).png";
import { ChatWidget, openChat, openChatWithQuestion } from "@/components/ChatWidget";
import { CandidateVideos } from "@/components/CandidateVideos";
import { Logo, BasmaMark, basmaLogo } from "@/components/Logo";
import {
  axes,
  axisById,
  avatarQuestionForEngagement,
  engagements,
  financing,
  firstHundredDays,
  identity,
  type Bi,
  type Engagement,
} from "@/data/program";
import { LangProvider, useLang, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const engagementCardBackgrounds = [
  carte1,
  carte2,
  carte3,
  carte4,
  carte5,
  carte6,
  carte7,
  carte8,
  carte9,
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Al ABASS Omar - Plateforme électorale 2026 | L'appui en dialogue" },
      {
        name: "description",
        content:
          "Plateforme officielle pour comprendre, explorer et interroger la plateforme electorale nationale 2026 du Parti des Democrates Nouveaux.",
      },
      { property: "og:title", content: "L'appui en dialogue - Plateforme électorale 2026" },
      {
        property: "og:description",
        content:
          "Découvrez les engagements, le parcours du candidat et la version numerique officielle de la plateforme electorale.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <LangProvider>
      <Page />
    </LangProvider>
  ),
});

const bi = (fr: string, ar: string = fr): Bi => ({ fr, ar });

const copy = {
  nav: [
    { label: bi("Accueil", "الرئيسية"), href: "#accueil" },
    { label: bi("Vidéos", "فيديوهات"), href: "#videos" },
    { label: bi("Plateforme électorale", "الأرضية الانتخابية"), href: "#programme" },
    { label: bi("Engagements", "الالتزامات"), href: "#engagements" },
    { label: bi("À propos", "حول التطبيق"), href: "#apropos" },
  ],
  official: bi("Site officiel de la plateforme électorale", "المنصة الرسمية للأرضية الانتخابية"),
  elections: bi("Élections législatives 2026", "الانتخابات التشريعية 2026"),
  heroLead: bi(
    "Produire la richesse, répondre aux besoins essentiels et renforcer l'unité nationale grâce à des politiques publiques fondées sur l'efficacité, la justice et la responsabilité.",
    "إنتاج الثروة، الاستجابة للحاجيات الأساسية، وتعزيز الوحدة الوطنية عبر سياسات عمومية مبنية على الفعالية والعدالة والمسؤولية.",
  ),
  consult: bi("Interroger la version numérique", "اسأل النسخة الرقمية"),
  ask: bi("Poser la question", "طرح السؤال"),
  download: bi("Télécharger la plateforme électorale PDF", "تحميل الأرضية الانتخابية PDF"),
  proofTitle: bi("Objectifs chiffrés de la plateforme électorale", "الأهداف الرقمية للأرضية الانتخابية"),
  proofLead: bi(
    "Neuf objectifs nationaux, formulés avec leurs échéances et leur source : plateforme électorale actualisée 2026.",
    "تسعة أهداف وطنية مع آجالها ومصدرها: الأرضية الانتخابية 2026.",
  ),
  trustLine: bi(
    "Des réponses fiables, basées uniquement sur la plateforme électorale validée.",
    "إجابات موثوقة مبنية فقط على الأرضية الانتخابية المعتمدة.",
  ),
  heroLocalBadge: bi(
    "Élections législatives 2026 — Parti des Démocrates Nouveaux",
    "انتخابات 2026 — حزب الديمقراطيين الجدد",
  ),
  heroCandidateName: bi("Omar Al Abass", "عمر العباس"),
  heroLocalTitle: bi(
    "Pour un Maroc souverain, efficace et solidaire",
    "من أجل مغرب سيادي وفعال ومتضامن",
  ),
  candidateCta: bi("Découvrir la plateforme électorale", "اكتشاف الأرضية الانتخابية"),
  mobileBadge: bi("Parti des Néo-Démocrates", "حزب الديمقراطيين الجدد"),
  mobileCta: bi("Télécharger la plateforme électorale PDF", "تحميل الأرضية الانتخابية PDF"),
  mobileAskHint: bi("Écrivez votre question...", "اكتب سؤالك..."),
  mobileAskBtn: bi("Posez votre question", "اطرح سؤالك"),
  mobileTrust: bi(
    "Réponses basées sur la plateforme électorale",
    "إجابات مبنية على الأرضية الانتخابية",
  ),
  captionDigitalShort: bi("Je suis sa version numérique", "أنا نسخته الرقمية"),
  captionCandidateShort: bi("Je suis Omar Al Abass", "أنا عمر العباس"),
  assistantNote: bi(
    "La version numérique d'Omar Al Abass",
    "النسخة الرقمية لعمر العباس",
  ),
  assistantLead: bi(
    "Réponses basées uniquement sur la plateforme électorale officielle du Parti des Démocrates Nouveaux.",
    "إجابات مبنية فقط على الأرضية الانتخابية الرسمية لحزب الديمقراطيين الجدد.",
  ),
  assistantSublead: bi(
    "Posez vos questions en français, en arabe ou en darija sur l'emploi, la santé, l'éducation, l'eau, le numérique, la justice, la famille ou la souveraineté nationale.",
    "اطرح أسئلتك بالعربية أو الفرنسية أو الدارجة حول التشغيل والصحة والتعليم والماء والرقمنة والعدالة والأسرة والسيادة الوطنية.",
  ),
  assistantPlaceholder: bi(
    "Posez votre question sur la plateforme électorale 2026…",
    "اطرح سؤالك حول الأرضية الانتخابية الرسمية 2026...",
  ),
  sources: bi("Sources de la plateforme électorale", "مصادر الأرضية الانتخابية"),
  timeline: bi("Priorités de la prochaine législature", "أولويات الولاية التشريعية المقبلة"),
  candidateTitle: bi("Vision et valeurs", "الرؤية والقيم"),
  financingTitle: bi(
    "Une politique fondée sur l'efficacité et la responsabilité",
    "سياسة قائمة على الفعالية والمسؤولية",
  ),
  compareTitle: bi("Explorer la plateforme électorale par thème", "استكشاف الأرضية الانتخابية حسب الموضوع"),
  currentProblem: bi("Constat", "المعطى"),
  proposal: bi("Proposition", "المقترح"),
  beneficiaries: bi("Bénéficiaires", "المستفيدون"),
  funding: bi("Source", "المصدر"),
  calendar: bi("Calendrier", "الجدولة"),
  indicator: bi("Indicateur", "المؤشر"),
  objective: bi("Objectif", "الهدف"),
  axis: bi("Axe", "المحور"),
  priority: bi("Priorité", "أولوية"),
  theme: bi("Thème", "الموضوع"),
  mainProposal: bi("Proposition principale", "المقترح الرئيسي"),
  deadline: bi("Échéance", "الأجل"),
  sourceShort: bi("Plateforme électorale actualisée 2026", "الأرضية الانتخابية 2026"),
  askPrecision: bi("Plus de détails avec l'IA", "المزيد من التفاصيل مع الذكاء الاصطناعي"),
  askCardDetails: bi("Détails avec l'IA", "التفاصيل مع الذكاء الاصطناعي"),
};

const icons = {
  factory: Factory,
  shield: ShieldCheck,
  monitor: MonitorSmartphone,
  store: Store,
  scale: Scale,
};

const heroFeatures = [
  { icon: BarChart3, label: bi("3 grands axes stratégiques", "3 محاور استراتيجية كبرى") },
  {
    icon: Users,
    label: bi(
      "100 000 jeunes formés au numérique chaque année",
      "100 ألف شاب يتكونون رقمياً كل سنة",
    ),
  },
  {
    icon: MonitorSmartphone,
    label: bi(
      "100 milliards DH générés par la transformation numérique",
      "100 مليار درهم من التحول الرقمي",
    ),
  },
  {
    icon: Store,
    label: bi(
      "Top 50 mondial de l’administration électronique en 2030",
      "ضمن أفضل 50 عالمياً في الإدارة الإلكترونية سنة 2030",
    ),
  },
  {
    icon: ShieldCheck,
    label: bi("Unité nationale, justice et responsabilité", "الوحدة الوطنية والعدالة والمسؤولية"),
  },
];

const assistantTopics = [
  { icon: BarChart3, label: bi("PME", "المقاولات") },
  { icon: Target, label: bi("Eau", "الماء") },
  { icon: ShieldCheck, label: bi("Santé", "الصحة") },
  { icon: FileText, label: bi("Éducation", "التعليم") },
  { icon: Users, label: bi("Identité", "الهوية") },
];

const mobileTopics = [
  { icon: GraduationCap, label: bi("Education", "التعليم") },
  { icon: Heart, label: bi("Sante", "الصحة") },
  { icon: Droplets, label: bi("Eau", "الماء") },
];
const figures = [
  { value: "3", label: bi("grands axes stratégiques", "محاور استراتيجية كبرى") },
  {
    value: "100 000",
    label: bi("jeunes formés au numérique chaque année", "شاب يتكونون رقمياً كل سنة"),
  },
  { value: "100 MMDH", label: bi("générés par la transformation numérique", "من التحول الرقمي") },
  {
    value: "Top 50",
    label: bi("administration électronique en 2030", "الإدارة الإلكترونية سنة 2030"),
  },
];

const programThemes: ThemeItem[] = [
  {
    theme: bi("Administration numerique", "الإدارة الرقمية"),
    proposition: bi("Maroc dans le Top 50 mondial", "المغرب ضمن أفضل 50 عالمياً"),
    echeance: bi("2030", "2030"),
    icon: MonitorSmartphone,
    progress: 82,
    accent: "bg-teal",
  },
  {
    theme: bi("Talents numeriques", "المواهب الرقمية"),
    proposition: bi("Former 100 000 jeunes par an", "تكوين 100 ألف شاب سنوياً"),
    echeance: bi("2030", "2030"),
    icon: Users,
    progress: 74,
    accent: "bg-morocco",
  },
  {
    theme: bi("PME", "المقاولات الصغرى والمتوسطة"),
    proposition: bi("Reserver 20 % des commandes publiques", "تخصيص 20% من الطلبيات العمومية"),
    echeance: bi("Prochaine legislature", "الولاية التشريعية المقبلة"),
    icon: Store,
    progress: 62,
    accent: "bg-navy",
  },
  {
    theme: bi("Eau", "الماء"),
    proposition: bi("Dessalement couvrant 60 % des besoins", "التحلية لتغطية 60% من الحاجيات"),
    echeance: bi("2030", "2030"),
    icon: Target,
    progress: 60,
    accent: "bg-teal",
  },
  {
    theme: bi("5G", "الجيل الخامس"),
    proposition: bi("Couvrir 70 % de la population", "تغطية 70% من السكان"),
    echeance: bi("Avant 2030", "قبل 2030"),
    icon: RadioTower,
    progress: 70,
    accent: "bg-morocco",
  },
  {
    theme: bi("Monde rural", "العالم القروي"),
    proposition: bi("Connecter 1 800 communes", "ربط 1800 جماعة"),
    echeance: bi("Prochaine legislature", "الولاية التشريعية المقبلة"),
    icon: Globe2,
    progress: 58,
    accent: "bg-navy",
  },
  {
    theme: bi("Ammoniac vert", "الأمونياك الأخضر"),
    proposition: bi("Produire 1 puis 3 millions de tonnes", "إنتاج مليون ثم 3 ملايين طن"),
    echeance: bi("2027-2032", "2027-2032"),
    icon: Factory,
    progress: 66,
    accent: "bg-teal",
  },
  {
    theme: bi("Culture", "الثقافة"),
    proposition: bi("Soutenir 100 000 emplois creatifs", "دعم 100 ألف منصب إبداعي"),
    echeance: bi("2030", "2030"),
    icon: Sparkles,
    progress: 72,
    accent: "bg-morocco",
  },
];
type ThemeItem = {
  theme: Bi;
  proposition: Bi;
  echeance: Bi;
  icon: typeof Target;
  progress: number;
  accent: string;
};

const axisSubthemes: Record<string, Bi[]> = {
  richesse: [
    bi("Administration numerique", "الإدارة الرقمية"),
    bi("Soutien aux PME", "دعم المقاولات الصغرى والمتوسطة"),
    bi("Souverainete energetique", "السيادة الطاقية"),
    bi("Hydrogene et ammoniac verts", "الهيدروجين والأمونياك الأخضر"),
    bi("Securite hydrique", "الأمن المائي"),
    bi("Economie bleue", "الاقتصاد الأزرق"),
    bi("Cybersecurite", "الأمن السيبراني"),
    bi("Innovation", "الابتكار"),
  ],
  besoins: [
    bi("Sante", "الصحة"),
    bi("Education", "التعليم"),
    bi("Protection sociale", "الحماية الاجتماعية"),
    bi("Retraites", "التقاعد"),
    bi("Emploi des jeunes", "تشغيل الشباب"),
    bi("Autonomisation des femmes", "التمكين الاقتصادي للنساء"),
    bi("Justice efficace", "عدالة فعالة"),
  ],
  identite: [
    bi("Sahara marocain", "الصحراء المغربية"),
    bi("Code de la famille", "مدونة الأسرة"),
    bi("Arabe et amazighe", "العربية والأمازيغية"),
    bi("Anglais scientifique", "الإنجليزية العلمية"),
    bi("Culture et sport", "الثقافة والرياضة"),
    bi("Diplomatie culturelle", "الدبلوماسية الثقافية"),
    bi("Regionalisation avancee", "الجهوية المتقدمة"),
  ],
};

const dashboardMetrics = [
  {
    value: "100k",
    label: bi("jeunes formes / an", "شاب يتكونون سنوياً"),
    detail: bi("Competences numeriques", "الكفاءات الرقمية"),
    progress: 76,
    icon: Users,
  },
  {
    value: "100",
    label: bi("milliards DH", "مليار درهم"),
    detail: bi("Transformation numerique", "التحول الرقمي"),
    progress: 68,
    icon: MonitorSmartphone,
  },
  {
    value: "70%",
    label: bi("couverture 5G", "تغطية الجيل الخامس"),
    detail: bi("Avant 2030", "قبل 2030"),
    progress: 70,
    icon: RadioTower,
  },
  {
    value: "1 800",
    label: bi("communes rurales", "جماعة قروية"),
    detail: bi("Internet haut debit", "إنترنت عالي الصبيب"),
    progress: 58,
    icon: Globe2,
  },
];
function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) el.classList.add("is-visible");
      },
      { threshold: 0.12 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("reveal", className)}>
      {children}
    </div>
  );
}

function SectionHeading({
  kicker,
  title,
  lead,
  inverted = false,
}: {
  kicker?: string;
  title: string;
  lead?: string;
  inverted?: boolean;
}) {
  return (
    <Reveal className="max-w-3xl">
      {kicker && <p className={cn("section-kicker", inverted && "text-morocco-light")}>{kicker}</p>}
      <h2
        className={cn(
          "mt-2 text-xl leading-tight sm:text-3xl lg:text-4xl",
          inverted ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            "mt-2 text-sm leading-relaxed sm:mt-3 sm:text-base",
            inverted ? "text-white/75" : "text-muted-foreground",
          )}
        >
          {lead}
        </p>
      )}
    </Reveal>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 border-t border-border pt-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-morocco" />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{value}</p>
      </div>
    </div>
  );
}

function EngagementCard({ engagement }: { engagement: Engagement }) {
  const { t, lang } = useLang();
  const ar = lang !== "fr";
  const axis = axisById(engagement.axis);
  const [flipped, setFlipped] = useState(false);
  const cardSrc =
    engagementCardBackgrounds[Math.max(0, Math.min(8, engagement.cardBg - 1))] ??
    engagementCardBackgrounds[0];

  function toggleFlip() {
    setFlipped((value) => !value);
  }

  function askAiDetails(e?: { stopPropagation: () => void; preventDefault: () => void }) {
    e?.stopPropagation();
    e?.preventDefault();
    openChatWithQuestion(avatarQuestionForEngagement(engagement, lang));
  }

  return (
    <Reveal>
      <article
        id={`engagement-${engagement.n}`}
        className="group h-[250px] scroll-mt-28 [perspective:1000px]"
      >
        <div
          role="button"
          tabIndex={0}
          aria-expanded={flipped}
          aria-label={
            flipped
              ? ar
                ? "إغلاق التفاصيل"
                : "Fermer les détails"
              : ar
                ? "عرض التفاصيل"
                : "Voir les détails"
          }
          onClick={toggleFlip}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleFlip();
            }
          }}
          className="relative h-full w-full cursor-pointer text-start transition-transform duration-700 [transform-style:preserve-3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          style={{ transform: flipped ? "rotateY(180deg)" : undefined }}
        >
          {/* ══════ FRONT ══════ */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl shadow-card [backface-visibility:hidden] bg-cover bg-center"
            style={{ backgroundImage: `url('${cardSrc}')` }}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/60" />

            <div className="relative z-10 flex h-full flex-col p-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                  {t(copy.objective)} {engagement.n} · {t(copy.axis)} {axis.number}
                </p>
                {engagement.first100 && (
                  <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    {t(copy.priority)}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="mt-1 text-sm font-extrabold leading-snug text-white">
                {t(engagement.title)}
              </h3>

              {/* Promise */}
              <p className="mt-1 text-[11px] leading-relaxed text-white/85 line-clamp-2">
                {t(engagement.promise)}
              </p>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Big KPI */}
              <p className="text-3xl font-black leading-none text-white drop-shadow-lg" dir="ltr">
                {engagement.bigNumber}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-white/75">
                {t(engagement.bigUnit)}
              </p>

              {/* Footer */}
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white">
                  <CalendarDays className="h-2.5 w-2.5" />
                  {engagement.calendar}
                </div>
                <button
                  type="button"
                  onClick={askAiDetails}
                  className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm transition hover:bg-white/40"
                >
                  <MessageSquareText className="h-2.5 w-2.5" />
                  {ar ? "اضغط للتفاصيل مع الذكاء الاصطناعي" : "Details avec l'IA"}
                </button>
              </div>
            </div>
          </div>

          {/* ══════ BACK ══════ */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl border border-border bg-white shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {/* Watermark number */}
            <span
              className="pointer-events-none absolute -bottom-4 -right-2 select-none text-[80px] font-black leading-none text-navy/[0.04]"
              dir="ltr"
            >
              {engagement.bigNumber}
            </span>

            <div className="relative z-10 flex h-full flex-col p-3.5">
              {/* Header */}
              <div className="flex items-center gap-2">
                <span className="inline-block h-1 w-5 rounded-full bg-gradient-to-r from-morocco to-morocco/60" />
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-morocco">
                  {t(copy.objective)} {engagement.n} · {t(copy.axis)} {axis.number}
                </p>
              </div>
              <h3 className="mt-1.5 text-sm font-extrabold leading-snug text-navy">
                {t(engagement.title)}
              </h3>

              {/* Divider */}
              <div className="mt-2.5 h-px bg-gradient-to-r from-navy/15 via-navy/5 to-transparent" />

              {/* Problem */}
              <div className="mt-2.5 flex gap-2">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-red-50 text-[10px]">
                  ⚠️
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-morocco/70">
                    {t(bi("Constat", "التشخيص"))}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-navy/60">
                    {t(engagement.problem)}
                  </p>
                </div>
              </div>

              {/* Proposal */}
              <div className="mt-2 flex gap-2">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-emerald-50 text-[10px]">
                  💡
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700/70">
                    {t(copy.proposal)}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-navy/60">
                    {t(engagement.proposal)}
                  </p>
                </div>
              </div>

              {/* Beneficiaries */}
              <div className="mt-2 flex gap-2">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-sky-50">
                  <Users className="h-2.5 w-2.5 text-sky-600" />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-sky-700/70">
                    {t(copy.beneficiaries)}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-navy/60">
                    {t(engagement.beneficiaries)}
                  </p>
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* CTA */}
              <div className="mt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={askAiDetails}
                  className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-navy px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-morocco"
                >
                  <MessageSquareText size={11} />
                  {t(copy.askPrecision)}
                </button>
                <span className="text-[9px] font-medium text-navy/20">↩</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

function AxisPanel({ axisId }: { axisId: (typeof axes)[number]["id"] }) {
  const { t } = useLang();
  const axis = axisById(axisId);
  const Icon = icons[axis.icon];
  const related = engagements.filter((item) => item.axis === axis.id);
  const sample = related[0];

  return (
    <Reveal>
      <article className="h-full rounded-md border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-navy text-white">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-morocco">
              {t(copy.axis)} {axis.number}
            </p>
            <h3 className="text-lg leading-snug">{t(axis.title)}</h3>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t(axis.summary)}</p>
        {sample && (
          <div className="mt-5 grid gap-3">
            <DetailRow icon={FileText} label={t(copy.currentProblem)} value={t(sample.problem)} />
            <DetailRow icon={CheckCircle2} label={t(copy.proposal)} value={t(sample.proposal)} />
            <DetailRow icon={Users} label={t(copy.beneficiaries)} value={t(sample.beneficiaries)} />
            <DetailRow icon={WalletCards} label={t(copy.funding)} value={t(sample.funding)} />
            <DetailRow icon={BarChart3} label={t(copy.indicator)} value={t(sample.indicator)} />
          </div>
        )}
        <div className="mt-5 flex items-baseline gap-3 rounded-md bg-ivory p-4">
          <span className="text-2xl font-extrabold text-morocco" dir="ltr">
            {axis.stat.value}
          </span>
          <span className="text-xs text-muted-foreground">{t(axis.stat.label)}</span>
        </div>
      </article>
    </Reveal>
  );
}

function Page() {
  const { t, lang, setLang, dir } = useLang();
  const featuredEngagements = engagements.filter((item) => item.first100);
  const [engagementFilter, setEngagementFilter] = useState("all");
  const visibleEngagements = engagements.filter(
    (item) => engagementFilter === "all" || item.axis === engagementFilter,
  );
  const [activeAxisId, setActiveAxisId] = useState(axes[0]!.id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const activeAxis = axisById(activeAxisId);
  const ActiveAxisIcon = icons[activeAxis.icon];
  const activeEngagements = useMemo(
    () => engagements.filter((item) => item.axis === activeAxisId),
    [activeAxisId],
  );

  useEffect(() => {
    let frame = 0;
    const showEngagement = (event: Event) => {
      if (
        !(event instanceof CustomEvent) ||
        typeof event.detail !== "string" ||
        !/^engagement-\d+$/.test(event.detail)
      )
        return;
      const id = event.detail;
      setEngagementFilter("all");
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() =>
          document.getElementById(id)?.scrollIntoView({ block: "start" }),
        );
      });
    };
    window.addEventListener("show-programme-engagement", showEngagement);
    return () => {
      window.removeEventListener("show-programme-engagement", showEngagement);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Refresh must land on the hero, not mid-page (#videos from a prior video pick).
  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (nav?.type !== "reload") return;
    if (window.location.hash) {
      const url = new URL(window.location.href);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
    }
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <a href="#accueil" className="flex min-w-0 items-center gap-3">
            <Logo
              alt={`Logo ${t(identity.candidate)}`}
              className="h-9 w-9 shrink-0 rounded-sm sm:h-11 sm:w-11"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold text-navy sm:text-base">
                {t(identity.candidate)}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {t(identity.district)}
              </span>
            </span>
          </a>
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label={lang === "fr" ? "Navigation principale" : "التنقل الرئيسي"}
          >
            {copy.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-sm px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {t(item.label)}
              </a>
            ))}
            <button
              type="button"
              onClick={openChat}
              className="ml-2 inline-flex items-center gap-2 rounded-sm bg-navy px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-royal"
            >
              <MessageSquareText className="h-4 w-4" />
              {t(ui.nav.chat)}
            </button>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <img
              src={companyLogoMark}
              alt={t(ui.footerCompany)}
              className="h-9 w-auto max-w-[5.5rem] object-contain sm:h-10 sm:max-w-[6.5rem]"
            />
            <button
              type="button"
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              className="rounded-sm border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-secondary"
            >
              {lang === "fr" ? "العربية" : "FR"}
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav"
              aria-label={lang === "fr" ? "Menu" : "القائمة"}
              className="grid h-10 w-10 place-items-center rounded-sm border border-border text-navy transition-colors hover:bg-secondary lg:hidden"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <nav
            id="mobile-nav"
            className="border-t border-border bg-background px-4 py-3 lg:hidden"
            aria-label={lang === "fr" ? "Navigation mobile" : "التنقل للجوال"}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              <div className="mb-2 flex justify-center py-1">
                <img src={basmaLogo} alt="" aria-hidden className="h-12 w-12 object-contain opacity-80" />
              </div>
              {copy.nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-md px-3 py-3 text-sm font-bold text-navy transition-colors hover:bg-secondary"
                >
                  {t(item.label)}
                </a>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  openChat();
                }}
                className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-navy px-4 text-sm font-extrabold text-white"
              >
                <MessageSquareText className="h-4 w-4" />
                {t(ui.nav.chat)}
              </button>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section id="accueil" className="bg-white text-navy">
          <div className="relative isolate overflow-hidden border-b border-border bg-white">
            <img
              src={heroBackground}
              alt=""
              className="hero-bg absolute inset-0 -z-20 h-full w-full object-cover object-[center_28%] opacity-100"
            />
            <div className="hero-wash absolute inset-0 -z-10" />

            {/* —— Mobile accueil (mockup) —— */}
            <div className="hero-mobile relative z-10 mx-auto flex max-w-lg flex-col overflow-hidden px-4 pb-5 pt-4 lg:hidden">
              <BasmaMark
                tone="navy"
                size="lg"
                className="left-1/2 top-[42%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 opacity-[0.1] sm:h-52 sm:w-52"
              />
              <BasmaMark tone="teal" size="md" className="-end-8 top-16 rotate-[16deg] opacity-[0.12]" />
              <BasmaMark tone="navy" size="sm" className="-start-6 bottom-16 -rotate-12 opacity-[0.1]" />
              <p className="relative mx-auto inline-flex items-center gap-2 rounded-full bg-navy px-3.5 py-1.5 text-xs font-extrabold text-[#f0ebe3] shadow-card">
                <img src={basmaLogo} alt="" aria-hidden className="h-4 w-4 brightness-0 invert" />
                {t(copy.mobileBadge)}
              </p>

              <h1 className="mt-3 text-center text-[1.85rem] font-extrabold leading-[1.15] text-navy sm:text-3xl">
                {t(copy.heroLocalTitle)}
              </h1>

              <div className="hero-portrait relative mx-auto mt-3 w-full max-w-[420px]">
                <div className="hero-mobile-captions mb-1.5 flex items-end justify-around gap-2 px-1" dir="ltr">
                  <p className="hero-caption hero-caption--digital" dir={lang === "fr" ? "ltr" : "rtl"}>
                    {t(copy.captionDigitalShort)}
                  </p>
                  <p className="hero-caption hero-caption--candidate" dir={lang === "fr" ? "ltr" : "rtl"}>
                    {t(copy.captionCandidateShort)}
                  </p>
                </div>
                <div className="hero-duo relative mx-auto h-[min(46vh,340px)] w-full">
                  <img
                    src={candidatePortrait}
                    alt={t(copy.heroCandidateName)}
                    className="hero-candidate-img absolute inset-0 h-full w-full object-contain object-bottom"
                  />
                </div>
              </div>

              <a
                href={programmePdf}
                download="programme-electoral-2026.pdf"
                className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-morocco px-4 text-sm font-extrabold text-white shadow-card transition-colors hover:bg-morocco-dark"
              >
                <FileText className="h-4 w-4" />
                {t(copy.mobileCta)}
                <Download className="h-4 w-4" />
              </a>

              <div className="mt-3 flex min-h-12 overflow-hidden rounded-xl bg-navy shadow-elegant">
                <BasmaMark tone="white" size="sm" className="-start-3 top-1/2 h-16 w-16 -translate-y-1/2 opacity-[0.14]" />
                <button
                  type="button"
                  onClick={openChat}
                  aria-label={t(copy.mobileAskHint)}
                  className="relative z-[1] grid w-11 shrink-0 place-items-center text-white/90 transition-colors hover:bg-white/10"
                >
                  <Mic className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={openChat}
                  className="relative z-[1] min-w-0 flex-1 truncate px-2 text-start text-sm font-semibold text-white/70"
                >
                  {t(copy.mobileAskHint)}
                </button>
                <button
                  type="button"
                  onClick={openChat}
                  className="relative z-[1] inline-flex shrink-0 items-center gap-1.5 bg-morocco px-3 text-xs font-extrabold text-white transition-colors hover:bg-morocco-dark sm:px-4 sm:text-sm"
                >
                  <Send className={cn("h-4 w-4", dir === "rtl" && "-scale-x-100")} />
                  {t(copy.mobileAskBtn)}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {mobileTopics.map((topic) => (
                  <button
                    type="button"
                    key={topic.label.fr}
                    onClick={() => openChatWithQuestion(t(topic.label))}
                    className="inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border border-navy/10 bg-white/85 px-1 text-[0.7rem] font-bold text-navy shadow-card backdrop-blur transition-colors hover:border-morocco/40"
                  >
                    <topic.icon className="h-4 w-4 text-royal" />
                    {t(topic.label)}
                  </button>
                ))}
              </div>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[0.7rem] font-semibold text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-royal" />
                {t(copy.mobileTrust)}
              </p>
            </div>

            {/* —— Desktop accueil —— */}
            <div className="hero-shell mx-auto hidden max-w-[1520px] items-stretch gap-4 px-4 py-5 sm:gap-5 sm:px-6 lg:grid lg:min-h-[calc(100svh-4.75rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,1.25fr)_minmax(250px,0.68fr)] lg:gap-4 lg:px-6 lg:pb-0 lg:pt-5 xl:gap-6 xl:px-8">
              <Reveal className="hero-copy relative z-10 max-w-xl self-center lg:max-w-none">
                <p className="inline-flex items-center gap-3 rounded-md border border-navy/12 bg-white/86 px-3 py-2 text-xs font-extrabold uppercase text-navy shadow-card backdrop-blur">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-morocco text-white">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                  {t(copy.heroLocalBadge)}
                </p>
                <p className="mt-3 text-2xl font-extrabold leading-tight text-navy sm:text-3xl">
                  {t(copy.heroCandidateName)}
                </p>
                <h1 className="mt-2 max-w-[16ch] text-[2.35rem] leading-[1.05] text-navy sm:text-5xl lg:max-w-[14ch] lg:text-[2.85rem] xl:text-[3.15rem]">
                  {t(copy.heroLocalTitle)}
                </h1>
                <p className="mt-3 max-w-xl text-base leading-snug text-royal sm:text-lg">
                  {t(copy.heroLead)}
                </p>
                <div className="hero-features mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5">
                  {heroFeatures.map((item) => (
                    <div key={item.label.fr} className="text-center sm:text-start">
                      <item.icon className="mx-auto h-5 w-5 text-morocco sm:mx-0 sm:h-6 sm:w-6" />
                      <p className="mt-1.5 text-[0.68rem] font-semibold leading-snug text-navy sm:text-[0.72rem]">
                        {t(item.label)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
                  <a
                    href="#programme"
                    className="inline-flex w-full items-center justify-center gap-3 rounded-md bg-morocco px-5 py-2.5 text-sm font-extrabold text-white shadow-card transition-colors hover:bg-morocco-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-morocco sm:w-auto"
                  >
                    <FileText className="h-5 w-5" />
                    {t(copy.candidateCta)}
                    <ArrowRight className={cn("h-5 w-5", dir === "rtl" && "-scale-x-100")} />
                  </a>
                  <a
                    href={programmePdf}
                    download="programme-electoral-2026.pdf"
                    className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-navy/70 bg-white/76 px-5 py-2.5 text-sm font-extrabold text-navy shadow-card transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:w-auto"
                  >
                    <Download className="h-5 w-5" />
                    {t(copy.download)}
                  </a>
                </div>
              </Reveal>

              <Reveal className="hero-portrait relative z-10 flex min-h-[300px] items-end justify-center overflow-visible sm:min-h-[400px] lg:min-h-0 lg:self-stretch">
                <div className="hero-duo relative mx-auto flex h-full w-full max-w-[560px] flex-col justify-end sm:max-w-[640px] lg:max-w-[800px]">
                  <div className="hero-duo-stack flex w-full flex-col">
                    <div
                      className="hero-desktop-captions mb-1 flex shrink-0 items-end justify-around gap-3 px-[8%] sm:mb-1.5"
                      dir="ltr"
                    >
                      <p className="hero-caption hero-caption--digital" dir={lang === "fr" ? "ltr" : "rtl"}>
                        {t(copy.captionDigitalShort)}
                      </p>
                      <p className="hero-caption hero-caption--candidate" dir={lang === "fr" ? "ltr" : "rtl"}>
                        {t(copy.captionCandidateShort)}
                      </p>
                    </div>
                <img
                  src={candidatePortrait}
                  alt={t(copy.heroCandidateName)}
                      className="hero-candidate-img relative z-0 mx-auto h-auto max-h-[min(72vh,580px)] w-full object-contain object-bottom"
                />
            </div>
          </div>
              </Reveal>

              <Reveal className="assistant-hero-card relative z-10 flex w-full flex-col gap-3 self-center overflow-hidden rounded-2xl bg-navy/95 p-4 text-white shadow-elegant backdrop-blur-sm sm:gap-3.5 sm:p-5 lg:max-w-[21rem] lg:justify-self-center lg:self-center lg:rounded-2xl lg:pb-4">
                <BasmaMark tone="white" size="md" className="-end-6 -bottom-8 rotate-12" />
                <div className="flex items-start gap-3">
                <img
                  src={assistantPortrait}
                  alt={t(copy.assistantNote)}
                    className="h-12 w-12 shrink-0 rounded-full border border-white/30 object-cover object-top shadow-elegant sm:h-14 sm:w-14"
                />
                  <div className="min-w-0">
                    <h2 className="text-base font-extrabold leading-snug sm:text-lg">
                      {t(copy.assistantNote)}
                    </h2>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-white/75">
                      {t(copy.assistantLead)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={openChat}
                    className="flex min-h-10 w-full items-center gap-3 rounded-md bg-white px-3 text-start text-royal shadow-card transition-colors hover:bg-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <MessageSquareText className="h-4 w-4 shrink-0 text-navy" />
                    <span className="min-w-0 truncate text-xs sm:text-sm">
                      {t(copy.assistantPlaceholder)}
                    </span>
                    <Mic className="ms-auto h-4 w-4 shrink-0 text-navy" />
                  </button>

                  <div className="flex flex-wrap gap-2">
                    {assistantTopics.map((topic) => (
                      <button
                        type="button"
                        key={topic.label.fr}
                        onClick={() => openChatWithQuestion(t(topic.label))}
                        className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md border border-white/24 bg-white/5 px-2.5 text-xs font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <topic.icon className="h-3.5 w-3.5" />
                        {t(topic.label)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openChat}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-morocco px-4 text-sm font-extrabold text-white shadow-card transition-colors hover:bg-morocco-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <MessageSquareText className="h-4 w-4" />
                  {t(copy.ask)}
                </button>

                <div className="flex items-center justify-center border-t border-white/10 pt-2.5">
                  <Logo decorative className="h-9 w-auto opacity-90" />
                </div>
              </Reveal>
            </div>
          </div>
        </section>
        <CandidateVideos />
        <section id="engagements" className="relative overflow-hidden bg-white py-10 sm:py-20">
          <div className="absolute inset-x-0 top-0 h-px bg-navy/10" />
          <BasmaMark tone="navy" size="xl" className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          <BasmaMark tone="teal" size="md" className="-end-4 top-8 rotate-[18deg] sm:end-8" />
          <div className="relative mx-auto max-w-7xl px-4">
            <SectionHeading title={t(copy.proofTitle)} lead={t(copy.proofLead)} />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {dashboardMetrics.map((metric) => (
                  <Reveal key={t(metric.label)}>
                    <article className="group relative overflow-hidden rounded-md border border-border bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-morocco/40 hover:shadow-elegant">
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-md bg-navy text-white transition-colors group-hover:bg-morocco">
                          <metric.icon className="h-5 w-5" />
                        </span>
                        <span className="rounded-sm bg-ivory px-2 py-1 text-xs font-bold text-navy">
                          {t(metric.detail)}
                        </span>
                      </div>
                      <p className="mt-4 text-3xl font-extrabold text-navy" dir="ltr">
                        {metric.value}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">
                        {t(metric.label)}
                      </p>
                      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                        {t(copy.objective)} · {t(copy.sourceShort)}
                      </p>
                    </article>
                  </Reveal>
                ))}
              </div>

            <div className="mt-8 flex flex-wrap gap-2" aria-label={t(copy.axis)}>
              {[{ id: "all", title: bi("Tous les engagements", "جميع الالتزامات") }, ...axes].map(
                (axis) => (
                  <button
                    key={axis.id}
                    type="button"
                    aria-pressed={engagementFilter === axis.id}
                    onClick={() => setEngagementFilter(axis.id)}
                    className={cn(
                      "min-h-11 max-w-full border-b-2 px-3 py-2 text-start text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-morocco",
                      engagementFilter === axis.id
                        ? "border-morocco text-morocco"
                        : "border-transparent text-navy hover:border-navy/30",
                    )}
                  >
                    {t(axis.title)}
                  </button>
                ),
              )}
            </div>
            <p role="status" className="mt-3 text-xs text-muted-foreground">
              {visibleEngagements.length} {t(bi("engagements", "التزامات"))}
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleEngagements.map((engagement) => (
                <EngagementCard key={engagement.n} engagement={engagement} />
              ))}
            </div>
          </div>
        </section>
        <section id="programme" className="relative overflow-hidden bg-ivory py-10 sm:py-20">
          <div className="absolute inset-y-10 right-0 hidden w-1/3 rounded-l-full bg-white/70 blur-3xl lg:block" />
          <BasmaMark tone="teal" size="lg" className="-start-8 bottom-6 -rotate-12 sm:start-4" />
          <BasmaMark tone="navy" size="md" className="end-4 top-10 rotate-6 opacity-[0.06] sm:end-12" />
          <div className="relative mx-auto max-w-7xl px-4">
            <SectionHeading
              kicker={t(ui.nav.program)}
              title={t(ui.programTitle)}
              lead={t(ui.programLead)}
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="grid gap-3">
                {axes.map((axis) => {
                  const Icon = icons[axis.icon];
                  const selected = axis.id === activeAxisId;
                  return (
                    <button
                      key={axis.id}
                      type="button"
                      onClick={() => setActiveAxisId(axis.id)}
                      aria-pressed={selected}
                      className={cn(
                        "group flex items-center gap-4 rounded-md border p-4 text-start shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-morocco/40",
                        selected
                          ? "border-navy bg-navy text-white"
                          : "border-border bg-card text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-12 w-12 shrink-0 place-items-center rounded-md transition-colors",
                          selected
                            ? "bg-white text-navy"
                            : "bg-navy text-white group-hover:bg-morocco",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block text-xs font-extrabold uppercase",
                            selected ? "text-white/70" : "text-morocco",
                          )}
                        >
                          {t(copy.axis)} {axis.number}
                        </span>
                        <span className="mt-1 block text-sm font-extrabold leading-snug">
                          {t(axis.title)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <Reveal className="rounded-md border border-border bg-card p-5 shadow-elegant">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="section-kicker">
                      {t(copy.axis)} {activeAxis.number}
                    </p>
                    <h3 className="mt-2 text-2xl leading-tight text-navy sm:text-3xl">
                      {t(activeAxis.title)}
                    </h3>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                      {t(activeAxis.summary)}
                    </p>
                  </div>
                  <div className="grid h-24 w-24 shrink-0 place-items-center rounded-md bg-navy text-white shadow-card">
                    <ActiveAxisIcon className="h-9 w-9" />
                  </div>
                </div>
                <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(axisSubthemes[activeAxis.id] ?? []).map((theme) => (
                    <span
                      key={t(theme)}
                      className="rounded-md border border-border bg-ivory px-3 py-2 text-sm font-bold text-navy"
                    >
                      {t(theme)}
                    </span>
                  ))}
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {activeEngagements.slice(0, 4).map((engagement) => (
                    <button
                      key={engagement.n}
                      type="button"
                      onClick={() =>
                        openChatWithQuestion(avatarQuestionForEngagement(engagement, lang))
                      }
                      className="group rounded-md border border-border bg-white p-4 text-start transition-all hover:-translate-y-0.5 hover:border-morocco/50 hover:shadow-card"
                    >
                      <span className="text-xs font-extrabold uppercase text-morocco">
                        {t(copy.objective)} {engagement.n}
                      </span>
                      <span className="mt-1 block text-sm font-extrabold text-navy">
                        {t(engagement.title)}
                      </span>
                      <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
                        {t(engagement.indicator)}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-morocco">
                        <MessageSquareText className="h-3 w-3" />
                        {t(copy.askCardDetails)}
                      </span>
                    </button>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>
        <section className="relative overflow-hidden bg-white py-10 sm:py-20">
          <BasmaMark tone="navy" size="lg" className="end-0 top-1/2 -translate-y-1/2 translate-x-1/4" />
          <div className="relative mx-auto max-w-7xl px-4">
            <SectionHeading title={t(copy.compareTitle)} lead={t(identity.positioning)} />
            <div className="mt-8 grid gap-3">
              {programThemes.map((item, index) => (
                <Reveal key={item.theme.fr}>
                  <button
                    type="button"
                    onClick={openChat}
                    className="group grid w-full gap-4 rounded-md border border-border bg-card p-4 text-start shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-morocco/50 hover:shadow-elegant md:grid-cols-[72px_1fr_1.15fr_160px] md:items-center"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="grid h-11 w-11 place-items-center rounded-md bg-navy text-white transition-colors group-hover:bg-morocco">
                        <item.icon className="h-5 w-5" />
                      </span>
                    </span>
                    <span>
                      <span className="block text-base font-extrabold text-navy">
                        {t(item.theme)}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                        {t(copy.sourceShort)}
                      </span>
                    </span>
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      {t(item.proposition)}
                    </span>
                    <span>
                      <span className="mb-2 block text-sm font-extrabold text-navy">
                        {t(item.echeance)}
                      </span>
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        <section
          id="priorites"
          className="relative overflow-hidden bg-navy py-8 text-white sm:py-16 lg:py-20"
        >
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(90deg,white_1px,transparent_1px),linear-gradient(0deg,white_1px,transparent_1px)] [background-size:36px_36px]" />
          <BasmaMark tone="white" size="xl" className="-start-10 top-1/2 -translate-y-1/2 -rotate-12" />
          <BasmaMark tone="white" size="md" className="-end-6 bottom-4 rotate-[20deg] opacity-[0.08]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading title={t(copy.timeline)} lead={t(copy.proofLead)} inverted />
            <div className="timeline-line mt-6 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {firstHundredDays.map((item, index) => (
                <Reveal key={item.title.fr}>
                  <article className="group relative flex h-full gap-3 rounded-md border border-white/16 bg-white/8 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/12 sm:block sm:gap-0 sm:p-5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-morocco text-sm font-extrabold text-white shadow-card sm:h-10 sm:w-10">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.68rem] font-extrabold uppercase tracking-wide text-morocco-light sm:mt-5 sm:text-xs">
                        {lang === "fr" ? `Priorité ${index + 1}` : `أولوية ${index + 1}`}
                      </p>
                      <h3 className="mt-1 text-[0.95rem] leading-snug text-white sm:mt-2 sm:text-base">
                        {t(item.title)}
                      </h3>
                      <p className="mt-2 text-[0.8125rem] leading-relaxed text-white/72 sm:mt-3 sm:text-sm">
                        {t(item.detail)}
                      </p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        <section className="relative overflow-hidden bg-ivory py-10 sm:py-20">
          <BasmaMark tone="teal" size="lg" className="left-1/2 top-8 -translate-x-1/2 opacity-[0.09]" />
          <div className="relative mx-auto max-w-7xl px-4">
              <SectionHeading title={t(financing.title)} lead={t(financing.note)} />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {financing.items.map((item) => (
                  <Reveal key={item.share}>
                    <article className="group rounded-md border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-morocco/40">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-base text-navy">{t(item.label)}</h3>
                        <span className="grid h-11 w-11 place-items-center rounded-md bg-morocco/10 text-xl font-extrabold text-morocco">
                          {item.share}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {t(item.detail)}
                      </p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
        </section>

        <section id="apropos" className="relative scroll-mt-28 overflow-hidden bg-white py-10 sm:py-16">
          <BasmaMark tone="navy" size="lg" className="-end-8 top-10 opacity-[0.06]" />
          <div className="relative mx-auto max-w-3xl px-4">
            <SectionHeading kicker={t(ui.nav.about)} title={t(ui.aboutTitle)} />
            <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>{t(ui.aboutP1)}</p>
              <p>{t(ui.aboutP2)}</p>
              <p>{t(ui.aboutP3)}</p>
              <p>{t(ui.aboutP4)}</p>
              <div className="pt-1">
                <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-morocco">
                  {t(ui.aboutContact)}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <div className="flex min-w-0 flex-col gap-1.5" dir="ltr">
                    <a
                      href="mailto:ezziyyani@gmail.com"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-navy transition-colors hover:text-morocco"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0 text-morocco" />
                      <span className="truncate">ezziyyani@gmail.com</span>
                    </a>
                    <a
                      href="tel:+212661630301"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-navy transition-colors hover:text-morocco"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0 text-morocco" />
                      +212 661-630301
                    </a>
                  </div>
                  <figure className="flex items-center gap-2">
                    <img
                      src={linkedInQr}
                      alt={t(ui.aboutLinkedIn)}
                      className="h-11 w-11 rounded bg-white object-contain sm:h-12 sm:w-12"
                    />
                    <figcaption className="max-w-[5.5rem] text-[0.65rem] font-semibold leading-snug text-muted-foreground">
                      {t(ui.aboutLinkedIn)}
                    </figcaption>
                  </figure>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="relative overflow-hidden border-t border-white/10 bg-navy text-white">
        <BasmaMark
          tone="white"
          size="xl"
          className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
            <div className="space-y-4 text-center lg:text-start">
              <Logo decorative className="mx-auto h-16 w-auto sm:h-20 lg:mx-0" />
              <div>
                <p className="text-lg font-extrabold">{t(identity.candidate)}</p>
                <p className="mt-1 text-sm font-semibold text-white/75">{t(identity.party)}</p>
                <p className="mt-2 text-sm text-white/65">{t(identity.slogan)}</p>
              </div>
              <p className="text-xs font-bold text-morocco-light" dir="rtl">
                صوتوا على الشباب · صوتوا على رمز البصمة
              </p>
              <p className="text-sm font-extrabold text-morocco-light" dir="rtl">
                {"\u200F"}#عمل_جيم_للشباب
              </p>
            </div>

            <div className="text-center lg:text-start">
              <p className="text-xs font-extrabold uppercase tracking-wide text-white/50">
                {t(ui.footerNav)}
              </p>
              <nav className="mt-3 flex flex-col gap-1" aria-label={t(ui.footerNav)}>
                {copy.nav.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-2 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {t(item.label)}
                  </a>
                ))}
              </nav>
            </div>

            <div className="text-center lg:text-start">
              <p className="text-xs font-extrabold uppercase tracking-wide text-white/50">
                {t(ui.footerActions)}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <a
                  href={programmePdf}
                  download="programme-electoral-2026.pdf"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-morocco px-4 text-sm font-extrabold text-white transition-colors hover:bg-morocco-dark lg:justify-start"
                >
                  <Download className="h-4 w-4" />
                  {t(copy.download)}
                </a>
                  <button
                    type="button"
                    onClick={openChat}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/25 bg-white/5 px-4 text-sm font-extrabold text-white transition-colors hover:bg-white/10 lg:justify-start"
                  >
                  <MessageSquareText className="h-4 w-4" />
                  {t(ui.nav.chat)}
                  </button>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-white/55">{t(ui.footerLegal)}</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/12 pt-6 sm:flex-row">
            <div className="text-center text-xs text-white/55 sm:text-start">
              <p>{t(ui.footer)}</p>
              <p className="mt-1">{t(ui.footerRights)}</p>
            </div>
            <div className="flex flex-col items-center gap-2 sm:items-end">
              <img
                src={companyLogo}
                alt={`${t(ui.footerBuiltBy)} — ${t(ui.footerCompany)}`}
                className="h-24 w-auto object-contain sm:h-28"
              />
            </div>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
