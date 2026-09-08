import { axes, engagements, financing, type Bi } from "./program";
import capsule1 from "@/assets/capsules/1.mp4";
import capsule2 from "@/assets/capsules/2.mp4";
import capsule3 from "@/assets/capsules/3.mp4";
import capsule4 from "@/assets/capsules/4.mp4";
import capsule5 from "@/assets/capsules/5.mp4";
import capsule6 from "@/assets/capsules/6.mp4";
import capsule7 from "@/assets/capsules/7.mp4";
import capsule8 from "@/assets/capsules/8.mp4";
import capsule9 from "@/assets/capsules/9.mp4";
import capsule10 from "@/assets/capsules/10.mp4";
import capsule11 from "@/assets/capsules/11.mp4";
import capsule12 from "@/assets/capsules/12.mp4";
import capsule13 from "@/assets/capsules/13.mp4";
import capsule14 from "@/assets/capsules/14.mp4";
import capsule15 from "@/assets/capsules/15.mp4";
import capsule16 from "@/assets/capsules/16.mp4";
import capsule17 from "@/assets/capsules/17.mp4";
import capsule18 from "@/assets/capsules/18.mp4";
import capsule19 from "@/assets/capsules/19.mp4";
import capsule20 from "@/assets/capsules/20.mp4";
import capsule21 from "@/assets/capsules/21.mp4";
import capsule22 from "@/assets/capsules/22.mp4";
import capsule23 from "@/assets/capsules/23.mp4";
import capsule24 from "@/assets/capsules/24.mp4";
import capsule25 from "@/assets/capsules/25.mp4";
import capsule26 from "@/assets/capsules/26.mp4";
import capsule27 from "@/assets/capsules/27.mp4";
import capsule28 from "@/assets/capsules/28.mp4";
import capsule29 from "@/assets/capsules/29.mp4";

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
  0, 0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 0, 0, 5, 8, 8, 8, 8, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
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
  // Fallback for general / unmapped questions
  const axis = index >= 14 && index <= 17 ? axes[1] : index >= 22 ? axes[2] : undefined;
  return {
    title: axis?.title ?? { fr: "Les trois axes de la plateforme electorale", ar: "المحاور الثلاثة للأرضية الانتخابية" },
    points: axis ? [axis.summary] : axes.map((item) => item.title),
    href: "#programme",
  };
}

// Video sources mapped by index
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

// The 29 questions provided by the user — FR translations + original AR
const questions: [CandidateVideo["theme"], string, string][] = [
  [
    "programme",
    "Qui est le Parti des Démocrates Nouveaux ? Le parti a-t-il une plateforme électorale ?",
    "من هو حزب الديمقراطيين الجدد ؟ هل لدي الحزب أرضية انتخابية ؟",
  ],
  [
    "programme",
    "Le Parti des Démocrates Nouveaux a-t-il une plateforme électorale ?",
    "هل لحزب الديمقراطيين الجدد أرضية انتخابية ؟",
  ],
  [
    "programme",
    "Capsule vidéo n°3",
    "كبسولة فيديو رقم 3",
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
    "programme",
    "Capsule vidéo n°10",
    "كبسولة فيديو رقم 10",
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
    "Quelles réformes le parti considère-t-il comme une urgence ?",
    "ما هي الإصلاحات التي يراها حزب الديمقراطيين الجدد حاجة ملحة ؟",
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
    "Capsule vidéo n°22",
    "كبسولة فيديو رقم 22",
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
    "programme",
    "Capsule vidéo n°25",
    "كبسولة فيديو رقم 25",
  ],
  [
    "programme",
    "Capsule vidéo n°26",
    "كبسولة فيديو رقم 26",
  ],
  [
    "culture",
    "Quel conseil donneriez-vous aux citoyens ?",
    "شنو تقول للمواطنين كنصيحة ؟",
  ],
  [
    "programme",
    "Capsule vidéo n°28",
    "كبسولة فيديو رقم 28",
  ],
  [
    "programme",
    "Capsule vidéo n°29",
    "كبسولة فيديو رقم 29",
  ],
];

export const candidateVideos: CandidateVideo[] = questions.map(([theme, fr, ar], index) => ({
  id: `question-${String(index + 1).padStart(2, "0")}`,
  theme,
  question: { fr, ar },
  src: videoSources[index],
}));
