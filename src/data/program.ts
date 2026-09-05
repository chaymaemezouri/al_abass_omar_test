/**
 * Contenu editable du site et du programme electoral.
 * Source de reference : plateforme electorale actualisee 2026.
 */

export type Lang = "fr" | "ar" | "darija";
export type Bi = { fr: string; ar: string };

const bi = (fr: string, ar: string): Bi => ({ fr, ar });

export const identity = {
  candidate: bi("Al ABASS Omar", "عمر العباس"),
  party: bi("Parti des Democrates Nouveaux", "حزب الديمقراطيين الجدد"),
  district: bi("Programme electoral 2026", "البرنامج الانتخابي 2026"),
  slogan: bi("Un Maroc souverain, numerique et solidaire", "مغرب سيادي، رقمي ومتضامن"),
  positioning: bi(
    "Peu d'ideologie, beaucoup d'efficacite et de performance.",
    "قليل من الإيديولوجيا، وكثير من الفعالية والإنجاز.",
  ),
  pitch: bi(
    "Produire la richesse, repondre aux besoins essentiels et renforcer l'unite nationale grace a des politiques publiques fondees sur l'efficacite, la justice et la responsabilite.",
    "إنتاج الثروة، الاستجابة للحاجيات الأساسية، وتعزيز الوحدة الوطنية عبر سياسات عمومية مبنية على الفعالية والعدالة والمسؤولية.",
  ),
};

export type AxisId = "richesse" | "besoins" | "identite";

export type Axis = {
  id: AxisId;
  number: number;
  icon: "factory" | "shield" | "monitor" | "store" | "scale";
  title: Bi;
  summary: Bi;
  stat: { value: string; label: Bi };
};

export const axes: Axis[] = [
  {
    id: "richesse",
    number: 1,
    icon: "factory",
    title: bi(
      "Produire la richesse et renforcer la souverainete economique",
      "إنتاج الثروة وتعزيز السيادة الاقتصادية",
    ),
    summary: bi(
      "Construire une economie productive, numerique et durable, capable de soutenir les entreprises marocaines et de proteger les ressources strategiques du pays.",
      "بناء اقتصاد منتج ورقمي ومستدام، قادر على دعم المقاولات المغربية وحماية الموارد الاستراتيجية للبلاد.",
    ),
    stat: {
      value: "100 MMDH",
      label: bi("generes par la transformation numerique", "من التحول الرقمي"),
    },
  },
  {
    id: "besoins",
    number: 2,
    icon: "shield",
    title: bi("Repondre aux besoins essentiels", "الاستجابة للحاجيات الأساسية"),
    summary: bi(
      "Garantir a chaque citoyenne et citoyen un acces equitable a la sante, a l'education, a la protection sociale, a l'emploi et a une justice efficace.",
      "ضمان ولوج منصف لكل مواطنة ومواطن إلى الصحة والتعليم والحماية الاجتماعية والتشغيل وعدالة فعالة.",
    ),
    stat: {
      value: "100 000",
      label: bi("jeunes formes au numerique chaque annee", "شاب يتكونون رقمياً كل سنة"),
    },
  },
  {
    id: "identite",
    number: 3,
    icon: "scale",
    title: bi(
      "Enrichir l'identite et renforcer l'unite nationale",
      "إغناء الهوية وتعزيز الوحدة الوطنية",
    ),
    summary: bi(
      "Consolider les fondements du Royaume, valoriser son identite plurielle et renforcer la cohesion familiale, culturelle et territoriale.",
      "ترسيخ أسس المملكة، تثمين هويتها المتعددة، وتعزيز التماسك الأسري والثقافي والترابي.",
    ),
    stat: {
      value: "2030",
      label: bi("horizon des objectifs structurants", "أفق الأهداف المهيكلة"),
    },
  },
];

export type Engagement = {
  n: number;
  axis: AxisId;
  title: Bi;
  promise: Bi;
  problem: Bi;
  proposal: Bi;
  beneficiaries: Bi;
  funding: Bi;
  calendar: string;
  indicator: Bi;
  first100?: boolean;
};

const source = bi(
  "Source : plateforme electorale actualisee 2026.",
  "المصدر: المنصة الانتخابية المحينة 2026.",
);

export const engagements: Engagement[] = [
  {
    n: 1,
    axis: "richesse",
    title: bi("Transformation numerique", "التحول الرقمي"),
    promise: bi(
      "Placer le Maroc parmi les 50 premiers pays au monde en administration electronique d'ici 2030.",
      "جعل المغرب ضمن أفضل 50 دولة عالمياً في الإدارة الإلكترونية في أفق 2030.",
    ),
    problem: bi(
      "Les demarches publiques restent fragmentees, lentes et insuffisamment interconnectees.",
      "ما تزال المساطر العمومية متفرقة وبطيئة وضعيفة الترابط.",
    ),
    proposal: bi(
      "Interconnecter les administrations, dematerialiser les demarches et reviser la loi 55.19.",
      "ربط الإدارات فيما بينها، رقمنة المساطر، ومراجعة القانون 55.19.",
    ),
    beneficiaries: bi(
      "Citoyens, entreprises, administrations et usagers des services publics.",
      "المواطنون والمقاولات والإدارات ومرتفقو الخدمات العمومية.",
    ),
    funding: source,
    calendar: "2030",
    indicator: bi(
      "Maroc dans le Top 50 mondial de l'administration electronique.",
      "المغرب ضمن أفضل 50 عالمياً في الإدارة الإلكترونية.",
    ),
    first100: true,
  },
  {
    n: 2,
    axis: "richesse",
    title: bi("Competences numeriques", "الكفاءات الرقمية"),
    promise: bi(
      "Former 100 000 jeunes chaque annee aux competences numeriques a l'horizon 2030.",
      "تكوين 100 ألف شاب سنوياً في المهارات الرقمية في أفق 2030.",
    ),
    problem: bi(
      "Le marche du travail manque de profils formes au numerique et a l'intelligence artificielle.",
      "سوق الشغل يحتاج إلى كفاءات مؤهلة في الرقمنة والذكاء الاصطناعي.",
    ),
    proposal: bi(
      "Developper des partenariats universites-entreprises, former a l'IA et soutenir les talents marocains.",
      "تطوير شراكات بين الجامعات والمقاولات، التكوين في الذكاء الاصطناعي، ودعم المواهب المغربية.",
    ),
    beneficiaries: bi(
      "Jeunes, etudiants, entreprises technologiques et ecosysteme d'innovation.",
      "الشباب والطلبة والمقاولات التكنولوجية ومنظومة الابتكار.",
    ),
    funding: source,
    calendar: "2030",
    indicator: bi(
      "100 000 jeunes formes au numerique chaque annee.",
      "100 ألف شاب يتكونون رقمياً كل سنة.",
    ),
    first100: true,
  },
  {
    n: 3,
    axis: "richesse",
    title: bi("PME et marches publics", "المقاولات الصغرى والمتوسطة والصفقات العمومية"),
    promise: bi(
      "Garantir aux PME leur part legale de 20 % des commandes publiques.",
      "ضمان حصة قانونية قدرها 20% للمقاولات الصغرى والمتوسطة من الطلبيات العمومية.",
    ),
    problem: bi(
      "Les petites et moyennes entreprises n'accedent pas suffisamment aux marches publics.",
      "المقاولات الصغرى والمتوسطة لا تستفيد بما يكفي من الصفقات العمومية.",
    ),
    proposal: bi(
      "Adopter les textes d'application, creer une loi pour les petites entreprises et simplifier les procedures fiscales et financieres.",
      "اعتماد النصوص التطبيقية، إحداث قانون خاص بالمقاولات الصغيرة، وتبسيط المساطر الجبائية والمالية.",
    ),
    beneficiaries: bi(
      "PME, tres petites entreprises, entrepreneurs et emplois locaux.",
      "المقاولات الصغرى والمتوسطة والمقاولون وفرص الشغل المحلية.",
    ),
    funding: source,
    calendar: "Prochaine legislature",
    indicator: bi(
      "20 % des commandes publiques effectivement reservees aux PME.",
      "تخصيص 20% فعلياً من الطلبيات العمومية للمقاولات الصغرى والمتوسطة.",
    ),
    first100: true,
  },
  {
    n: 4,
    axis: "richesse",
    title: bi("Couverture 5G", "تغطية الجيل الخامس"),
    promise: bi(
      "Couvrir 70 % de la population par la 5G avant 2030.",
      "تغطية 70% من السكان بشبكة الجيل الخامس قبل 2030.",
    ),
    problem: bi(
      "L'acces aux infrastructures numeriques avancees reste inegal selon les territoires.",
      "الولوج إلى البنيات الرقمية المتقدمة ما يزال غير متكافئ بين المجالات.",
    ),
    proposal: bi(
      "Partager les infrastructures, prioriser les zones industrielles et technologiques et reduire la dependance envers un fournisseur unique.",
      "تقاسم البنيات التحتية، إعطاء الأولوية للمناطق الصناعية والتكنولوجية، وتقليص الاعتماد على مزود واحد.",
    ),
    beneficiaries: bi(
      "Citoyens, entreprises, territoires industriels et services numeriques.",
      "المواطنون والمقاولات والمناطق الصناعية والخدمات الرقمية.",
    ),
    funding: source,
    calendar: "Avant 2030",
    indicator: bi(
      "70 % de la population couverte par la 5G.",
      "70% من السكان مشمولون بتغطية الجيل الخامس.",
    ),
  },
  {
    n: 5,
    axis: "richesse",
    title: bi("Securite hydrique", "الأمن المائي"),
    promise: bi(
      "Couvrir 60 % des besoins en eau grace au dessalement d'ici 2030.",
      "تغطية 60% من الحاجيات المائية عبر تحلية مياه البحر في أفق 2030.",
    ),
    problem: bi(
      "Le stress hydrique menace les citoyens, l'agriculture et l'industrie.",
      "الإجهاد المائي يهدد المواطنين والفلاحة والصناعة.",
    ),
    proposal: bi(
      "Alimenter les stations par energie renouvelable, fabriquer localement les equipements et soutenir l'innovation dans les technologies de l'eau.",
      "تشغيل المحطات بالطاقة المتجددة، تصنيع التجهيزات محلياً، ودعم الابتكار في تقنيات الماء.",
    ),
    beneficiaries: bi(
      "Menages, agriculteurs, industries et territoires touches par le stress hydrique.",
      "الأسر والفلاحون والصناعات والمجالات المتضررة من الإجهاد المائي.",
    ),
    funding: source,
    calendar: "2030",
    indicator: bi(
      "60 % des besoins en eau couverts par le dessalement.",
      "60% من الحاجيات المائية مغطاة عبر التحلية.",
    ),
    first100: true,
  },
  {
    n: 6,
    axis: "richesse",
    title: bi("Reutilisation des eaux usees", "إعادة استعمال المياه العادمة"),
    promise: bi(
      "Mobiliser 100 millions de metres cubes d'eaux usees traitees par an d'ici 2027.",
      "تعبئة 100 مليون متر مكعب سنوياً من المياه العادمة المعالجة في أفق 2027.",
    ),
    problem: bi(
      "Une partie des ressources en eau pourrait etre economisee par une meilleure reutilisation.",
      "يمكن اقتصاد جزء مهم من الموارد المائية عبر إعادة الاستعمال.",
    ),
    proposal: bi(
      "Utiliser les eaux traitees pour les espaces verts, les usages industriels et la protection des ressources potables.",
      "استعمال المياه المعالجة في المساحات الخضراء والاستعمال الصناعي وحماية موارد الماء الشروب.",
    ),
    beneficiaries: bi(
      "Collectivites, industries, espaces verts et usagers de l'eau potable.",
      "الجماعات والصناعات والمساحات الخضراء ومستعملو الماء الصالح للشرب.",
    ),
    funding: source,
    calendar: "2027",
    indicator: bi(
      "100 millions de m3 d'eaux usees traitees mobilises par an.",
      "100 مليون متر مكعب من المياه المعالجة سنوياً.",
    ),
  },
  {
    n: 7,
    axis: "richesse",
    title: bi("Ammoniac vert", "الأمونياك الأخضر"),
    promise: bi(
      "Produire 1 million de tonnes en 2027 puis 3 millions de tonnes en 2032.",
      "إنتاج مليون طن سنة 2027 ثم 3 ملايين طن سنة 2032.",
    ),
    problem: bi(
      "La dependance aux importations fragilise la souverainete energetique et alimentaire.",
      "الاعتماد على الواردات يضعف السيادة الطاقية والغذائية.",
    ),
    proposal: bi(
      "Developper une filiere d'ammoniac vert pour reduire la dependance externe et soutenir les besoins strategiques du pays.",
      "تطوير سلسلة وطنية للأمونياك الأخضر لتقليص التبعية ودعم الحاجيات الاستراتيجية للبلاد.",
    ),
    beneficiaries: bi(
      "Agriculture, industrie, energie et souverainete nationale.",
      "الفلاحة والصناعة والطاقة والسيادة الوطنية.",
    ),
    funding: source,
    calendar: "2027-2032",
    indicator: bi(
      "1 million de tonnes en 2027, 3 millions de tonnes en 2032.",
      "مليون طن في 2027، و3 ملايين طن في 2032.",
    ),
  },
  {
    n: 8,
    axis: "besoins",
    title: bi("Internet dans le monde rural", "الإنترنت في العالم القروي"),
    promise: bi(
      "Connecter 1 800 communes rurales a l'internet a haut debit.",
      "ربط 1800 جماعة قروية بالإنترنت عالي الصبيب.",
    ),
    problem: bi(
      "La fracture numerique territoriale limite l'acces aux services et aux opportunites.",
      "الفجوة الرقمية الترابية تحد من الولوج إلى الخدمات والفرص.",
    ),
    proposal: bi(
      "Soutenir le cout des equipements pour les familles vulnerables et garantir un acces equitable aux services numeriques.",
      "دعم تكلفة التجهيزات للأسر الهشة وضمان ولوج منصف للخدمات الرقمية.",
    ),
    beneficiaries: bi(
      "Communes rurales, familles vulnerables, eleves, entrepreneurs et services publics.",
      "الجماعات القروية والأسر الهشة والتلاميذ والمقاولون والخدمات العمومية.",
    ),
    funding: source,
    calendar: "Prochaine legislature",
    indicator: bi(
      "1 800 communes rurales connectees au haut debit.",
      "1800 جماعة قروية مرتبطة بالإنترنت عالي الصبيب.",
    ),
  },
  {
    n: 9,
    axis: "identite",
    title: bi("Economie culturelle", "الاقتصاد الثقافي"),
    promise: bi(
      "Contribuer a la creation de 100 000 emplois dans les metiers creatifs d'ici 2030.",
      "المساهمة في خلق 100 ألف منصب شغل في المهن الإبداعية في أفق 2030.",
    ),
    problem: bi(
      "Les industries culturelles disposent d'un potentiel economique encore insuffisamment structure.",
      "الصناعات الثقافية تتوفر على إمكان اقتصادي غير مهيكل بما يكفي.",
    ),
    proposal: bi(
      "Mettre en place des incitations fiscales, soutenir le cinema et les industries culturelles et creer un passeport culturel numerique pour les jeunes.",
      "إقرار تحفيزات ضريبية، دعم السينما والصناعات الثقافية، وإحداث جواز ثقافي رقمي للشباب.",
    ),
    beneficiaries: bi(
      "Jeunes, artistes, createurs, industries culturelles et territoires.",
      "الشباب والفنانون والمبدعون والصناعات الثقافية والمجالات الترابية.",
    ),
    funding: source,
    calendar: "2030",
    indicator: bi(
      "100 000 emplois soutenus dans les metiers creatifs.",
      "دعم 100 ألف منصب شغل في المهن الإبداعية.",
    ),
  },
];

export const firstHundredDays: { day: string; title: Bi; detail: Bi }[] = [
  {
    day: "Priorite 1",
    title: bi("Administration efficace", "إدارة فعالة"),
    detail: bi(
      "Adopter le cadre legal de numerisation des services publics et interconnecter les administrations.",
      "اعتماد الإطار القانوني لرقمنة الخدمات العمومية وربط الإدارات فيما بينها.",
    ),
  },
  {
    day: "Priorite 2",
    title: bi("Soutien aux petites entreprises", "دعم المقاولات الصغيرة"),
    detail: bi(
      "Appliquer la part de 20 % des commandes publiques destinee aux PME et creer une loi specifique pour les petites entreprises.",
      "تفعيل حصة 20% من الطلبيات العمومية للمقاولات الصغرى والمتوسطة وإحداث قانون خاص بالمقاولات الصغيرة.",
    ),
  },
  {
    day: "Priorite 3",
    title: bi("Urgence hydrique", "الاستعجال المائي"),
    detail: bi(
      "Accelerer le dessalement, la reutilisation des eaux usees et la fabrication locale des equipements.",
      "تسريع التحلية وإعادة استعمال المياه العادمة وتصنيع التجهيزات محلياً.",
    ),
  },
  {
    day: "Priorite 4",
    title: bi("Sante et education", "الصحة والتعليم"),
    detail: bi(
      "Renforcer les structures sanitaires territoriales, ameliorer les conditions des professionnels et faire evoluer l'ecole vers l'apprentissage des competences.",
      "تعزيز البنيات الصحية الترابية، تحسين أوضاع المهنيين، وتطوير المدرسة نحو تعلم الكفاءات.",
    ),
  },
  {
    day: "Priorite 5",
    title: bi("Transparence et justice", "الشفافية والعدالة"),
    detail: bi(
      "Numeriser les tribunaux, lutter contre les intermediaires et renforcer l'independance administrative et financiere de la justice.",
      "رقمنة المحاكم، محاربة الوسطاء، وتعزيز الاستقلال الإداري والمالي للعدالة.",
    ),
  },
];

export const candidate = {
  title: bi("Le candidat", "المرشح"),
  intro: bi(
    "La plateforme presente Al ABASS Omar dans le cadre du programme electoral 2026 du Parti des Democrates Nouveaux, avec une approche nationale fondee sur l'efficacite, la justice et l'unite nationale.",
    "تقدم المنصة عمر العباس في إطار البرنامج الانتخابي 2026 لحزب الديمقراطيين الجدد، بمقاربة وطنية مبنية على الفعالية والعدالة والوحدة الوطنية.",
  ),
  path: [
    {
      year: "2014",
      label: bi("Fondation du Parti des Democrates Nouveaux.", "تأسيس حزب الديمقراطيين الجدد."),
    },
    {
      year: "2026",
      label: bi(
        "Plateforme electorale nationale actualisee pour les elections legislatives.",
        "منصة انتخابية وطنية محينة للانتخابات التشريعية.",
      ),
    },
    {
      year: "2030",
      label: bi(
        "Horizon des objectifs numeriques, hydriques, culturels et administratifs structurants.",
        "أفق الأهداف الرقمية والمائية والثقافية والإدارية المهيكلة.",
      ),
    },
  ] as { year: string; label: Bi }[],
  values: [
    bi("Efficacite et performance", "الفعالية والإنجاز"),
    bi("Responsabilite et transparence", "المسؤولية والشفافية"),
    bi("Justice sociale et territoriale", "العدالة الاجتماعية والترابية"),
    bi("Souverainete nationale", "السيادة الوطنية"),
    bi("Innovation et ouverture", "الابتكار والانفتاح"),
    bi("Identite marocaine plurielle", "الهوية المغربية المتعددة"),
  ] as Bi[],
};

export const financing = {
  title: bi(
    "Une politique fondee sur l'efficacite et la responsabilite",
    "سياسة مبنية على الفعالية والمسؤولية",
  ),
  items: [
    {
      label: bi("Responsabilite", "المسؤولية"),
      share: "01",
      detail: bi(
        "Reddition des comptes, transparence et evaluation des politiques publiques.",
        "ربط المسؤولية بالمحاسبة والشفافية وتقييم السياسات العمومية.",
      ),
    },
    {
      label: bi("Efficacite institutionnelle", "فعالية المؤسسات"),
      share: "02",
      detail: bi(
        "Modernisation de l'administration, simplification des procedures et services publics plus performants.",
        "تحديث الإدارة وتبسيط المساطر وخدمات عمومية أكثر نجاعة.",
      ),
    },
    {
      label: bi("Droits et libertes", "الحقوق والحريات"),
      share: "03",
      detail: bi(
        "Protection des droits, justice sociale et renforcement de la confiance publique.",
        "حماية الحقوق وتحقيق العدالة الاجتماعية وتعزيز الثقة العامة.",
      ),
    },
  ],
  note: bi(
    "Fonde en septembre 2014, le Parti des Democrates Nouveaux defend une approche pragmatique de l'action publique, centree sur l'efficacite des institutions, la responsabilite et la protection des droits et libertes.",
    "تأسس حزب الديمقراطيين الجدد في شتنبر 2014، ويدافع عن مقاربة عملية للفعل العمومي تركز على فعالية المؤسسات والمسؤولية وحماية الحقوق والحريات.",
  ),
};

export const news: { date: string; title: Bi; place: Bi }[] = [
  {
    date: "A documenter",
    title: bi(
      "Ajouter ici une vraie activite de terrain avec photo, date et lieu verifies.",
      "تضاف هنا أنشطة ميدانية حقيقية مع صورة وتاريخ ومكان موثقين.",
    ),
    place: bi("Source requise", "مصدر مطلوب"),
  },
  {
    date: "A documenter",
    title: bi(
      "Ne publier que des rencontres, visites ou actions confirmees par l'equipe de campagne.",
      "لا تنشر إلا اللقاءات أو الزيارات أو الأنشطة المؤكدة من فريق الحملة.",
    ),
    place: bi("Source requise", "مصدر مطلوب"),
  },
];

export const contact = {
  email: "",
  phone: "",
  whatsapp: "",
  address: bi(
    "Informations pratiques a ajouter uniquement si elles sont validees par l'equipe de campagne.",
    "تضاف المعلومات العملية فقط إذا تم اعتمادها من فريق الحملة.",
  ),
};

export const axisById = (id: AxisId) => axes.find((a) => a.id === id)!;
export const engagementsOfAxis = (id: AxisId) => engagements.filter((e) => e.axis === id);

/** Programme complet injecte dans le prompt systeme de l'assistant. */
export const programContext = `
CANDIDAT : ${identity.candidate.fr} / ${identity.candidate.ar}
PARTI : ${identity.party.fr} / ${identity.party.ar}
MESSAGE CENTRAL : ${identity.slogan.fr} / ${identity.slogan.ar}
POSITIONNEMENT : ${identity.positioning.fr} / ${identity.positioning.ar}

ASSISTANT : repondre exclusivement a partir de la plateforme electorale actualisee 2026 du Parti des Democrates Nouveaux. Ne pas inventer de chiffres, d'adresses, de calendrier local, de financement 60/25/15 ou de plan officiel des 100 jours.

AXES OFFICIELS :
${axes.map((a) => `Axe ${a.number} - ${a.title.fr} / ${a.title.ar} : ${a.summary.fr} / ${a.summary.ar} [${a.stat.value} - ${a.stat.label.fr} / ${a.stat.label.ar}]`).join("\n")}

OBJECTIFS CHIFFRES DU PROGRAMME :
${engagements
  .map(
    (
      e,
    ) => `Objectif ${e.n} (axe ${axisById(e.axis).number} - ${axisById(e.axis).title.fr}) : ${e.title.fr} / ${e.title.ar}
  Proposition principale : ${e.promise.fr} / ${e.promise.ar}
  Mesures : ${e.proposal.fr} / ${e.proposal.ar}
  Public concerne : ${e.beneficiaries.fr} / ${e.beneficiaries.ar}
  Echeance : ${e.calendar}
  Indicateur : ${e.indicator.fr} / ${e.indicator.ar}
  Source : plateforme electorale actualisee 2026`,
  )
  .join("\n")}

PRIORITES DE LA PROCHAINE LEGISLATURE :
${firstHundredDays.map((d) => `${d.title.fr} / ${d.title.ar} : ${d.detail.fr} / ${d.detail.ar}`).join("\n")}

VISION ET VALEURS :
${financing.note.fr}
${candidate.values.map((v) => `- ${v.fr} / ${v.ar}`).join("\n")}
`;
