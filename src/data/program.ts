/**
 * Contenu éditable du site et du programme électoral.
 * Pour mettre à jour le programme : modifier uniquement ce fichier.
 */

export type Lang = "fr" | "ar";
export type Bi = { fr: string; ar: string };

export const identity = {
  candidate: { fr: "Nom Prénom", ar: "الاسم الكامل" } as Bi,
  party: { fr: "Parti — Élections législatives 2026", ar: "الحزب — الانتخابات التشريعية 2026" } as Bi,
  slogan: {
    fr: "Produire la richesse, bâtir la souveraineté économique",
    ar: "إنتاج الثروة والسيادة الاقتصادية",
  } as Bi,
  pitch: {
    fr: "Une vision claire pour une économie productive, une administration digitale et des PME fortes, au service de tous les Marocains.",
    ar: "رؤية واضحة لاقتصاد منتج، وإدارة رقمية، ومقاولات صغرى ومتوسطة قوية، في خدمة جميع المغاربة.",
  } as Bi,
};

export type Axis = {
  id: string;
  icon: "factory" | "shield" | "monitor" | "store" | "scale";
  title: Bi;
  summary: Bi;
  points: Bi[];
  stat: { value: string; label: Bi };
};

export const axes: Axis[] = [
  {
    id: "richesse",
    icon: "factory",
    title: { fr: "Production de richesse", ar: "إنتاج الثروة" },
    summary: {
      fr: "Relancer la production nationale et créer des emplois durables dans les territoires.",
      ar: "إنعاش الإنتاج الوطني وخلق مناصب شغل مستدامة في مختلف الجهات.",
    },
    points: [
      { fr: "Soutien à l'industrie locale et aux filières exportatrices", ar: "دعم الصناعة المحلية وقطاعات التصدير" },
      { fr: "Incitations à l'investissement productif privé", ar: "تحفيزات للاستثمار الخاص المنتج" },
      { fr: "Valorisation des ressources et des chaînes de valeur nationales", ar: "تثمين الموارد وسلاسل القيمة الوطنية" },
      { fr: "Emploi des jeunes et formation aux métiers d'avenir", ar: "تشغيل الشباب والتكوين في مهن المستقبل" },
    ],
    stat: { value: "2030", label: { fr: "Horizon du plan productif", ar: "أفق المخطط الإنتاجي" } },
  },
  {
    id: "souverainete",
    icon: "shield",
    title: { fr: "Souveraineté économique", ar: "السيادة الاقتصادية" },
    summary: {
      fr: "Réduire les dépendances stratégiques et sécuriser les secteurs vitaux du pays.",
      ar: "تقليص التبعية الاستراتيجية وتأمين القطاعات الحيوية للبلاد.",
    },
    points: [
      { fr: "Sécurité alimentaire et hydrique", ar: "الأمن الغذائي والمائي" },
      { fr: "Souveraineté énergétique et industrielle", ar: "السيادة الطاقية والصناعية" },
      { fr: "Préférence nationale dans la commande publique", ar: "الأفضلية الوطنية في الطلبيات العمومية" },
      { fr: "Souveraineté des données et des infrastructures numériques", ar: "سيادة المعطيات والبنيات الرقمية" },
    ],
    stat: { value: "100%", label: { fr: "Données publiques hébergées au Maroc", ar: "معطيات عمومية مستضافة بالمغرب" } },
  },
  {
    id: "digital",
    icon: "monitor",
    title: { fr: "Administration digitale", ar: "رقمنة الإدارة العمومية" },
    summary: {
      fr: "Une administration simple, rapide et transparente, accessible depuis un téléphone.",
      ar: "إدارة بسيطة وسريعة وشفافة، في متناول المواطن عبر هاتفه.",
    },
    points: [
      { fr: "Dématérialisation totale des démarches courantes", ar: "الرقمنة الكاملة للمساطر اليومية" },
      { fr: "Guichet unique numérique pour citoyens et entreprises", ar: "شباك رقمي موحد للمواطنين والمقاولات" },
      { fr: "Délais de traitement publiés et opposables", ar: "آجال معالجة معلنة وملزمة" },
      { fr: "Interopérabilité entre administrations", ar: "التقائية وتبادل المعطيات بين الإدارات" },
    ],
    stat: { value: "30%", label: { fr: "Délais administratifs en moins", ar: "تقليص الآجال الإدارية" } },
  },
  {
    id: "pme",
    icon: "store",
    title: { fr: "PME et TPE", ar: "المقاولات الصغرى والمتوسطة" },
    summary: {
      fr: "Financer, digitaliser et protéger le tissu des petites entreprises.",
      ar: "تمويل ورقمنة وحماية نسيج المقاولات الصغيرة.",
    },
    points: [
      { fr: "Accès simplifié au financement et garanties publiques", ar: "تسهيل الولوج إلى التمويل والضمانات العمومية" },
      { fr: "Paiement des factures publiques dans des délais stricts", ar: "أداء فواتير الصفقات العمومية في آجال صارمة" },
      { fr: "Accompagnement à la digitalisation et à la facturation électronique", ar: "مواكبة الرقمنة والفوترة الإلكترونية" },
      { fr: "Fiscalité lisible et stable pour les TPE", ar: "جباية واضحة ومستقرة للمقاولات الصغيرة جدا" },
    ],
    stat: { value: "60j", label: { fr: "Délai maximal de paiement", ar: "أقصى أجل للأداء" } },
  },
  {
    id: "gouvernance",
    icon: "scale",
    title: { fr: "Gouvernance et économie informelle", ar: "الحكامة والاقتصاد غير المهيكل" },
    summary: {
      fr: "Intégrer progressivement l'informel et renforcer la vigilance numérique et l'intégrité publique.",
      ar: "الإدماج التدريجي للقطاع غير المهيكل وتعزيز اليقظة الرقمية ونزاهة المرفق العمومي.",
    },
    points: [
      { fr: "Statut simplifié et couverture sociale pour les activités informelles", ar: "نظام مبسط وتغطية اجتماعية للأنشطة غير المهيكلة" },
      { fr: "Transition progressive, sans sanction brutale", ar: "انتقال تدريجي دون عقوبات قاسية" },
      { fr: "Lutte contre la corruption et transparence des marchés publics", ar: "محاربة الفساد وشفافية الصفقات العمومية" },
      { fr: "Vigilance numérique et protection des citoyens en ligne", ar: "اليقظة الرقمية وحماية المواطنين رقميا" },
    ],
    stat: { value: "0", label: { fr: "Tolérance envers la corruption", ar: "تسامح مع الفساد" } },
  },
];

export const about: { title: Bi; body: Bi[] } = {
  title: { fr: "Qui sommes-nous", ar: "من نحن" },
  body: [
    {
      fr: "Nous sommes une équipe de citoyens, d'entrepreneurs et de cadres engagés, convaincus que le Maroc dispose de tout ce qu'il faut pour produire sa propre richesse.",
      ar: "نحن فريق من المواطنين والمقاولين والأطر الملتزمة، مقتنعون بأن المغرب يتوفر على كل المقومات لإنتاج ثروته الخاصة.",
    },
    {
      fr: "Notre méthode : des engagements chiffrés, un calendrier public, et une reddition des comptes régulière devant les citoyens.",
      ar: "منهجنا: التزامات مرقمة، وجدولة زمنية معلنة، وربط المسؤولية بالمحاسبة أمام المواطنين.",
    },
  ],
};

export const contact = {
  email: "contact@campagne2026.ma",
  phone: "+212 5 00 00 00 00",
  address: { fr: "Siège de campagne, Rabat, Maroc", ar: "المقر المركزي للحملة، الرباط، المغرب" } as Bi,
};

/** Programme complet injecté dans le prompt système de l'assistant. */
export const programContext = `
CANDIDAT : ${identity.candidate.fr} / ${identity.candidate.ar}
PARTI : ${identity.party.fr}
SLOGAN : ${identity.slogan.fr} — ${identity.slogan.ar}
VISION : ${identity.pitch.fr}

QUI SOMMES-NOUS : ${about.body.map((b) => b.fr).join(" ")}

AXES DU PROGRAMME ÉLECTORAL :
${axes
  .map(
    (a) => `- ${a.title.fr} (${a.title.ar}) : ${a.summary.fr}
  Mesures : ${a.points.map((p) => `${p.fr} / ${p.ar}`).join(" ; ")}
  Chiffre clé : ${a.stat.value} — ${a.stat.label.fr}`,
  )
  .join("\n")}

CONTACT : ${contact.email} — ${contact.phone} — ${contact.address.fr}
`.trim();
