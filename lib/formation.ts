// lib/formation.ts — le contenu des modules, en UN SEUL ENDROIT.
//
// Pourquoi ce fichier existe : les titres et le contenu etaient dupliques dans
// app/formation/page.tsx (titres seuls) et app/formation/modules/[id]/page.tsx
// (titres + contenu). Deux sources de verite pour le meme contenu : la premiere
// correction oubliee fait diverger les deux.
//
// Regle : un module s'edite ICI, et nulle part ailleurs.

export type ModuleFormation = {
  id: number;
  titre: string;
  accroche: string;
  contenu: string[];
  quiz: QuizQuestion[];
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correct: number;
};

export const TITRE_FORMATION =
  'Lancer votre activité de micro-entrepreneur — le parcours en 5 étapes';

export const SOUS_TITRE_FORMATION =
  'Chaque étape s’appuie sur les seuils, taux et obligations publiés sur ce site. Les chiffres cités viennent de la base, pas d’une mémoire.';

export const INTRODUCTION_FORMATION = [
  'Ce parcours part d’un constat : le régime de la micro-entreprise est simple à comprendre et facile à faire dysfonctionner.',
  'Les seuils de chiffre d’affaires, les taux de cotisations et les règles de TVA sont publiés ici, valeur par valeur, avec leur source officielle.',
  'Chaque module se termine par un quiz. Les réponses ne sont jamais enregistrées : le score reste sur votre appareil.',
];

export const MODULES: ModuleFormation[] = [
  {
    id: 1,
    titre: 'Choisir son activité et vérifier son seuil',
    accroche: 'Tout commence par la catégorie d’activité : c’est elle qui détermine le seuil de chiffre d’affaires et le taux de cotisations.',
    contenu: [
      'Objectif : savoir exactement où vous vous situez avant de déclarer quoi que ce soit.',
      '',
      'Étape 1 — Identifier la catégorie (10 min)',
      'Vente de marchandises, prestations de service (BIC), prestations de service (BNC) ou profession libérale réglementée.',
      'C’est la catégorie qui pilote le seuil ET le taux : se tromper de catégorie, c’est se tromper sur les deux.',
      '',
      'Étape 2 — Lire le bon seuil (15 min)',
      'Le seuil s’entend en chiffre d’affaires HT annuel. Il est revalorisé chaque année : la valeur publiée ici est celle de l’année de référence, avec sa date.',
      'Dépassement : le régime cesse si le seuil est franchi deux années consécutives. Une seule année de dépassement ne fait pas perdre le régime.',
      '',
      'Étape 3 — Vérifier le seuil de TVA (10 min)',
      'Franchise en base de TVA : un seuil de base et un seuil majoré, différents par catégorie. Les deux ne déclenchent pas la même conséquence.',
      '',
      'Exercice : écrivez en une phrase votre catégorie d’activité et le seuil qui s’y applique.',
    ],
    quiz: [
      {
        question: 'Qu’est-ce qui détermine à la fois le seuil de chiffre d’affaires et le taux de cotisations ?',
        options: ['Le chiffre d’affaires de l’année précédente', 'La catégorie d’activité', 'Le lieu d’exercice', 'L’âge du dirigeant'],
        correct: 1,
      },
      {
        question: 'Le régime de la micro-entreprise est perdu lorsque le seuil est dépassé…',
        options: ['Dès la première année de dépassement', 'Après deux années consécutives de dépassement', 'Après trois années', 'Jamais'],
        correct: 1,
      },
      {
        question: 'Comment s’entend le seuil de chiffre d’affaires ?',
        options: ['Net de cotisations', 'Hors taxes (HT) annuel', 'En chiffre d’affaires trimestriel', 'En bénéfice'],
        correct: 1,
      },
    ],
  },
  {
    id: 2,
    titre: 'Déclarer et payer ses cotisations',
    accroche: 'Le taux de cotisations s’applique au chiffre d’affaires déclaré. Aucune cotisation n’est due si le chiffre d’affaires est nul.',
    contenu: [
      'Objectif : déclarer juste, ni trop ni trop peu.',
      '',
      'Étape 1 — Connaître son taux (5 min)',
      'Le taux dépend de la catégorie. Il est publié ici avec la source qui le porte : il change, et c’est précisément ce que ce site conserve.',
      '',
      'Étape 2 — Déclarer (20 min)',
      'La déclaration se fait en ligne, mensuellement ou trimestriellement selon l’option choisie. Un chiffre d’affaires nul doit être déclaré comme nul : ne pas déclarer du tout n’est pas équivalent.',
      '',
      'Étape 3 — Comprendre le versement libératoire (15 min)',
      'Option : l’Urssaf collecte l’impôt sur le revenu en même temps que les cotisations. Le taux est publié ici, ainsi que le seuil de revenu qui ouvre droit à l’exonération.',
      '',
      'Point de vigilance : le taux de cotisations n’est pas un pourcentage du bénéfice, c’est un pourcentage du chiffre d’affaires.',
      '',
      'Exercice : calculez le montant de cotisations correspondant à 10 000 € de chiffre d’affaires dans votre catégorie.',
    ],
    quiz: [
      {
        question: 'Le taux de cotisations s’applique à quoi ?',
        options: ['Au bénéfice', 'Au chiffre d’affaires déclaré', 'Aux revenus du foyer', 'Au chiffre d’affaires de l’année précédente'],
        correct: 1,
      },
      {
        question: 'Que doit-on déclarer si le chiffre d’affaires est nul ?',
        options: ['Rien du tout', 'Un chiffre d’affaires nul', 'Une estimation', 'On peut sauter un mois'],
        correct: 1,
      },
      {
        question: 'Qu’est-ce que le versement libératoire ?',
        options: ['Une remise sur les cotisations', 'L’Urssaf collecte l’impôt en même temps que les cotisations', 'Un impôt supplémentaire', 'Une exemption de TVA'],
        correct: 1,
      },
    ],
  },
  {
    id: 3,
    titre: 'Gérer la TVA et la facturation',
    accroche: 'La franchise en base de TVA a deux seuils, et ils ne produisent pas la même conséquence.',
    contenu: [
      'Objectif : facturer correctement, et savoir quand la TVA devient due.',
      '',
      'Étape 1 — Les deux seuils (10 min)',
      'Seuil de base et seuil majoré, par catégorie. Le franchissement du seuil de base fait perdre la franchise au 1er janvier de l’année suivante ; le franchissement du seuil majoré la fait perdre dès le jour du dépassement.',
      'Les deux valeurs sont publiées ici, distinctes : les confondre produit une erreur de facturation.',
      '',
      'Étape 2 — La mention sur la facture (10 min)',
      'En franchise, la facture porte une mention obligatoire. La base légale de cette mention change au 1er janvier 2027 (recodification de la TVA) : la date et l’article sont publiés dans le changelog.',
      '',
      'Étape 3 — Se préparer à la TVA (20 min)',
      'Passer à la TVA, c’est ajouter la taxe au prix de vente, la déclarer et la reverser. Le faire avant le dépassement évite de le découvrir en cours d’année.',
      '',
      'Exercice : pour votre catégorie, notez les deux seuils et la date à partir de laquelle la franchise cesse dans chaque cas.',
    ],
    quiz: [
      {
        question: 'Que se passe-t-il quand le seuil de franchise majoré est franchi ?',
        options: ['Rien avant l’année suivante', 'La franchise cesse dès le jour du dépassement', 'La franchise est prolongée', 'Le taux de TVA baisse'],
        correct: 1,
      },
      {
        question: 'Quand la franchise cesse-t-elle si seul le seuil de base est dépassé ?',
        options: ['Immédiatement', 'Au 1er janvier de l’année suivante', 'Après deux ans', 'Jamais'],
        correct: 1,
      },
      {
        question: 'Que devient la mention de franchise sur les factures au 1er janvier 2027 ?',
        options: ['Elle disparaît', 'La base légale change d’article', 'Elle devient facultative', 'Elle est remplacée par la TVA'],
        correct: 1,
      },
    ],
  },
  {
    id: 4,
    titre: 'ACRE et taux réduits : les dispositifs qui changent le taux',
    accroche: 'ACRE et taux réduits DROM modifient le taux appliqué. Ce ne sont pas des options : ce sont des conditions.',
    contenu: [
      'Objectif : savoir si un dispositif s’applique à votre situation, et avec quel taux.',
      '',
      'Étape 1 — L’ACRE (20 min)',
      'Exonération de début d’activité, avec un taux minoré qui s’applique pendant plusieurs années. Le taux minoré a changé au 1er juillet 2026 : l’ancienne valeur et la nouvelle sont toutes deux publiées ici, avec la date du changement.',
      'Conditions : un seuil de revenu et une demande à déposer dans un délai précis.',
      '',
      'Étape 2 — Les taux réduits DROM (15 min)',
      'Guadeloupe, Martinique, Guyane, La Réunion, Saint-Barthélemy, Saint-Martin : taux réduits dégressifs sur plusieurs années. Mayotte relève d’un régime distinct.',
      'Les taux sont publiés par période, pas en une seule valeur : les lire tous ensemble donne un chiffre qui n’existe pas.',
      '',
      'Étape 3 — Cumuler ? (10 min)',
      'Le cumul ACRE + DROM n’est pas tranché par les sources officielles consultées : la question est publiée dans les lacunes connues, plutôt que tranchée à tort.',
      '',
      'Exercice : pour votre situation, dites quel taux s’applique et quelle en est la source.',
    ],
    quiz: [
      {
        question: 'L’ACRE est…',
        options: ['Une option tarifaire', 'Une exonération de début d’activité sous conditions', 'Une réduction de TVA', 'Un dispositif réservé au DROM'],
        correct: 1,
      },
      {
        question: 'Que publie ce site sur les taux réduits DROM ?',
        options: ['Une seule valeur moyenne', 'Les taux par période, avec la source', 'Rien', 'Uniquement Mayotte'],
        correct: 1,
      },
      {
        question: 'Que dit le site sur le cumul ACRE et taux réduits DROM ?',
        options: ['Qu’ils se cumulent toujours', 'Que le cumul est impossible', 'Que la question est non tranchée par les sources officielles', 'Qu’il faut demander à son comptable'],
        correct: 2,
      },
    ],
  },
  {
    id: 5,
    titre: 'Tenir le cap : contrôles, historique et veille',
    accroche: 'Les paramètres changent chaque année. Ce qui fait la valeur d’un chiffre, c’est de savoir quand il a changé et pourquoi.',
    contenu: [
      'Objectif : mettre en place une routine qui vous évite de travailler sur une valeur périmée.',
      '',
      'Étape 1 — Lire l’historique avant de recalculer (15 min)',
      'Pour recalculer une situation d’une année antérieure, il faut le seuil de cette année-là, pas celui d’aujourd’hui. L’historique 2022 à 2026 est publié ici, avec la source.',
      '',
      'Étape 2 — Lire le changelog avant de conclure (10 min)',
      'Le changelog liste les changements datés, avec la valeur d’avant, celle d’après et la raison. C’est ce que les pages officielles ne conservent pas.',
      '',
      'Étape 3 — Mettre en place une veille légère (15 min)',
      'Un contrôle une fois par an, à date connue, suffit : lire le changelog et vérifier que les valeurs de votre catégorie n’ont pas bougé.',
      'Les changements à venir sont annoncés dans le changelog, avec leur date d’entrée en vigueur.',
      '',
      'Étape 4 — Réutiliser les données (10 min)',
      'L’API JSON et l’export CSV sont gratuits, sans clé. Si vous tenez un outil de facturation ou de simulation, branchez-le sur l’API plutôt que de recopier les valeurs.',
      '',
      'Exercice : repérez la dernière ligne du changelog et dites ce qu’elle annonce.',
    ],
    quiz: [
      {
        question: 'Pour recalculer une situation de 2024, quel seuil faut-il utiliser ?',
        options: ['Celui de 2026', 'Celui de 2024, publié dans l’historique', 'La moyenne des deux', 'Le plus haut'],
        correct: 1,
      },
      {
        question: 'Que contient le changelog ?',
        options: ['Uniquement les valeurs actuelles', 'Les changements datés, avant / après et la raison', 'Des prévisions sans source', 'Rien'],
        correct: 1,
      },
      {
        question: 'Quelle est la bonne routine de veille ?',
        options: ['Aucune, les valeurs ne changent jamais', 'Un contrôle annuel du changelog', 'Recopier les valeurs chaque mois', 'Se fier au bouche-à-oreille'],
        correct: 1,
      },
    ],
  },
];

export function trouverModule(id: number): ModuleFormation | undefined {
  return MODULES.find((m) => m.id === id);
}
