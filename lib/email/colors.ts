// Valeurs hex extraites de la palette Akom — pour les templates email HTML.
// Les variables CSS ne fonctionnent pas dans les emails : on centralise ici
// les constantes équivalentes pour éviter les hex dispersés dans les templates.
export const emailColors = {
  // Marque — couleurs exactes du logo Akôm
  primary: '#3b82f6', // accent Ô du logo (blue-500)
  primaryDark: '#2563eb', // blue-600
  primaryBg: '#eff6ff', // blue-50

  // Sémantique
  success: '#16a34a',
  successBg: '#f0fdf4',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  destructive: '#dc2626',
  destructiveBg: '#fef2f2',
  info: '#0ea5e9',
  infoBg: '#f0f9ff',

  // Neutres — base slate, famille chromatique du navy #0f172a du logo
  foreground: '#0f172a', // slate-900 — navy du logo
  mutedForeground: '#64748b', // slate-500
  border: '#e2e8f0', // slate-200
  background: '#ffffff', // blanc du logo
  cardBg: '#f8fafc', // slate-50
  mutedBg: '#f1f5f9', // slate-100
} as const;

export type EmailColor = keyof typeof emailColors;
