import { axes, engagements, type Bi } from "./program";
import capsule1 from "@/assets/capsulesv2/1.mp4";
import capsule2 from "@/assets/capsulesv2/2.mp4";
import capsule3 from "@/assets/capsulesv2/3.mp4";
import capsule4 from "@/assets/capsulesv2/4.mp4";
import capsule5 from "@/assets/capsulesv2/5.mp4";
import capsule6 from "@/assets/capsulesv2/6.mp4";
import capsule7 from "@/assets/capsulesv2/7.mp4";
import capsule8 from "@/assets/capsulesv2/8.mp4";
import capsule9 from "@/assets/capsulesv2/9.mp4";
import capsule10 from "@/assets/capsulesv2/10.mp4";
import capsule11 from "@/assets/capsulesv2/11.mp4";
import capsule12 from "@/assets/capsulesv2/12.mp4";
import capsule13 from "@/assets/capsulesv2/13.mp4";
import capsule14 from "@/assets/capsulesv2/14.mp4";
import capsule15 from "@/assets/capsulesv2/15.mp4";
import capsule16 from "@/assets/capsulesv2/16.mp4";
import capsule17 from "@/assets/capsulesv2/17.mp4";
import capsule18 from "@/assets/capsulesv2/18.mp4";
import capsule19 from "@/assets/capsulesv2/19.mp4";
import capsule20 from "@/assets/capsulesv2/20.mp4";
import capsule21 from "@/assets/capsulesv2/21.mp4";
import capsule22 from "@/assets/capsulesv2/22.mp4";
import capsule23 from "@/assets/capsulesv2/23.mp4";
import capsule24 from "@/assets/capsulesv2/24.mp4";
import capsule25 from "@/assets/capsulesv2/25 v2.mp4";
import capsule26 from "@/assets/capsulesv2/26.mp4";
import capsule27 from "@/assets/capsulesv2/27.mp4";
import capsule28 from "@/assets/capsulesv2/28.mp4";
import capsule29 from "@/assets/capsulesv2/29.mp4";

export const videoThemes = [
  { id: "all", fr: "Tout", ar: "الكل" },
  { id: "programme", fr: "Plateforme electorale", ar: "الأرضية الانتخابية" },
  { id: "numerique", fr: "Numérique", ar: "الرقمنة" },
  { id: "emploi", fr: "Emploi", ar: "التشغيل" },
  { id: "economie", fr: "Économie", ar: "الاقتصاد" },
  { id: "eau", fr: "Eau & énergie", ar: "الماء والطاقة" },
  { id: "sante", fr: "Santé", ar: "الصحة" },
  { id: "services", fr: "Services publics", ar: "الخدمات العمومية" },
  { id: "culture", fr: "Culture & identité", ar: "الثقافة والهوية" },
] as const;
export type CandidateVideo = {
  id: string;
  theme: Exclude<(typeof videoThemes)[number]["id"], "all">;
  question: Bi;
  src?: string;
  poster?: string;
  duration?: string;
  test?: boolean;
  transcript?: Bi;
  captions?: { src: string; lang: string; label: string }[];
  durationSeconds?: number;
  publishedAt?: string;
  views?: number;
  requests?: number;
  summary?: Bi[];
  chapters?: { time: number; label: Bi }[];
  cues?: Partial<Record<VideoLanguage, VideoCue[]>>;
  express?: VideoRecording;
};

export type VideoLanguage = "fr" | "ar" | "darija";
export type VideoCue = { start: number; end: number; text: string };
export type VideoRecording = Pick<
  CandidateVideo,
  "src" | "poster" | "durationSeconds" | "captions" | "cues" | "chapters" | "summary"
>;

// Map each video index to the engagement number it relates to (0 = general / no specific engagement)
const questionEngagements = [
  0, 0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 0, 0, 5, 8, 8, 8, 8, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];
export function programmeForVideo(video: CandidateVideo) {
  const index = Number(video.id.replace("question-", "")) - 1;
  const engagement = engagements.find((item) => item.n === questionEngagements[index]);
  if (engagement)
    return {
      title: engagement.title,
      points: [engagement.promise, engagement.proposal, engagement.beneficiaries],
      href: `#engagement-${engagement.n}`,
    };
  const axis = index >= 14 && index <= 17 ? axes[1] : index >= 22 ? axes[2] : undefined;
  return {
    title: axis?.title ?? {
      fr: "Les trois axes de la plateforme electorale",
      ar: "المحاور الثلاثة للأرضية الانتخابية",
    },
    points: axis ? [axis.summary] : axes.map((item) => item.title),
    href: "#programme",
  };
}

const videoSources: (string | undefined)[] = [
  capsule1,
  capsule2,
  capsule3,
  capsule4,
  capsule5,
  capsule6,
  capsule7,
  capsule8,
  capsule9,
  capsule10,
  capsule11,
  capsule12,
  capsule13,
  capsule14,
  capsule15,
  capsule16,
  capsule17,
  capsule18,
  capsule19,
  capsule20,
  capsule21,
  capsule22,
  capsule23,
  capsule24,
  capsule25,
  capsule26,
  capsule27,
  capsule28,
  capsule29,
];

// 29 questions — FR translations + original AR (capsulesv2)
const questions: [CandidateVideo["theme"], string, string][] = [
  [
    "programme",
    "Qui est le Parti des Démocrates Nouveaux ?",
    "من هو حزب الديمقراطيين الجدد ؟",
  ],
  [
    "programme",
    "Le Parti des Démocrates Nouveaux a-t-il un programme électoral ?",
    "هل لحزب الديمقراطيين الجدد برنامج إنتخابي ؟",
  ],
  [
    "programme",
    "Sur quoi repose la plateforme électorale du Parti des Démocrates Nouveaux ?",
    "على ماذا ترتكز الأرضية الانتخابية لحزب الديمقراطيين الجدد ؟",
  ],
  [
    "programme",
    "Quel est le slogan du Parti des Démocrates Nouveaux ?",
    "ما هو شعار الحزب الديمقراطيين الجدد؟",
  ],
  [
    "programme",
    "Quelles sont les idées principales de la plateforme électorale ?",
    "ما هي الأفكار الأساسية للأرضية الانتخابية ؟",
  ],
  [
    "programme",
    "Quelles sont les constantes auxquelles croit le Parti des Démocrates Nouveaux ?",
    "ما هي الثوابت التي يؤمن بها حزب الديمقراطيين الجدد ؟",
  ],
  [
    "services",
    "Comment le parti envisage-t-il la réalisation de la justice sociale ?",
    "في نظر الحزب كيف يمكن تحقيق العدالة الاجتماعية ؟",
  ],
  [
    "economie",
    "Quelle est la vision du Parti des Démocrates Nouveaux pour les petites entreprises ?",
    "ما هي رؤية حزب الديمقراطيين الجدد للمقولات الصغرى ؟",
  ],
  [
    "numerique",
    "Comment en finir avec la bureaucratie (« sīr ḥttā tjī ») ?",
    "كيف يمكن القضاء على البيروقراطية أو ما يعرف بـ(سير حتى تجي) ؟",
  ],
  [
    "economie",
    "Comment le parti envisage-t-il de faire émerger les startups ?",
    "في نظر الحزب كيف يمكن النهوض بالشركات الناشئة",
  ],
  [
    "economie",
    "Comment développer l'investissement ?",
    "كيف يمكن تطوير الاستثمار ؟",
  ],
  [
    "services",
    "Quelle mesure le parti propose-t-il pour lutter contre la corruption ?",
    "ماهي الإجراء الذي يقترحه حزب الديموقراطيين الجدد من أجل محاربة الرشوة ؟",
  ],
  [
    "economie",
    "Quelle est la vision du parti pour l'avenir de l'économie informelle ?",
    "كيف يرى الحزب مستقبل أنشطة الاقتصادية الغير المهيكلة ؟",
  ],
  [
    "eau",
    "Quelle est la vision du parti en matière de sécurité hydrique et alimentaire ?",
    "ما هي رؤية الحزب في مجال الأمن المائي و الغذائي ؟",
  ],
  [
    "sante",
    "Quelle est la proposition du parti sur le dossier de la santé ?",
    "في حزب الديمقراطيين الجدد ما هو مقترحكم حول ملف الصحة ؟",
  ],
  [
    "sante",
    "Avez-vous des idées innovantes dans le domaine de la santé ?",
    "هل لديكم أفكار مبتكرة في مجال الصحة ؟",
  ],
  [
    "sante",
    "Comment le parti compte-t-il résoudre le problème de la santé en milieu rural ?",
    "كيف يمكنكم في حزب الديمقراطيين الجدد معالجة مشكل الصحة في العالم القروي ؟",
  ],
  [
    "sante",
    "Comment atteindre la justice territoriale dans le domaine de la santé ?",
    "كيف يمكن تحقيق العدالة المجالية في المجال الصحي ؟",
  ],
  [
    "services",
    "Quelles réformes le parti considère-t-il urgentes dans l'éducation et la formation ?",
    "ما هي الإصلاحات التي يراها حزب الديمقراطيين الجدد حاجة ملحة في مجال التعليم و التربية ؟",
  ],
  [
    "services",
    "Quelle est la mesure la plus importante que le parti juge nécessaire dans l'éducation ?",
    "ما هو أهم إجراء يراه الحزب ضروري في قطاع التعليم ؟",
  ],
  [
    "services",
    "Avez-vous un plan d'action sur la question des retraites ?",
    "هي لديكم خطة عمل في مسألة التقاعد ؟",
  ],
  [
    "programme",
    "Ne trouvez-vous pas que candidater avec un parti émergent est une aventure ?",
    "واش ما كتشوفشي أن ترشحك في حزب ناشئ يعتبر مغامرة ؟",
  ],
  [
    "emploi",
    "Que dites-vous aux jeunes qui constatent chaque jour l'absence de signes de réforme ?",
    "شنو عتقول للشباب لكيشوفوا كل نهار أنه ما كاينش بوادر الإصلاح ؟",
  ],
  [
    "emploi",
    "Que pensez-vous de la méfiance envers la jeunesse exprimée par certains ?",
    "شنو رأيك في عدم الثقة في الشباب التي يراها البعض ؟",
  ],
  [
    "services",
    "Avez-vous des idées dans le domaine du logement ?",
    "واش عندكم شي أفكار في مجال الإسكان؟",
  ],
  [
    "culture",
    "Quel conseil donneriez-vous aux citoyens ?",
    "شنو تقول للمواطنين كنصيحة ؟",
  ],
  [
    "programme",
    "Comment faire pour voter pour le Parti des Démocrates Nouveaux ?",
    "كفاش نعمل باش نصوت على حزب الديمقراطيين الجدد",
  ],
  [
    "programme",
    "Et si je vis à l'étranger ?",
    "و اذا كنت عايش في الخارج ؟",
  ],
  [
    "programme",
    "Quel est le symbole du Parti des Démocrates Nouveaux ?",
    "شنو هو رمز جزب الديموقراطيين الجدد ؟",
  ],
];

export const candidateVideos: CandidateVideo[] = questions.map(([theme, fr, ar], index) => ({
  id: `question-${String(index + 1).padStart(2, "0")}`,
  theme,
  question: { fr, ar },
  src: videoSources[index],
}));
