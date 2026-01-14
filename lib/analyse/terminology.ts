/**
 * Terminologie simplifiée pour le grand public
 *
 * Ce fichier centralise les explications des termes techniques
 * utilisés dans l'analyse financière des produits scellés Pokémon
 */

export type TerminologyKey =
  | "premium"
  | "premiumNow"
  | "return7d"
  | "return30d"
  | "volatility"
  | "maxDrawdown"
  | "coverage"
  | "freshness"
  | "score"
  | "slope"
  | "index"
  | "ispfr"
  | "retail";

export type TermDefinition = {
  simple: string; // Terme simple pour le grand public
  technical: string; // Terme technique original
  explanation: string; // Explication détaillée
  example?: string; // Exemple concret
};

export const TERMINOLOGY: Record<TerminologyKey, TermDefinition> = {
  premium: {
    simple: "Surcote",
    technical: "Premium",
    explanation:
      "La différence entre le prix actuel du produit et son prix de vente initial (retail). Une surcote de +30% signifie que le produit vaut 30% de plus que son prix de sortie.",
    example: "Un Display sorti à 100€ qui vaut maintenant 130€ a une surcote de +30%",
  },

  premiumNow: {
    simple: "Surcote actuelle",
    technical: "Premium Now",
    explanation:
      "Le pourcentage d'augmentation (ou de diminution) du prix actuel par rapport au prix de vente initial. C'est l'indicateur principal pour savoir si un produit s'est valorisé.",
    example: "Surcote de +45% = le produit vaut 45% de plus qu'à sa sortie",
  },

  return7d: {
    simple: "Variation 7 jours",
    technical: "Return 7d",
    explanation:
      "L'évolution du prix sur les 7 derniers jours. Un chiffre positif indique une hausse, un chiffre négatif une baisse.",
    example: "+5% = le prix a augmenté de 5% cette semaine",
  },

  return30d: {
    simple: "Variation 30 jours",
    technical: "Return 30d",
    explanation:
      "L'évolution du prix sur les 30 derniers jours. Permet de voir la tendance sur le dernier mois.",
    example: "-3% = le prix a baissé de 3% ce mois-ci",
  },

  volatility: {
    simple: "Stabilité du prix",
    technical: "Volatilité",
    explanation:
      "Mesure la régularité des variations de prix. Une faible volatilité indique un prix stable, une forte volatilité indique des fluctuations importantes.",
    example:
      "Faible volatilité = prix stable autour de 100€. Forte volatilité = prix qui varie entre 80€ et 120€",
  },

  maxDrawdown: {
    simple: "Plus forte baisse",
    technical: "Max Drawdown",
    explanation:
      "La plus importante chute de prix observée récemment. Indique le risque de baisse maximum constaté.",
    example: "Max Drawdown de -15% = le prix a chuté jusqu'à 15% à un moment donné",
  },

  coverage: {
    simple: "Fiabilité des données",
    technical: "Coverage",
    explanation:
      "Pourcentage de jours avec des données de prix sur la période analysée. Plus le coverage est élevé, plus les analyses sont fiables.",
    example: "90% = des prix disponibles pour 27 jours sur 30",
  },

  freshness: {
    simple: "Fraîcheur",
    technical: "Freshness",
    explanation:
      "Nombre de jours écoulés depuis la dernière mise à jour des prix. Une fraîcheur de 0-2 jours est idéale.",
    example: "2 jours = le dernier prix date d'il y a 2 jours",
  },

  score: {
    simple: "Note Scalpia",
    technical: "Score Composite",
    explanation:
      "Note globale de 0 à 100 calculée à partir de plusieurs critères (surcote, tendance, stabilité, fiabilité). Plus le score est élevé, plus le produit est attractif.",
    example: "Score de 85/100 = très bon investissement potentiel",
  },

  slope: {
    simple: "Tendance de fond",
    technical: "Slope",
    explanation:
      "La direction générale du prix sur le moyen terme (30 jours). Positive = tendance haussière, négative = tendance baissière.",
    example: "Slope positive = le prix monte progressivement depuis 1 mois",
  },

  index: {
    simple: "Indice",
    technical: "Index",
    explanation:
      "Une valeur agrégée qui représente l'évolution d'un ensemble de produits. Permet de suivre le marché dans sa globalité.",
    example: "L'indice passe de 100 à 120 = le marché a progressé de 20%",
  },

  ispfr: {
    simple: "ISP-FR",
    technical: "Index du Scellé Pokémon FR",
    explanation:
      "Indicateur global qui suit l'évolution du marché français des produits scellés Pokémon. Base 100 au 1er janvier 2023. C'est le baromètre de référence pour le marché.",
    example: "ISP-FR à 127 = le marché a progressé de 27% depuis janvier 2023",
  },

  retail: {
    simple: "Prix de sortie",
    technical: "Retail Price",
    explanation:
      "Le prix de vente conseillé lors de la sortie du produit. Sert de référence pour calculer la surcote.",
    example: "Un ETB sorti à 59,99€ = prix retail",
  },
};

/**
 * Obtenir l'explication simplifiée d'un terme
 */
export function getTermExplanation(key: TerminologyKey): TermDefinition {
  return TERMINOLOGY[key];
}

/**
 * Obtenir le terme simple à afficher au grand public
 */
export function getSimpleTerm(key: TerminologyKey): string {
  return TERMINOLOGY[key].simple;
}

/**
 * Obtenir le terme technique
 */
export function getTechnicalTerm(key: TerminologyKey): string {
  return TERMINOLOGY[key].technical;
}
