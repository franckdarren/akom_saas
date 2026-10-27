import { cn } from '@/lib/utils'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'
type LogoVariant = 'color' | 'white' | 'dark'

interface LogoProps {
  size?: LogoSize
  variant?: LogoVariant
  className?: string
}

const heights: Record<LogoSize, number> = {
  sm: 20,
  md: 28,
  lg: 40,
  xl: 56,
}

// Couleurs par variante
// color  → AK+M suivent currentColor, Ô toujours en bleu primaire
// white  → tout blanc
// dark   → tout sombre
const variantColors: Record<LogoVariant, { base: string; accent: string }> = {
  color: { base: 'currentColor', accent: '#3b82f6' },
  white: { base: '#ffffff', accent: '#ffffff' },
  dark: { base: '#0f172a', accent: '#0f172a' },
}

// Wordmark vectorisé (tracés, pas de <text>) : rendu identique quel que soit
// l'OS ou les polices installées. Grille : capline y=30, ligne de base y=130,
// circonflexe entre y=2 et y=22.
const LETTERS_AKM =
  'M30 30H66L96 130H68L62 108H34L28 130H0ZM48 63L41 86H55Z' + // A
  'M112 30H138V72L170 30H202L160 80L204 130H172L138 92V130H112Z' + // K
  'M336 30H374L391 95L408 30H446V130H422V62L402 130H380L360 62V130H336Z' // M

const LETTER_O =
  'M270 28A50 52 0 1 0 270 132A50 52 0 1 0 270 28Z' +
  'M270 50A22 30 0 1 1 270 110A22 30 0 1 1 270 50Z' +
  'M244 22L260 2H280L296 22H278L270 12L262 22Z' // circonflexe

export function Logo({ size = 'md', variant = 'color', className }: LogoProps) {
  const h = heights[size]
  const { base, accent } = variantColors[variant]

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 446 132"
      height={h}
      aria-label="Akôm"
      role="img"
      className={cn('shrink-0', className)}
    >
      <path d={LETTERS_AKM} fill={base} fillRule="evenodd" />
      <path d={LETTER_O} fill={accent} fillRule="evenodd" />
    </svg>
  )
}
