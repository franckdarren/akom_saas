import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  /** Icône Lucide affichée au-dessus du titre (optionnelle). */
  icon?: LucideIcon
  /** Message principal (ligne mise en avant). */
  title: string
  /** Texte secondaire atténué (optionnel). */
  description?: string
  /** Action optionnelle (bouton, lien) affichée sous le texte. */
  action?: React.ReactNode
  className?: string
}

/**
 * État vide harmonisé pour les listes, tableaux et graphiques sans données.
 * À placer dans un `CardContent`, une `TableCell` (colSpan) ou en standalone.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('layout-empty-state', className)}>
      {Icon && <Icon className="h-10 w-10 text-muted-foreground/50" />}
      <p className="type-body font-medium">{title}</p>
      {description && (
        <p className="type-body-muted max-w-sm">{description}</p>
      )}
      {action}
    </div>
  )
}
