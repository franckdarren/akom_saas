// lib/stock/costing.ts
// ============================================================
// Calcul du cout de revient (CUMP — cout unitaire moyen pondere)
// ------------------------------------------------------------
// Fonctions pures, sans dependance Prisma ni React : utilisees a la fois
// par la server action `adjustStock` (source de verite) et par le dialog
// d'ajustement pour l'apercu en temps reel. Une seule formule, donc aucun
// risque de divergence entre ce que l'utilisateur voit et ce qui est ecrit.
//
// Tous les montants sont en FCFA (entier, sans decimales).
// ============================================================

/**
 * Cout de revient unitaire d'une entree de stock :
 * prix d'achat unitaire + frais annexes ventiles au prorata de la quantite.
 *
 * Retourne null si l'entree n'est pas valorisee (aucun prix saisi).
 */
export function computeEntryUnitCost(
    purchasePrice: number | null,
    extraCosts: number | null,
    quantity: number
): number | null {
    if (purchasePrice === null || !Number.isFinite(purchasePrice)) return null
    if (quantity <= 0) return null

    const spread = extraCosts && extraCosts > 0 ? extraCosts / quantity : 0
    return Math.round(purchasePrice + spread)
}

/**
 * Cout de revient unitaire deduit d'un montant total deja paye
 * (cas d'une depense « achat marchandises » saisie en caisse : on connait le
 * decaissement et la quantite recue, pas le prix unitaire).
 */
export function computeUnitCostFromTotal(
    totalAmount: number | null,
    quantity: number
): number | null {
    if (totalAmount === null || !Number.isFinite(totalAmount) || totalAmount < 0) return null
    if (quantity <= 0) return null

    return Math.round(totalAmount / quantity)
}

/**
 * Nouveau CUMP apres une entree de stock.
 *
 * newAvg = (stock existant valorise au CUMP + valeur de l'entree) / quantite totale
 *
 * Cas particuliers :
 *   - aucun CUMP connu, ou stock actuel <= 0 → le CUMP devient le cout de l'entree
 *   - entree non valorisee (entryUnitCost null) → le CUMP existant est conserve
 */
export function computeNewAvgCost(
    currentQty: number,
    currentAvgCost: number | null,
    entryQty: number,
    entryUnitCost: number | null
): number | null {
    if (entryUnitCost === null || entryQty <= 0) return currentAvgCost
    if (currentAvgCost === null || currentQty <= 0) return entryUnitCost

    const totalValue = currentQty * currentAvgCost + entryQty * entryUnitCost
    const totalQty = currentQty + entryQty

    return Math.round(totalValue / totalQty)
}

/**
 * Marge unitaire et taux de marge a partir du prix de vente et du cout de revient.
 * Retourne null si l'un des deux est inconnu — on n'affiche jamais une marge devinee.
 */
export function computeMargin(
    sellingPrice: number | null,
    costPrice: number | null
): {amount: number; rate: number} | null {
    if (sellingPrice === null || costPrice === null) return null
    if (sellingPrice <= 0) return null

    const amount = sellingPrice - costPrice
    return {amount, rate: (amount / sellingPrice) * 100}
}

/**
 * Niveau de sante d'une marge, utilise pour choisir la couleur semantique.
 *   negative  → on vend a perte
 *   low       → marge inferieure a 15 %, a surveiller
 *   healthy   → marge confortable
 */
export type MarginLevel = 'negative' | 'low' | 'healthy'

export function getMarginLevel(rate: number): MarginLevel {
    if (rate < 0) return 'negative'
    if (rate < 15) return 'low'
    return 'healthy'
}

/** Valeur immobilisee d'une ligne de stock (quantite x cout de revient). */
export function computeStockValue(quantity: number, avgCost: number | null): number {
    if (avgCost === null) return 0
    return quantity * avgCost
}

export interface StockValuationRow {
    quantity: number
    avgCost: number | null
    sellingPrice: number | null
}

export interface StockValuation {
    /** Somme des quantites x cout de revient, sur les lignes valorisees. */
    totalValue: number
    /** Chiffre d'affaires potentiel si tout le stock valorise etait vendu. */
    potentialRevenue: number
    /** Taux de marge moyen pondere par la valeur, en %. null si rien de valorise. */
    averageMarginRate: number | null
    /** Nombre d'articles vendus a perte (prix de vente < cout de revient). */
    negativeMarginCount: number
    /** Nombre d'articles sans cout de revient renseigne. */
    unvaluedCount: number
}

/**
 * Agrege la valorisation d'un ensemble de lignes de stock.
 * Les lignes sans CUMP sont exclues des montants et comptees a part : mieux vaut
 * afficher "12 articles non valorises" qu'une valeur totale silencieusement fausse.
 */
export function computeStockValuation(rows: StockValuationRow[]): StockValuation {
    let totalValue = 0
    let potentialRevenue = 0
    let negativeMarginCount = 0
    let unvaluedCount = 0

    // Le taux de marge moyen ne se calcule que sur les lignes ayant a la fois un
    // cout de revient et un prix de vente — sinon le ratio compare des ensembles
    // differents au numerateur et au denominateur.
    let marginRevenueBase = 0
    let marginCostBase = 0

    for (const row of rows) {
        if (row.avgCost === null) {
            unvaluedCount++
            continue
        }

        totalValue += row.quantity * row.avgCost

        if (row.sellingPrice !== null) {
            potentialRevenue += row.quantity * row.sellingPrice
            marginRevenueBase += row.quantity * row.sellingPrice
            marginCostBase += row.quantity * row.avgCost
            if (row.sellingPrice < row.avgCost) negativeMarginCount++
        }
    }

    const averageMarginRate =
        marginRevenueBase > 0
            ? ((marginRevenueBase - marginCostBase) / marginRevenueBase) * 100
            : null

    return {
        totalValue,
        potentialRevenue,
        averageMarginRate,
        negativeMarginCount,
        unvaluedCount,
    }
}
