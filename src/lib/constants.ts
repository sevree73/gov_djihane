import type { Role, SignalementStatus, SignalementCategory, ProjectStatus } from "@/generated/prisma";

export const SIGNALEMENT_CATEGORIES: Record<SignalementCategory, string> = {
  URBANISME: "Urbanisme",
  TRANSPORT: "Transport",
  ENVIRONNEMENT: "Environnement",
  VOIRIE: "Voirie",
  EAU: "Eau",
  DECHETS: "Déchets",
  EQUIPEMENTS_PUBLICS: "Équipements publics",
  SANTE: "Santé",
  EDUCATION: "Éducation",
};

export const SIGNALEMENT_STATUSES: Record<SignalementStatus, string> = {
  RECU: "Reçu",
  EN_COURS: "En cours de traitement",
  PRIS_EN_CHARGE: "Pris en charge",
  RESOLU: "Résolu",
  REJETE: "Rejeté",
};

export const PROJECT_STATUSES: Record<ProjectStatus, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  SUSPENDU: "Suspendu",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrateur",
  ADMIN_MINISTERE: "Administrateur Ministère",
  ADMIN_WILAYA: "Administrateur Wilaya",
  GESTIONNAIRE_TERRITORIAL: "Gestionnaire Territorial",
  AGENT_TECHNIQUE: "Agent Technique",
  CITOYEN: "Citoyen",
};

export const ADMIN_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ADMIN_MINISTERE",
  "ADMIN_WILAYA",
  "GESTIONNAIRE_TERRITORIAL",
  "AGENT_TECHNIQUE",
];

export const ALGERIAN_WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra",
  "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret",
  "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda",
  "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem",
  "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj",
  "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
  "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal",
  "Béni Abbès", "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair",
  "El Meniaa",
];
