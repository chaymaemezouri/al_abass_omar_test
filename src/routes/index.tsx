import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Factory,
  Globe2,
  FileText,
  MessageSquareText,
  Mic,
  MonitorSmartphone,
  RadioTower,
  Newspaper,
  Scale,
  ShieldCheck,
  Store,
  Sparkles,
  Target,
  Users,
  WalletCards,
} from "lucide-react";

import heroBackground from "@/assets/AriierePlan.png";
import assistantPortrait from "@/assets/Avatar.png";
import candidatePortrait from "@/assets/condidat-cutout.png";
import campaignLogo from "@/assets/logo.png";
import { ChatWidget, openChat } from "@/components/ChatWidget";
import {
  axes,
  axisById,
  engagements,
  financing,
  firstHundredDays,
  identity,
  news,
  type Bi,
  type Engagement,
} from "@/data/program";
import { LangProvider, useLang, ui } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Al ABASS Omar - Programme électoral 2026 | L'appui en dialogue" },
      {
        name: "description",
        content:
          "Plateforme officielle pour comprendre, explorer et interroger le programme electoral national 2026 du Parti des Democrates Nouveaux.",
      },
      { property: "og:title", content: "L'appui en dialogue - Programme électoral 2026" },
      {
        property: "og:description",
        content:
          "Découvrez les engagements, le parcours du candidat et l'assistant IA officiel du programme.",
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
    { label: bi("Programme", "البرنامج"), href: "#programme" },
    { label: bi("Engagements", "الالتزامات"), href: "#engagements" },
  ],
  official: bi("Plateforme officielle du programme", "المنصة الرسمية للبرنامج"),
  elections: bi("Élections législatives 2026", "الانتخابات التشريعية 2026"),
  heroLead: bi(
    "Produire la richesse, repondre aux besoins essentiels et renforcer l unite nationale grace a des politiques publiques fondees sur l efficacite, la justice et la responsabilite.",
  ),
  consult: bi("Interroger l assistant IA", "اسأل المساعد الذكي"),
  ask: bi("Poser la question", "طرح السؤال"),
  download: bi("Télécharger le programme PDF", "تحميل البرنامج PDF"),
  proofTitle: bi("Objectifs chiffres du programme", "الأهداف الرقمية للبرنامج"),
  proofLead: bi(
    "Neuf objectifs nationaux, formules avec leurs echeances et leur source : plateforme electorale actualisee 2026.",
    "تسعة أهداف وطنية مع آجالها ومصدرها: المنصة الانتخابية المحينة 2026.",
  ),
  trustLine: bi(
    "Des réponses fiables, basées uniquement sur le programme politique validé.",
    "إجابات موثوقة مبنية فقط على البرنامج السياسي المعتمد.",
  ),
  heroLocalBadge: bi(
    "Elections legislatives 2026 — Parti des Democrates Nouveaux",
    "انتخابات 2026 — حزب الديمقراطيين الجدد",
  ),
  heroCandidateName: bi("Omar Al Abass", "عمر العباس"),
  heroLocalTitle: bi(
    "Pour un Maroc souverain, efficace et solidaire",
    "من أجل مغرب سيادي وفعال ومتضامن",
  ),
  candidateCta: bi("Decouvrir le programme", "اكتشاف البرنامج"),
  assistantNote: bi(
    "Assistant IA du programme electoral 2026",
    "المساعد الذكي للبرنامج الانتخابي 2026",
  ),
  assistantLead: bi(
    "Reponses basees uniquement sur le programme officiel du Parti des Democrates Nouveaux.",
    "إجابات مبنية فقط على البرنامج الرسمي لحزب الديمقراطيين الجدد.",
  ),
  assistantSublead: bi(
    "Posez vos questions en francais, en arabe ou en darija sur l emploi, la sante, l education, l eau, le numerique, la justice, la famille ou la souverainete nationale.",
    "اطرح أسئلتك بالعربية أو الفرنسية أو الدارجة حول التشغيل والصحة والتعليم والماء والرقمنة والعدالة والأسرة والسيادة الوطنية.",
  ),
  assistantPlaceholder: bi(
    "Posez votre question sur le programme officiel 2026...",
    "اطرح سؤالك حول البرنامج الرسمي 2026...",
  ),
  sources: bi("Sources du programme", "مصادر البرنامج"),
  timeline: bi("Priorites de la prochaine legislature", "أولويات الولاية التشريعية المقبلة"),
  candidateTitle: bi("Vision et valeurs", "الرؤية والقيم"),
  financingTitle: bi(
    "Une politique fondee sur l efficacite et la responsabilite",
    "سياسة قائمة على الفعالية والمسؤولية",
  ),
  fieldTitle: bi("Présence sur le terrain", "الحضور الميداني"),
  participationTitle: bi("Participation citoyenne", "مشاركة المواطنين"),
  participationLead: bi(
    "Cette section doit etre alimentee uniquement avec de vraies photos, dates et activites verifiables de la campagne.",
    "يجب ملء هذا القسم فقط بصور وتواريخ وأنشطة حقيقية قابلة للتحقق.",
  ),
  compareTitle: bi("Explorer le programme par theme", "استكشاف البرنامج حسب الموضوع"),
  currentProblem: bi("Constat", "المعطى"),
  proposal: bi("Proposition", "المقترح"),
  beneficiaries: bi("Bénéficiaires", "المستفيدون"),
  funding: bi("Source", "المصدر"),
  calendar: bi("Calendrier", "الجدولة"),
  indicator: bi("Indicateur", "المؤشر"),
  objective: bi("Objectif", "الهدف"),
  axis: bi("Axe", "المحور"),
  priority: bi("Priorite", "أولوية"),
  theme: bi("Theme", "الموضوع"),
  mainProposal: bi("Proposition principale", "المقترح الرئيسي"),
  deadline: bi("Echeance", "الأجل"),
  sourceShort: bi("Plateforme electorale actualisee 2026", "المنصة الانتخابية المحينة 2026"),
  askPrecision: bi("Demander une precision a l assistant", "اطلب توضيحا من المساعد"),
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
  { icon: BarChart3, label: "PME" },
  { icon: Target, label: "Eau" },
  { icon: ShieldCheck, label: "Santé" },
  { icon: FileText, label: "Éducation" },
  { icon: Users, label: "Identité" },
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
          "mt-2 text-2xl leading-tight sm:text-4xl",
          inverted ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            "mt-3 text-base leading-relaxed",
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
  const { t } = useLang();
  const axis = axisById(engagement.axis);

  return (
    <Reveal>
      <article className="h-full rounded-md border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-morocco">
              {t(copy.objective)} {engagement.n} {t(copy.axis)} {axis.number}
            </p>
            <h3 className="mt-2 text-lg leading-snug text-foreground">{t(engagement.title)}</h3>
          </div>
          {engagement.first100 && (
            <span className="rounded-sm bg-morocco/10 px-2 py-1 text-xs font-bold text-morocco">
              {t(copy.priority)}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t(engagement.promise)}
        </p>
        <div className="mt-5 space-y-3">
          <DetailRow icon={Target} label={t(copy.objective)} value={t(engagement.indicator)} />
          <DetailRow icon={CalendarDays} label={t(copy.calendar)} value={engagement.calendar} />
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
          <span className="text-2xl font-extrabold text-morocco">{axis.stat.value}</span>
          <span className="text-xs text-muted-foreground">{t(axis.stat.label)}</span>
        </div>
      </article>
    </Reveal>
  );
}

function Page() {
  const { t, lang, setLang, dir } = useLang();
  const featuredEngagements = engagements.filter((item) => item.first100);
  const [activeAxisId, setActiveAxisId] = useState(axes[0].id);
  const activeAxis = axisById(activeAxisId);
  const ActiveAxisIcon = icons[activeAxis.icon];
  const activeEngagements = useMemo(
    () => engagements.filter((item) => item.axis === activeAxisId),
    [activeAxisId],
  );

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <a href="#accueil" className="flex min-w-0 items-center gap-3">
            <img
              src={campaignLogo}
              alt={`Logo ${t(identity.candidate)}`}
              className="h-9 w-9 shrink-0 rounded-sm object-contain sm:h-11 sm:w-11"
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
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
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
            <button
              type="button"
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              className="rounded-sm border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-secondary"
            >
              {lang === "fr" ? "العربية" : "FR"}
            </button>
            <button
              type="button"
              onClick={openChat}
              aria-label={t(ui.openChat)}
              className="grid h-10 w-10 place-items-center rounded-sm bg-morocco text-white lg:hidden"
            >
              <MessageSquareText className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section id="accueil" className="bg-white text-navy">
          <div className="relative isolate overflow-hidden border-b border-border bg-white">
            <img
              src={heroBackground}
              alt=""
              className="absolute inset-0 -z-20 h-full w-full object-cover opacity-95"
            />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.9)_43%,rgba(255,255,255,0.38)_72%,rgba(255,255,255,0.2)_100%)]" />
            <div className="absolute right-0 top-0 -z-10 hidden h-full w-1/3 bg-[radial-gradient(circle_at_70%_20%,rgba(9,28,57,0.08),transparent_42%)] lg:block" />
            <div className="hero-shell mx-auto grid max-w-[1440px] items-center gap-4 px-4 py-4 sm:gap-5 sm:px-6 lg:min-h-[500px] lg:grid-cols-[minmax(0,0.98fr)_minmax(420px,0.82fr)] lg:px-8 lg:py-0">
              <Reveal className="relative z-10 max-w-3xl">
                <p className="inline-flex items-center gap-3 rounded-md border border-navy/12 bg-white/86 px-3 py-2 text-xs font-extrabold uppercase text-navy shadow-card backdrop-blur">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-morocco text-white">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                  {t(copy.heroLocalBadge)}
                </p>
                <p className="mt-3 text-2xl font-extrabold leading-tight text-navy sm:text-3xl">
                  {t(copy.heroCandidateName)}
                </p>
                <h1 className="mt-2 max-w-4xl text-4xl leading-[0.96] text-navy sm:text-5xl lg:text-[3.15rem]">
                  {t(copy.heroLocalTitle)}
                </h1>
                <p className="mt-3 max-w-2xl text-lg leading-snug text-royal sm:text-xl">
                  {t(copy.heroLead)}
                </p>
                <div className="hero-features mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {heroFeatures.map((item) => (
                    <div key={item.label.fr} className="text-center sm:text-start">
                      <item.icon className="mx-auto h-6 w-6 text-[#b57905] sm:mx-0" />
                      <p className="mt-1.5 text-[0.72rem] font-semibold leading-snug text-navy">
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
                  <button
                    type="button"
                    onClick={openChat}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-navy/70 bg-white/76 px-5 py-2.5 text-sm font-extrabold text-navy shadow-card transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:w-auto"
                  >
                    <MessageSquareText className="h-5 w-5" />
                    {t(copy.consult)}
                    <ArrowRight className={cn("h-5 w-5", dir === "rtl" && "-scale-x-100")} />
                  </button>
                </div>
              </Reveal>
              <Reveal className="hero-portrait relative z-10 min-h-[300px] overflow-hidden sm:min-h-[420px] lg:min-h-[500px]">
                <div className="absolute bottom-0 right-0 h-16 w-[80%] rounded-[100%] bg-navy/16 blur-2xl" />
                <img
                  src={candidatePortrait}
                  alt={t(copy.heroCandidateName)}
                  className="hero-candidate-img absolute -bottom-4 left-1/2 h-[340px] w-full max-w-[390px] -translate-x-1/2 object-contain object-bottom drop-shadow-[0_28px_58px_rgba(9,28,57,0.22)] sm:h-[440px] sm:max-w-[480px] lg:-bottom-8 lg:left-auto lg:right-2 lg:h-[535px] lg:max-w-[585px] lg:translate-x-0"
                />
              </Reveal>
            </div>
          </div>

          <div className="relative z-20 bg-navy text-white">
            <div className="assistant-home-panel relative mx-auto grid max-w-[1440px] items-center gap-3 px-4 py-4 sm:px-6 md:grid-cols-[140px_minmax(0,1fr)] lg:px-8">
              <div className="hidden absolute inset-y-0 right-0 w-64 opacity-[0.06] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:18px_18px] lg:block" />
              <Reveal className="flex justify-center md:border-r md:border-white/24">
                <img
                  src={assistantPortrait}
                  alt={t(copy.assistantNote)}
                  className="h-16 w-16 rounded-full border border-white/30 object-cover shadow-elegant sm:h-24 sm:w-24"
                />
              </Reveal>
              <Reveal className="relative z-10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-2xl leading-tight text-white sm:text-[1.65rem]">
                      {t(copy.assistantNote)}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-white/78 sm:text-base">
                      {t(copy.assistantLead)}
                    </p>
                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/62">
                      {t(copy.assistantSublead)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openChat}
                    className="inline-flex min-h-12 items-center justify-center rounded-md bg-morocco px-6 text-sm font-extrabold text-white shadow-card transition-colors hover:bg-morocco-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {t(copy.ask)}
                  </button>
                </div>
                <div className="mt-2 grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto]">
                  <button
                    type="button"
                    onClick={openChat}
                    className="flex min-h-11 w-full items-center gap-3 rounded-md bg-white px-4 text-start text-royal shadow-card transition-colors hover:bg-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <MessageSquareText className="h-5 w-5 shrink-0 text-navy" />
                    <span className="min-w-0 truncate text-sm sm:text-base">
                      {t(copy.assistantPlaceholder)}
                    </span>
                    <Mic className="ms-auto h-5 w-5 shrink-0 text-navy" />
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {assistantTopics.map((topic) => (
                      <button
                        type="button"
                        key={topic.label}
                        onClick={openChat}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/24 bg-white/5 px-4 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <topic.icon className="h-4 w-4" />
                        {topic.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
        <section id="engagements" className="relative overflow-hidden bg-white py-10 sm:py-20">
          <div className="absolute inset-x-0 top-0 h-px bg-navy/10" />
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <SectionHeading title={t(copy.proofTitle)} lead={t(copy.proofLead)} />
              <div className="grid gap-3 sm:grid-cols-2">
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
                      <p className="mt-4 text-3xl font-extrabold text-navy">{metric.value}</p>
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">
                        {t(metric.label)}
                      </p>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-morocco transition-[width] duration-1000 ease-out"
                          style={{ width: `${metric.progress}%` }}
                        />
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {engagements.map((engagement) => (
                <EngagementCard key={engagement.n} engagement={engagement} />
              ))}
            </div>
          </div>
        </section>
        <section id="programme" className="relative overflow-hidden bg-ivory py-10 sm:py-20">
          <div className="absolute inset-y-10 right-0 hidden w-1/3 rounded-l-full bg-white/70 blur-3xl lg:block" />
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
                      onClick={openChat}
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
                    </button>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>
        <section className="bg-white py-10 sm:py-20">
          <div className="mx-auto max-w-7xl px-4">
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
                      <span className="block h-1.5 overflow-hidden rounded-full bg-secondary">
                        <span
                          className={cn("block h-full rounded-full", item.accent)}
                          style={{ width: `${item.progress}%` }}
                        />
                      </span>
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        <section className="relative overflow-hidden bg-navy py-10 text-white sm:py-20">
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(90deg,white_1px,transparent_1px),linear-gradient(0deg,white_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="relative mx-auto max-w-7xl px-4">
            <SectionHeading title={t(copy.timeline)} lead={t(copy.proofLead)} inverted />
            <div className="timeline-line mt-10 grid gap-4 md:grid-cols-5">
              {firstHundredDays.map((item, index) => (
                <Reveal key={item.day}>
                  <article className="group relative h-full rounded-md border border-white/16 bg-white/8 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/12">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-morocco text-sm font-extrabold text-white shadow-card">
                      {index + 1}
                    </span>
                    <p className="mt-5 text-xs font-extrabold uppercase text-morocco-light">
                      {item.day}
                    </p>
                    <h3 className="mt-2 text-base leading-snug text-white">{t(item.title)}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/72">{t(item.detail)}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-ivory py-10 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <SectionHeading title={t(financing.title)} lead={t(financing.note)} />
              <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
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
            <div>
              <SectionHeading title={t(copy.fieldTitle)} lead={t(copy.participationLead)} />
              <div className="mt-8 grid gap-4">
                {news.map((item) => (
                  <Reveal key={`${item.date}-${item.title.fr}`}>
                    <article className="group flex gap-4 rounded-md border border-dashed border-navy/25 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-morocco/50">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-navy text-white transition-colors group-hover:bg-morocco">
                        <Newspaper className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="text-xs font-extrabold uppercase text-morocco">
                          {item.date} · {t(item.place)}
                        </span>
                        <span className="mt-2 block text-sm font-semibold leading-relaxed text-navy">
                          {t(item.title)}
                        </span>
                      </span>
                    </article>
                  </Reveal>
                ))}
                <Reveal>
                  <button
                    type="button"
                    onClick={openChat}
                    className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-navy px-5 text-sm font-extrabold text-white shadow-card transition-colors hover:bg-morocco focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                  >
                    <MessageSquareText className="h-5 w-5" />
                    {t(copy.askPrecision)}
                  </button>
                </Reveal>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-navy py-8 text-center text-sm text-white">
        <p className="font-extrabold">{t(identity.slogan)}</p>
        <p className="mt-1 text-white/68">{t(ui.footer)}</p>
      </footer>

      <ChatWidget />
    </div>
  );
}
