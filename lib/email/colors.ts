// Valeurs hex extraites de la palette Akom — pour les templates email HTML.
// Les variables CSS ne fonctionnent pas dans les emails : on centralise ici
// les constantes équivalentes pour éviter les hex dispersés dans les templates.
export const emailColors = {
  // Marque
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryBg: '#eff6ff',

  // Sémantique
  success: '#16a34a',
  successBg: '#f0fdf4',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  destructive: '#dc2626',
  destructiveBg: '#fef2f2',
  info: '#0ea5e9',
  infoBg: '#f0f9ff',

  // Neutres
  foreground: '#0f172a',
  mutedForeground: '#6b7280',
  border: '#e5e7eb',
  background: '#ffffff',
  cardBg: '#f9fafb',
  mutedBg: '#f3f4f6',
} as const;

export type EmailColor = keyof typeof emailColors;
