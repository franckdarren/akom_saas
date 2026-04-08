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

export function Logo({ size = 'md', variant = 'color', className }: LogoProps) {
  const h = heights[size]
  const { base, accent } = variantColors[variant]

  // viewBox : origin décalée à y=-10 pour laisser de la place au circumflex
  // qui dépasse au-dessus de la capline (~5-8px selon le font).
  // Hauteur totale rendue = 10 (marge haute) + 28 (font-size) = 38px
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -10 120 38"
      height={h}
      aria-label="Akôm"
      role="img"
      className={cn('shrink-0', className)}
    >
      <text
        x="0"
        y="23"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontWeight="900"
        fontSize="28"
        letterSpacing="3"
        fill={base}
      >
        AK
        <tspan fill={accent}>Ô</tspan>
        M
      </text>
    </svg>
  )
}
