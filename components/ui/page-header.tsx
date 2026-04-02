import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface PageHeaderProps {
  /** Texte du h1 — utilise type-page-title automatiquement */
  title: string
  /** Description courte sous le titre */
  description?: ReactNode
  /**
   * Élément affiché inline à droite du titre (badge de quota,
   * indicateur, etc.). Rendu dans un flex items-center gap-3 avec le h1.
   */
  titleBadge?: ReactNode
  /**
   * Slot droit (bouton, menu, filtre…). Sur mobile : passe en dessous
   * du titre. Sur md+ : aligné en face du bloc titre.
   */
  action?: ReactNode
  className?: string
}

/**
 * Header de page standard pour le dashboard Akôm.
 *
 * Gère le layout responsive : flex-col sur mobile,
 * flex-row sur md+ quand une action est présente.
 *
 * @example Titre seul
 * <PageHeader title="Commandes" />
 *
 * @example Titre + description
 * <PageHeader
 *   title="Commandes"
 *   description="Gérez les commandes en temps réel"
 * />
 *
 * @example Titre + description + bouton
 * <PageHeader
 *   title="Produits"
 *   description="Gérez votre catalogue"
 *   action={<Button>Nouveau produit</Button>}
 * />
 *
 * @example Titre + badge quota inline
 * <PageHeader
 *   title="Catégories"
 *   description="Organisez votre catalogue"
 *   titleBadge={<Badge variant="outline">3/10</Badge>}
 *   action={<CreateCategoryDialog />}
 * />
 */
export function PageHeader({
  title,
  description,
  titleBadge,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        action && "md:flex-row md:items-start md:justify-between",
        className
      )}
    >
      <div>
        <div className={cn(titleBadge && "flex items-center gap-3")}>
          <h1 className="type-page-title">{title}</h1>
          {titleBadge}
        </div>
        {description && (
          <p className="type-description mt-1">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
