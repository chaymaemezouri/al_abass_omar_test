/**
 * Contenu éditable du site et du programme électoral.
 * Pour mettre à jour le programme : modifier UNIQUEMENT ce fichier.
 * (Contenu provisoire crédible — à remplacer par le contenu officiel.)
 */

export type Lang = "fr" | "ar";
export type Bi = { fr: string; ar: string };

export const identity = {
  candidate: { fr: "Nom Prénom", ar: "الاسم الكامل" } as Bi,
  party: { fr: "Parti — Élections législatives 2026", ar: "الحزب — الانتخابات التشريعية 2026" } as Bi,
  district: { fr: "Circonscription de Rabat-Océan", ar: "دائرة الرباط المحيط" } as Bi,
  slogan: {
    fr: "Un Maroc qui produit, innove et protège ses citoyens",
    ar: "مغرب ينتج، يبتكر، ويحمي مواطنيه",
  } as Bi,
  positioning: {
    fr: "Le programme politique que chaque citoyen peut comprendre et interroger.",
    ar: "برنامج سياسي يفهمه كل مواطن ويستطيع أن يسائله.",
  } as Bi,
  pitch: {
    fr: "Découvrez les 25 engagements concrets du programme, ou posez directement votre question à l'assistant.",
    ar: "اكتشف 25 التزاما ملموسا في البرنامج، أو اطرح سؤالك مباشرة على المساعد.",
  } as Bi,
};

export type AxisId = "richesse" | "souverainete" | "digital" | "pme" | "gouvernance";

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
    title: { fr: "Production de richesse et emploi", ar: "إنتاج الثروة والتشغيل" },
    summary: {
      fr: "Relancer la production nationale et créer des emplois durables dans les territoires.",
      ar: "إنعاش الإنتاج الوطني وخلق مناصب شغل مستدامة في الجهات.",
    },
    stat: { value: "2030", label: { fr: "Horizon du plan productif", ar: "أفق المخطط الإنتاجي" } },
  },
  {
    id: "souverainete",
    number: 2,
    icon: "shield",
    title: { fr: "Souveraineté économique", ar: "السيادة الاقتصادية" },
    summary: {
      fr: "Réduire les dépendances stratégiques et sécuriser les secteurs vitaux du pays.",
      ar: "تقليص التبعية الاستراتيجية وتأمين القطاعات الحيوية.",
    },
    stat: { value: "100%", label: { fr: "Données publiques hébergées au Maroc", ar: "معطيات عمومية مستضافة بالمغرب" } },
  },
  {
    id: "digital",
    number: 3,
    icon: "monitor",
    title: { fr: "Administration en 5 minutes", ar: "إدارة في 5 دقائق" },
    summary: {
      fr: "Une administration simple, rapide et transparente, accessible depuis un téléphone.",
      ar: "إدارة بسيطة وسريعة وشفافة، في متناول المواطن عبر هاتفه.",
    },
    stat: { value: "80%", label: { fr: "Démarches dématérialisées avant 2029", ar: "من المساطر مرقمنة قبل 2029" } },
  },
  {
    id: "pme",
    number: 4,
    icon: "store",
    title: { fr: "PME, TPE et jeunes entrepreneurs", ar: "المقاولات الصغرى والشباب المقاول" },
    summary: {
      fr: "Financer, digitaliser et protéger le tissu des petites entreprises.",
      ar: "تمويل ورقمنة وحماية نسيج المقاولات الصغيرة.",
    },
    stat: { value: "60j", label: { fr: "Délai maximal de paiement public", ar: "أقصى أجل لأداء الصفقات العمومية" } },
  },
  {
    id: "gouvernance",
    number: 5,
    icon: "scale",
    title: { fr: "Gouvernance, intégrité et économie informelle", ar: "الحكامة والنزاهة والاقتصاد غير المهيكل" },
    summary: {
      fr: "Intégrer progressivement l'informel, renforcer la vigilance numérique et l'intégrité publique.",
      ar: "الإدماج التدريجي للقطاع غير المهيكل وتعزيز اليقظة الرقمية والنزاهة.",
    },
    stat: { value: "0", label: { fr: "Tolérance envers la corruption", ar: "تسامح مع الفساد" } },
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

export const engagements: Engagement[] = [
  // AXE 1 — Production de richesse et emploi
  {
    n: 1,
    axis: "richesse",
    title: { fr: "Plan industriel des régions", ar: "مخطط صناعي جهوي" },
    promise: { fr: "Un plan industriel chiffré par région avant fin 2027.", ar: "مخطط صناعي مرقم لكل جهة قبل نهاية 2027." },
    problem: { fr: "L'industrie reste concentrée sur deux axes urbains, laissant des régions sans base productive.", ar: "تتركز الصناعة في محورين حضريين، وتبقى جهات بدون قاعدة إنتاجية." },
    proposal: { fr: "Doter chaque région d'un plan industriel avec filières prioritaires, foncier mobilisé et guichet unique d'investissement.", ar: "تزويد كل جهة بمخطط صناعي يحدد القطاعات ذات الأولوية والوعاء العقاري وشباك موحد للاستثمار." },
    beneficiaries: { fr: "Industriels, jeunes diplômés, régions à faible activité.", ar: "الصناعيون، الشباب الحاصلون على الشهادات، الجهات الأقل نشاطا." },
    funding: { fr: "Redéploiement du fonds d'investissement régional, sans nouvel impôt.", ar: "إعادة توجيه صندوق الاستثمار الجهوي، دون ضريبة جديدة." },
    calendar: "2027–2029",
    indicator: { fr: "Nombre d'unités productives créées par région.", ar: "عدد الوحدات الإنتاجية المحدثة في كل جهة." },
  },
  {
    n: 2,
    axis: "richesse",
    title: { fr: "Préférence nationale à l'achat public", ar: "الأفضلية الوطنية في الشراء العمومي" },
    promise: { fr: "40% de la commande publique réservée à la production nationale.", ar: "40% من الطلبيات العمومية للإنتاج الوطني." },
    problem: { fr: "Une part importante de la dépense publique alimente des importations substituables.", ar: "جزء مهم من النفقات العمومية يمول واردات يمكن تعويضها." },
    proposal: { fr: "Fixer un seuil minimal de contenu local dans les marchés publics et publier chaque année le taux atteint.", ar: "تحديد عتبة دنيا للمحتوى المحلي في الصفقات العمومية ونشر النسبة المحققة سنويا." },
    beneficiaries: { fr: "Industriels locaux, sous-traitants, emploi ouvrier.", ar: "الصناعيون المحليون، المناولون، الشغل الصناعي." },
    funding: { fr: "À budget constant : réorientation de la dépense existante.", ar: "بميزانية ثابتة: إعادة توجيه النفقات الحالية." },
    calendar: "2027–2028",
    indicator: { fr: "Part de contenu local dans les marchés publics.", ar: "نسبة المحتوى المحلي في الصفقات العمومية." },
  },
  {
    n: 3,
    axis: "richesse",
    title: { fr: "Formation aux métiers d'avenir", ar: "التكوين في مهن المستقبل" },
    promise: { fr: "100 000 jeunes formés aux métiers techniques et numériques d'ici 2030.", ar: "تكوين 100 ألف شاب في المهن التقنية والرقمية في أفق 2030." },
    problem: { fr: "Les entreprises ne trouvent pas les profils techniques dont elles ont besoin.", ar: "المقاولات لا تجد الكفاءات التقنية التي تحتاجها." },
    proposal: { fr: "Contrats de formation cofinancés entreprise-État, avec engagement d'embauche.", ar: "عقود تكوين بتمويل مشترك بين المقاولة والدولة مع التزام بالتشغيل." },
    beneficiaries: { fr: "Jeunes de 18 à 30 ans, entreprises industrielles et numériques.", ar: "الشباب من 18 إلى 30 سنة، المقاولات الصناعية والرقمية." },
    funding: { fr: "Fonds de la formation professionnelle, redéployé et évalué.", ar: "صندوق التكوين المهني، معاد توجيهه ومقيَّم." },
    calendar: "2027–2030",
    indicator: { fr: "Taux d'insertion à 12 mois après la formation.", ar: "نسبة الإدماج بعد 12 شهرا من التكوين." },
  },
  {
    n: 4,
    axis: "richesse",
    title: { fr: "Valorisation locale des ressources", ar: "التثمين المحلي للموارد" },
    promise: { fr: "Transformer localement au moins 50% des ressources extraites.", ar: "تحويل 50% على الأقل من الموارد المستخرجة محليا." },
    problem: { fr: "Trop de ressources partent brutes et la valeur ajoutée se crée ailleurs.", ar: "موارد كثيرة تصدَّر خاما وتُخلق القيمة المضافة خارج البلاد." },
    proposal: { fr: "Conditionner les autorisations d'exploitation à un engagement de transformation locale.", ar: "ربط رخص الاستغلال بالتزام بالتحويل المحلي." },
    beneficiaries: { fr: "Territoires producteurs, industrie de transformation.", ar: "المناطق المنتجة، صناعة التحويل." },
    funding: { fr: "Aucun coût budgétaire : mesure réglementaire.", ar: "بدون كلفة على الميزانية: إجراء تنظيمي." },
    calendar: "2028–2030",
    indicator: { fr: "Part des ressources transformées au Maroc.", ar: "نسبة الموارد المحوَّلة داخل المغرب." },
  },
  {
    n: 5,
    axis: "richesse",
    title: { fr: "Emploi rural et économie de proximité", ar: "التشغيل القروي والاقتصاد القربي" },
    promise: { fr: "Un dispositif d'appui à l'emploi dans chaque commune rurale prioritaire.", ar: "آلية لدعم التشغيل في كل جماعة قروية ذات أولوية." },
    problem: { fr: "L'exode rural s'accélère faute d'activité économique locale.", ar: "تسارع الهجرة القروية بسبب غياب النشاط الاقتصادي المحلي." },
    proposal: { fr: "Coopératives accompagnées, accès aux marchés et logistique mutualisée.", ar: "تعاونيات مواكَبة، وولوج إلى الأسواق، ولوجستيك مشترك." },
    beneficiaries: { fr: "Agriculteurs, coopératives, femmes en milieu rural.", ar: "الفلاحون، التعاونيات، النساء في العالم القروي." },
    funding: { fr: "Programmes de développement rural existants, mieux ciblés.", ar: "برامج التنمية القروية الحالية، باستهداف أدق." },
    calendar: "2027–2030",
    indicator: { fr: "Emplois déclarés créés en milieu rural.", ar: "مناصب الشغل المصرح بها في العالم القروي." },
  },

  // AXE 2 — Souveraineté économique
  {
    n: 6,
    axis: "souverainete",
    title: { fr: "Sécurité alimentaire", ar: "الأمن الغذائي" },
    promise: { fr: "Couvrir 80% des besoins nationaux en produits de base.", ar: "تغطية 80% من الحاجيات الوطنية من المواد الأساسية." },
    problem: { fr: "La dépendance aux importations expose les prix aux chocs extérieurs.", ar: "التبعية للواردات تعرض الأسعار للصدمات الخارجية." },
    proposal: { fr: "Plan céréalier et maraîcher, stockage stratégique et contractualisation avec les producteurs.", ar: "مخطط للحبوب والخضروات، وتخزين استراتيجي، وتعاقد مع المنتجين." },
    beneficiaries: { fr: "Consommateurs, agriculteurs, filières agroalimentaires.", ar: "المستهلكون، الفلاحون، الصناعات الغذائية." },
    funding: { fr: "Réallocation des subventions agricoles vers les cultures stratégiques.", ar: "إعادة توجيه الدعم الفلاحي نحو الزراعات الاستراتيجية." },
    calendar: "2027–2030",
    indicator: { fr: "Taux de couverture des besoins de base.", ar: "نسبة تغطية الحاجيات الأساسية." },
  },
  {
    n: 7,
    axis: "souverainete",
    title: { fr: "Souveraineté hydrique", ar: "السيادة المائية" },
    promise: { fr: "Zéro perte évitable sur les réseaux d'eau urbains d'ici 2030.", ar: "صفر ضياع قابل للتفادي في شبكات الماء الحضرية في أفق 2030." },
    problem: { fr: "Une part significative de l'eau potable est perdue dans des réseaux vétustes.", ar: "جزء مهم من الماء الصالح للشرب يضيع في شبكات متقادمة." },
    proposal: { fr: "Programme de rénovation des réseaux, télérelève et réutilisation des eaux traitées.", ar: "برنامج لتجديد الشبكات، والقياس عن بعد، وإعادة استعمال المياه المعالجة." },
    beneficiaries: { fr: "Tous les usagers, agriculture irriguée, industries.", ar: "جميع المستعملين، الفلاحة المسقية، الصناعات." },
    funding: { fr: "Contrats-programmes avec les régies et bailleurs de développement.", ar: "عقود برامج مع الوكالات والممولين التنمويين." },
    calendar: "2027–2030",
    indicator: { fr: "Rendement des réseaux d'eau potable.", ar: "مردودية شبكات الماء الصالح للشرب." },
  },
  {
    n: 8,
    axis: "souverainete",
    title: { fr: "Énergie et industrie propre", ar: "الطاقة والصناعة النظيفة" },
    promise: { fr: "Alimenter les zones industrielles en électricité renouvelable compétitive.", ar: "تزويد المناطق الصناعية بكهرباء متجددة تنافسية." },
    problem: { fr: "Le coût de l'énergie pèse sur la compétitivité industrielle.", ar: "كلفة الطاقة تثقل تنافسية الصناعة." },
    proposal: { fr: "Autoproduction autorisée et raccordement prioritaire des zones industrielles.", ar: "الترخيص بالإنتاج الذاتي وأولوية الربط للمناطق الصناعية." },
    beneficiaries: { fr: "Industriels, exportateurs, emploi industriel.", ar: "الصناعيون، المصدرون، الشغل الصناعي." },
    funding: { fr: "Investissement privé encadré, sans subvention directe.", ar: "استثمار خاص مؤطر، دون دعم مباشر." },
    calendar: "2027–2030",
    indicator: { fr: "Prix moyen du kWh industriel.", ar: "متوسط ثمن الكيلوواط ساعة الصناعي." },
  },
  {
    n: 9,
    axis: "souverainete",
    title: { fr: "Souveraineté des données publiques", ar: "سيادة المعطيات العمومية" },
    promise: { fr: "100% des données publiques sensibles hébergées au Maroc.", ar: "100% من المعطيات العمومية الحساسة مستضافة بالمغرب." },
    problem: { fr: "Des données publiques sensibles sont hébergées hors du territoire national.", ar: "معطيات عمومية حساسة مستضافة خارج التراب الوطني." },
    proposal: { fr: "Cloud souverain public et obligation d'hébergement local pour les administrations.", ar: "سحابة سيادية عمومية وإلزام الإدارات بالاستضافة المحلية." },
    beneficiaries: { fr: "Citoyens, administrations, entreprises du numérique.", ar: "المواطنون، الإدارات، مقاولات الرقمي." },
    funding: { fr: "Mutualisation des budgets informatiques de l'État.", ar: "تجميع الميزانيات المعلوماتية للدولة." },
    calendar: "2027–2029",
    indicator: { fr: "Part des données publiques hébergées localement.", ar: "نسبة المعطيات العمومية المستضافة محليا." },
  },
  {
    n: 10,
    axis: "souverainete",
    title: { fr: "Réserve stratégique et prix", ar: "المخزون الاستراتيجي والأسعار" },
    promise: { fr: "Publier chaque trimestre l'état des réserves stratégiques.", ar: "نشر وضعية المخزون الاستراتيجي كل ثلاثة أشهر." },
    problem: { fr: "Les citoyens subissent des flambées de prix sans information claire.", ar: "المواطنون يتحملون ارتفاع الأسعار دون معلومة واضحة." },
    proposal: { fr: "Transparence trimestrielle sur les stocks et suivi public des marges.", ar: "شفافية فصلية حول المخزون وتتبع عمومي للهوامش." },
    beneficiaries: { fr: "Consommateurs, distributeurs de bonne foi.", ar: "المستهلكون، الموزعون النزهاء." },
    funding: { fr: "Sans coût significatif : publication de données existantes.", ar: "بدون كلفة تذكر: نشر معطيات متوفرة." },
    calendar: "2027",
    indicator: { fr: "Publication effective de 4 rapports par an.", ar: "نشر 4 تقارير في السنة فعليا." },
    first100: true,
  },

  // AXE 3 — Administration en 5 minutes
  {
    n: 11,
    axis: "digital",
    title: { fr: "Administration en 5 minutes", ar: "إدارة في 5 دقائق" },
    promise: { fr: "Dématérialiser 80% des démarches courantes avant 2029.", ar: "رقمنة 80% من المساطر اليومية قبل 2029." },
    problem: { fr: "Les démarches courantes exigent encore des déplacements et des délais imprévisibles.", ar: "المساطر اليومية ما زالت تتطلب التنقل وآجالا غير متوقعة." },
    proposal: { fr: "Portail unique, identité numérique et suppression des pièces déjà détenues par l'administration.", ar: "بوابة موحدة، وهوية رقمية، وحذف الوثائق التي تتوفر عليها الإدارة." },
    beneficiaries: { fr: "Tous les citoyens, entreprises, MRE.", ar: "جميع المواطنين، المقاولات، مغاربة العالم." },
    funding: { fr: "Budget de transformation numérique de l'État, à périmètre constant.", ar: "ميزانية التحول الرقمي للدولة، دون زيادة." },
    calendar: "2027–2029",
    indicator: { fr: "Réduction de 30% des délais administratifs.", ar: "تقليص 30% من الآجال الإدارية." },
    first100: true,
  },
  {
    n: 12,
    axis: "digital",
    title: { fr: "Délais opposables", ar: "آجال ملزمة" },
    promise: { fr: "Chaque démarche publie un délai maximal opposable.", ar: "كل مسطرة تنشر أجلا أقصى ملزما." },
    problem: { fr: "Le citoyen ignore quand sa demande sera traitée et n'a aucun recours simple.", ar: "المواطن يجهل متى ستعالَج طلباته وليس له طعن بسيط." },
    proposal: { fr: "Publication des délais, accusé de réception automatique et accord tacite en cas de dépassement.", ar: "نشر الآجال، وإشعار آلي بالتوصل، وموافقة ضمنية عند تجاوز الأجل." },
    beneficiaries: { fr: "Citoyens, entreprises, investisseurs.", ar: "المواطنون، المقاولات، المستثمرون." },
    funding: { fr: "Mesure réglementaire, sans coût direct.", ar: "إجراء تنظيمي، بدون كلفة مباشرة." },
    calendar: "2027–2028",
    indicator: { fr: "Part des demandes traitées dans le délai annoncé.", ar: "نسبة الطلبات المعالَجة داخل الأجل المعلن." },
    first100: true,
  },
  {
    n: 13,
    axis: "digital",
    title: { fr: "Interopérabilité des administrations", ar: "التقائية الإدارات" },
    promise: { fr: "Ne plus jamais redemander un document déjà détenu par l'État.", ar: "عدم طلب أي وثيقة تتوفر عليها الدولة مرة أخرى." },
    problem: { fr: "Les administrations ne partagent pas leurs données et le citoyen fait le facteur.", ar: "الإدارات لا تتبادل معطياتها والمواطن يقوم بدور الساعي." },
    proposal: { fr: "Plateforme d'échange sécurisée entre administrations, avec traçabilité des accès.", ar: "منصة تبادل آمنة بين الإدارات مع تتبع الولوجات." },
    beneficiaries: { fr: "Citoyens, agents publics, entreprises.", ar: "المواطنون، الموظفون، المقاولات." },
    funding: { fr: "Mutualisation informatique interministérielle.", ar: "تجميع الوسائل المعلوماتية بين القطاعات." },
    calendar: "2028–2029",
    indicator: { fr: "Nombre de pièces justificatives supprimées.", ar: "عدد الوثائق المحذوفة." },
  },
  {
    n: 14,
    axis: "digital",
    title: { fr: "Accès numérique pour tous", ar: "ولوج رقمي للجميع" },
    promise: { fr: "Un point d'accompagnement numérique dans chaque commune.", ar: "نقطة مواكبة رقمية في كل جماعة." },
    problem: { fr: "La digitalisation risque d'exclure les personnes peu connectées ou peu alphabétisées.", ar: "الرقمنة قد تقصي غير المتصلين أو غير المتمدرسين." },
    proposal: { fr: "Agents d'accompagnement, interfaces en darija et service téléphonique.", ar: "أعوان مواكبة، وواجهات بالدارجة، وخدمة هاتفية." },
    beneficiaries: { fr: "Personnes âgées, milieu rural, publics fragiles.", ar: "المسنون، العالم القروي، الفئات الهشة." },
    funding: { fr: "Redéploiement d'agents publics et partenariat avec les communes.", ar: "إعادة انتشار الموظفين وشراكة مع الجماعات." },
    calendar: "2027–2029",
    indicator: { fr: "Nombre de citoyens accompagnés par an.", ar: "عدد المواطنين المواكَبين سنويا." },
  },
  {
    n: 15,
    axis: "digital",
    title: { fr: "Protection des données personnelles", ar: "حماية المعطيات الشخصية" },
    promise: { fr: "Un contrôle indépendant et des sanctions effectives en cas de fuite.", ar: "مراقبة مستقلة وعقوبات فعلية عند تسريب المعطيات." },
    problem: { fr: "Les citoyens n'ont aucune visibilité sur l'usage de leurs données.", ar: "المواطنون لا يعرفون كيف تُستعمل معطياتهم." },
    proposal: { fr: "Renforcer l'autorité de protection, journal d'accès consultable par le citoyen.", ar: "تقوية سلطة الحماية وسجل ولوج يطلع عليه المواطن." },
    beneficiaries: { fr: "Tous les usagers des services publics numériques.", ar: "جميع مستعملي الخدمات العمومية الرقمية." },
    funding: { fr: "Budget de l'autorité de contrôle, renforcé.", ar: "ميزانية سلطة المراقبة، معززة." },
    calendar: "2028",
    indicator: { fr: "Délai moyen de traitement des plaintes.", ar: "متوسط أجل معالجة الشكايات." },
  },

  // AXE 4 — PME / TPE
  {
    n: 16,
    axis: "pme",
    title: { fr: "Financement simplifié des TPE", ar: "تمويل مبسط للمقاولات الصغرى جدا" },
    promise: { fr: "Une réponse de financement en 15 jours maximum avec garantie publique.", ar: "جواب حول التمويل في 15 يوما كأقصى حد مع ضمان عمومي." },
    problem: { fr: "Les très petites entreprises sont écartées du crédit faute de garanties.", ar: "المقاولات الصغرى جدا تُقصى من القروض لغياب الضمانات." },
    proposal: { fr: "Garantie publique renforcée, dossier standardisé et décision encadrée dans le temps.", ar: "ضمان عمومي معزز، وملف موحد، وقرار داخل أجل محدد." },
    beneficiaries: { fr: "TPE, artisans, commerçants, auto-entrepreneurs.", ar: "المقاولات الصغرى، الصناع التقليديون، التجار، المقاولون الذاتيون." },
    funding: { fr: "Fonds de garantie existant, recapitalisé par redéploiement.", ar: "صندوق الضمان الحالي، معاد رسملته بإعادة التوجيه." },
    calendar: "2027–2028",
    indicator: { fr: "Délai moyen de réponse et taux d'accord.", ar: "متوسط أجل الجواب ونسبة الموافقة." },
    first100: true,
  },
  {
    n: 17,
    axis: "pme",
    title: { fr: "Délais de paiement public", ar: "آجال الأداء العمومي" },
    promise: { fr: "Paiement des factures publiques en 60 jours, intérêts automatiques au-delà.", ar: "أداء الفواتير العمومية في 60 يوما، مع فوائد آلية بعد ذلك." },
    problem: { fr: "Les retards de paiement de l'État asphyxient la trésorerie des PME.", ar: "تأخر أداء الدولة يخنق خزينة المقاولات." },
    proposal: { fr: "Compteur public des délais par administration et intérêts de retard versés d'office.", ar: "عداد عمومي للآجال حسب الإدارة وفوائد تأخير تُصرف تلقائيا." },
    beneficiaries: { fr: "PME et TPE fournisseurs de l'État.", ar: "المقاولات الموردة للدولة." },
    funding: { fr: "Meilleure programmation budgétaire, sans dépense nouvelle.", ar: "برمجة ميزانياتية أفضل، دون نفقات جديدة." },
    calendar: "2027",
    indicator: { fr: "Délai moyen de paiement par administration.", ar: "متوسط أجل الأداء حسب الإدارة." },
    first100: true,
  },
  {
    n: 18,
    axis: "pme",
    title: { fr: "Digitalisation accompagnée", ar: "رقمنة مواكَبة" },
    promise: { fr: "Accompagner 50 000 petites entreprises à la facturation électronique.", ar: "مواكبة 50 ألف مقاولة صغيرة نحو الفوترة الإلكترونية." },
    problem: { fr: "La facturation électronique est vécue comme une contrainte sans appui.", ar: "الفوترة الإلكترونية تُعاش كإكراه دون دعم." },
    proposal: { fr: "Outils gratuits, formation courte et assistance en darija.", ar: "أدوات مجانية، وتكوين قصير، ومساعدة بالدارجة." },
    beneficiaries: { fr: "TPE, commerçants, professions libérales.", ar: "المقاولات الصغرى، التجار، المهن الحرة." },
    funding: { fr: "Partenariat public-privé avec les opérateurs numériques.", ar: "شراكة بين القطاعين العام والخاص مع المتعهدين الرقميين." },
    calendar: "2027–2029",
    indicator: { fr: "Nombre d'entreprises équipées et actives.", ar: "عدد المقاولات المجهزة والنشيطة." },
  },
  {
    n: 19,
    axis: "pme",
    title: { fr: "Fiscalité lisible et stable", ar: "جباية واضحة ومستقرة" },
    promise: { fr: "Aucune modification fiscale rétroactive pour les TPE.", ar: "لا تعديل جبائي بأثر رجعي على المقاولات الصغرى." },
    problem: { fr: "L'instabilité fiscale décourage la formalisation et l'investissement.", ar: "عدم استقرار الجباية يثبط الهيكلة والاستثمار." },
    proposal: { fr: "Régime simplifié pluriannuel, taux connus trois ans à l'avance.", ar: "نظام مبسط متعدد السنوات، بأسعار معروفة قبل ثلاث سنوات." },
    beneficiaries: { fr: "TPE, auto-entrepreneurs, jeunes créateurs.", ar: "المقاولات الصغرى، المقاولون الذاتيون، الشباب المحدثون." },
    funding: { fr: "Neutre : élargissement de l'assiette par la formalisation.", ar: "محايد: توسيع الوعاء عبر الهيكلة." },
    calendar: "2028",
    indicator: { fr: "Nombre de nouvelles entreprises formalisées.", ar: "عدد المقاولات الجديدة المهيكلة." },
  },
  {
    n: 20,
    axis: "pme",
    title: { fr: "Jeunes entrepreneurs", ar: "الشباب المقاول" },
    promise: { fr: "Création d'entreprise en 24 heures et sans frais la première année.", ar: "إحداث مقاولة في 24 ساعة وبدون رسوم في السنة الأولى." },
    problem: { fr: "Les démarches et les frais découragent les jeunes porteurs de projet.", ar: "المساطر والرسوم تثبط حاملي المشاريع الشباب." },
    proposal: { fr: "Création 100% en ligne, exonération de frais initiaux et mentorat.", ar: "إحداث رقمي كامل، وإعفاء من الرسوم الأولية، ومواكبة." },
    beneficiaries: { fr: "Jeunes de moins de 35 ans, étudiants, diaspora.", ar: "الشباب دون 35 سنة، الطلبة، مغاربة العالم." },
    funding: { fr: "Coût limité, compensé par l'élargissement de la base fiscale.", ar: "كلفة محدودة يعوضها توسيع الوعاء الجبائي." },
    calendar: "2027–2028",
    indicator: { fr: "Délai réel de création et taux de survie à 3 ans.", ar: "الأجل الفعلي للإحداث ونسبة الاستمرار بعد 3 سنوات." },
  },

  // AXE 5 — Gouvernance
  {
    n: 21,
    axis: "gouvernance",
    title: { fr: "Statut simplifié pour l'informel", ar: "نظام مبسط للقطاع غير المهيكل" },
    promise: { fr: "Un statut simple avec couverture sociale, sans redressement rétroactif.", ar: "نظام بسيط مع تغطية اجتماعية، دون مراجعة بأثر رجعي." },
    problem: { fr: "Des millions d'actifs travaillent sans protection ni accès au crédit.", ar: "ملايين النشيطين يعملون دون حماية ولا ولوج للتمويل." },
    proposal: { fr: "Inscription simplifiée, cotisation forfaitaire progressive et amnistie d'entrée.", ar: "تسجيل مبسط، ومساهمة جزافية تدريجية، وعفو عند الانخراط." },
    beneficiaries: { fr: "Travailleurs informels, familles, artisans.", ar: "العاملون في القطاع غير المهيكل، الأسر، الصناع." },
    funding: { fr: "Financement progressif par les cotisations nouvelles.", ar: "تمويل تدريجي عبر المساهمات الجديدة." },
    calendar: "2027–2030",
    indicator: { fr: "Nombre d'actifs nouvellement couverts.", ar: "عدد النشيطين المشمولين حديثا." },
  },
  {
    n: 22,
    axis: "gouvernance",
    title: { fr: "Transparence des marchés publics", ar: "شفافية الصفقات العمومية" },
    promise: { fr: "Tous les marchés publics publiés en données ouvertes.", ar: "نشر جميع الصفقات العمومية في شكل معطيات مفتوحة." },
    problem: { fr: "Le contrôle citoyen de la dépense publique reste difficile.", ar: "المراقبة المواطنة للنفقات العمومية تبقى صعبة." },
    proposal: { fr: "Portail unique des marchés, attributaires et avenants, téléchargeable.", ar: "بوابة موحدة للصفقات والفائزين والملحقات، قابلة للتحميل." },
    beneficiaries: { fr: "Citoyens, journalistes, entreprises candidates.", ar: "المواطنون، الصحافيون، المقاولات المتنافسة." },
    funding: { fr: "Extension du portail existant.", ar: "توسيع البوابة الحالية." },
    calendar: "2027",
    indicator: { fr: "Part des marchés publiés en données ouvertes.", ar: "نسبة الصفقات المنشورة كمعطيات مفتوحة." },
    first100: true,
  },
  {
    n: 23,
    axis: "gouvernance",
    title: { fr: "Lutte contre la corruption", ar: "محاربة الفساد" },
    promise: { fr: "Protection effective des lanceurs d'alerte et sanctions publiées.", ar: "حماية فعلية للمبلغين ونشر العقوبات." },
    problem: { fr: "Signaler la corruption expose plus qu'il ne protège.", ar: "التبليغ عن الفساد يعرّض أكثر مما يحمي." },
    proposal: { fr: "Canal de signalement sécurisé, anonymat garanti et suivi public des suites.", ar: "قناة تبليغ آمنة، وضمان السرية، وتتبع عمومي للمآلات." },
    beneficiaries: { fr: "Agents publics intègres, usagers, entreprises honnêtes.", ar: "الموظفون النزهاء، المرتفقون، المقاولات النزيهة." },
    funding: { fr: "Instance nationale existante, moyens renforcés.", ar: "الهيئة الوطنية الحالية، بموارد معززة." },
    calendar: "2027–2028",
    indicator: { fr: "Nombre de signalements traités et suites données.", ar: "عدد التبليغات المعالجة والمآلات." },
  },
  {
    n: 24,
    axis: "gouvernance",
    title: { fr: "Vigilance numérique", ar: "اليقظة الرقمية" },
    promise: { fr: "Un service public de signalement des arnaques en ligne, réponse en 48h.", ar: "خدمة عمومية للتبليغ عن النصب الرقمي، بجواب في 48 ساعة." },
    problem: { fr: "Les fraudes en ligne se multiplient sans recours accessible.", ar: "تتكاثر عمليات النصب الرقمي دون طعن في المتناول." },
    proposal: { fr: "Guichet unique de signalement, coopération avec banques et plateformes.", ar: "شباك موحد للتبليغ، وتعاون مع الأبناك والمنصات." },
    beneficiaries: { fr: "Consommateurs, commerçants en ligne, familles.", ar: "المستهلكون، التجار الرقميون، الأسر." },
    funding: { fr: "Redéploiement au sein des services de contrôle.", ar: "إعادة انتشار داخل مصالح المراقبة." },
    calendar: "2028",
    indicator: { fr: "Délai moyen de première réponse.", ar: "متوسط أجل الجواب الأول." },
  },
  {
    n: 25,
    axis: "gouvernance",
    title: { fr: "Reddition des comptes annuelle", ar: "المحاسبة السنوية" },
    promise: { fr: "Un bilan public annuel de chaque engagement, chiffres à l'appui.", ar: "حصيلة عمومية سنوية لكل التزام، بالأرقام." },
    problem: { fr: "Les promesses électorales ne sont jamais évaluées publiquement.", ar: "الوعود الانتخابية لا تُقيَّم عموميا أبدا." },
    proposal: { fr: "Tableau de bord en ligne, mis à jour et présenté chaque année aux citoyens.", ar: "لوحة قيادة رقمية، تُحدَّث وتُقدَّم سنويا للمواطنين." },
    beneficiaries: { fr: "Tous les citoyens de la circonscription.", ar: "جميع مواطني الدائرة." },
    funding: { fr: "Sur les moyens de la permanence parlementaire.", ar: "من موارد المكتب البرلماني." },
    calendar: "2027–2031",
    indicator: { fr: "Publication effective du bilan chaque année.", ar: "نشر الحصيلة فعليا كل سنة." },
    first100: true,
  },
];

export const firstHundredDays: { day: string; title: Bi; detail: Bi }[] = [
  {
    day: "J+15",
    title: { fr: "Permanence citoyenne ouverte", ar: "فتح المكتب المواطن" },
    detail: {
      fr: "Une permanence hebdomadaire dans la circonscription, sans rendez-vous.",
      ar: "مكتب أسبوعي بالدائرة، بدون موعد مسبق.",
    },
  },
  {
    day: "J+30",
    title: { fr: "Compteur des délais de paiement", ar: "عداد آجال الأداء" },
    detail: {
      fr: "Publication du premier relevé des délais de paiement publics (engagement 17).",
      ar: "نشر أول كشف لآجال الأداء العمومي (الالتزام 17).",
    },
  },
  {
    day: "J+45",
    title: { fr: "Proposition de loi : délais opposables", ar: "مقترح قانون: آجال ملزمة" },
    detail: {
      fr: "Dépôt du texte instaurant des délais administratifs opposables (engagement 12).",
      ar: "إيداع نص يقر آجالا إدارية ملزمة (الالتزام 12).",
    },
  },
  {
    day: "J+60",
    title: { fr: "Marchés publics en données ouvertes", ar: "الصفقات العمومية كمعطيات مفتوحة" },
    detail: {
      fr: "Demande officielle de publication intégrale des marchés (engagement 22).",
      ar: "طلب رسمي بنشر كامل الصفقات (الالتزام 22).",
    },
  },
  {
    day: "J+90",
    title: { fr: "Premier rapport public", ar: "أول تقرير عمومي" },
    detail: {
      fr: "Bilan des 100 premiers jours publié en ligne et présenté aux citoyens (engagement 25).",
      ar: "حصيلة أول 100 يوم تُنشر رقميا وتُقدَّم للمواطنين (الالتزام 25).",
    },
  },
];

export const candidate = {
  title: { fr: "Le candidat", ar: "المرشح" },
  intro: {
    fr: "Ingénieur de formation, chef d'entreprise pendant quinze ans, engagé depuis dix ans dans la vie associative de la circonscription.",
    ar: "مهندس التكوين، مقاول لمدة خمس عشرة سنة، منخرط منذ عشر سنوات في العمل الجمعوي بالدائرة.",
  } as Bi,
  path: [
    { year: "2004", label: { fr: "Diplôme d'ingénieur, puis premières années en industrie", ar: "دبلوم مهندس، ثم سنوات أولى في الصناعة" } },
    { year: "2010", label: { fr: "Création d'une PME industrielle, 80 emplois", ar: "إحداث مقاولة صناعية، 80 منصب شغل" } },
    { year: "2016", label: { fr: "Président d'une association d'appui aux jeunes entrepreneurs", ar: "رئيس جمعية لدعم الشباب المقاول" } },
    { year: "2021", label: { fr: "Conseiller communal, en charge du développement économique", ar: "مستشار جماعي مكلف بالتنمية الاقتصادية" } },
    { year: "2026", label: { fr: "Candidat aux élections législatives", ar: "مرشح للانتخابات التشريعية" } },
  ] as { year: string; label: Bi }[],
  values: [
    { fr: "Dire ce que l'on fera, et rendre compte de ce que l'on a fait.", ar: "قول ما سنفعله، والمحاسبة على ما فعلناه." },
    { fr: "Aucun engagement sans chiffre, sans calendrier et sans financement.", ar: "لا التزام بدون رقم وجدولة وتمويل." },
    { fr: "Le respect de l'adversaire et le refus de toute stigmatisation.", ar: "احترام الخصم ورفض كل وصم." },
  ] as Bi[],
};

export const financing = {
  title: { fr: "Comment ce programme est financé", ar: "كيف يُموَّل هذا البرنامج" },
  items: [
    {
      label: { fr: "Redéploiement budgétaire", ar: "إعادة توجيه الميزانية" },
      share: "60%",
      detail: { fr: "Réorientation de dépenses existantes vers les priorités du programme.", ar: "إعادة توجيه نفقات قائمة نحو أولويات البرنامج." },
    },
    {
      label: { fr: "Élargissement de l'assiette", ar: "توسيع الوعاء" },
      share: "25%",
      detail: { fr: "Recettes issues de la formalisation progressive de l'informel.", ar: "مداخيل ناتجة عن الهيكلة التدريجية للقطاع غير المهيكل." },
    },
    {
      label: { fr: "Partenariats et investissement privé", ar: "الشراكات والاستثمار الخاص" },
      share: "15%",
      detail: { fr: "Investissement privé encadré, sans garantie budgétaire cachée.", ar: "استثمار خاص مؤطر، دون ضمانات ميزانياتية خفية." },
    },
  ],
  note: {
    fr: "Aucun engagement de ce programme ne repose sur une hausse de la pression fiscale sur les ménages.",
    ar: "لا يعتمد أي التزام في هذا البرنامج على رفع الضغط الجبائي على الأسر.",
  } as Bi,
};

export const news: { date: string; title: Bi; place: Bi }[] = [
  {
    date: "2026-08-28",
    title: { fr: "Rencontre avec les commerçants du marché central", ar: "لقاء مع تجار السوق المركزي" },
    place: { fr: "Rabat-Océan", ar: "الرباط المحيط" },
  },
  {
    date: "2026-08-20",
    title: { fr: "Atelier avec de jeunes porteurs de projets", ar: "ورشة مع شباب حاملي المشاريع" },
    place: { fr: "Espace jeunesse", ar: "فضاء الشباب" },
  },
  {
    date: "2026-08-12",
    title: { fr: "Visite d'une unité industrielle locale", ar: "زيارة وحدة صناعية محلية" },
    place: { fr: "Zone industrielle", ar: "المنطقة الصناعية" },
  },
];

export const contact = {
  email: "contact@campagne2026.ma",
  phone: "+212 5 00 00 00 00",
  whatsapp: "212500000000",
  address: { fr: "Siège de campagne, Rabat, Maroc", ar: "المقر المركزي للحملة، الرباط، المغرب" } as Bi,
};

export const axisById = (id: AxisId) => axes.find((a) => a.id === id)!;
export const engagementsOfAxis = (id: AxisId) => engagements.filter((e) => e.axis === id);

/** Programme complet injecté dans le prompt système de l'assistant. */
export const programContext = `
CANDIDAT : ${identity.candidate.fr} / ${identity.candidate.ar}
PARTI : ${identity.party.fr}
CIRCONSCRIPTION : ${identity.district.fr} / ${identity.district.ar}
SLOGAN : ${identity.slogan.fr} — ${identity.slogan.ar}
POSITIONNEMENT : ${identity.positioning.fr}

PARCOURS DU CANDIDAT : ${candidate.intro.fr}
${candidate.path.map((p) => `- ${p.year} : ${p.label.fr}`).join("\n")}
VALEURS : ${candidate.values.map((v) => v.fr).join(" ")}

AXES :
${axes.map((a) => `Axe ${a.number} — ${a.title.fr} (${a.title.ar}) : ${a.summary.fr} [chiffre clé : ${a.stat.value} — ${a.stat.label.fr}]`).join("\n")}

LES 25 ENGAGEMENTS :
${engagements
  .map(
    (e) => `Engagement ${e.n} (axe ${axisById(e.axis).number} — ${axisById(e.axis).title.fr}) : ${e.title.fr} / ${e.title.ar}
  Promesse : ${e.promise.fr} — ${e.promise.ar}
  Problème actuel : ${e.problem.fr}
  Proposition : ${e.proposal.fr}
  Bénéficiaires : ${e.beneficiaries.fr}
  Financement : ${e.funding.fr}
  Calendrier : ${e.calendar}
  Indicateur de réussite : ${e.indicator.fr}`,
  )
  .join("\n")}

LES 100 PREMIERS JOURS :
${firstHundredDays.map((d) => `${d.day} : ${d.title.fr} — ${d.detail.fr}`).join("\n")}

FINANCEMENT DU PROGRAMME :
${financing.items.map((i) => `${i.label.fr} : ${i.share} — ${i.detail.fr}`).join("\n")}
${financing.note.fr}

CONTACT : ${contact.email} — ${contact.phone} — ${contact.address.fr}
`.trim();
