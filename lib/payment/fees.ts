// lib/payment/fees.ts

/**
 * Calcul des frais de transaction
 * 
 * Les frais de transaction sont calculés selon l'opérateur et le montant.
 * Ils sont TOUJOURS à la charge du client, jamais du restaurant ni d'Akôm.
 */

export interface TransactionFees {
    amount: number          // Montant initial
    fees: number           // Frais de transaction
    totalToPay: number     // Montant total (amount + fees)
}

/**
 * Calcule les frais de transaction selon l'opérateur
 * 
 * IMPORTANT: Ces pourcentages sont des estimations basées sur les pratiques
 * courantes au Gabon. Vous devez les ajuster selon vos accords réels avec eBilling.
 * 
 * Contactez le support eBilling pour obtenir votre grille tarifaire exacte.
 */
export function calculateTransactionFees(
    amount: number,
    operator: 'airtel' | 'moov' | 'card'
): TransactionFees {
    let feesPercentage: number

    switch (operator) {
        case 'airtel':
            // Airtel Money facture généralement entre 1,5% et 2%
            feesPercentage = 0.02 // 2%
            break
        case 'moov':
            // Moov Money facture généralement entre 1,5% et 2%
            feesPercentage = 0.02 // 2%
            break
        case 'card':
            // Les paiements par carte ont des frais plus élevés (2,5% à 3,5%)
            feesPercentage = 0.03 // 3%
            break
        default:
            feesPercentage = 0.02
    }

    const fees = Math.ceil(amount * feesPercentage)
    const totalToPay = amount + fees

    return {
        amount,
        fees,
        totalToPay,
    }
}

/**
 * Formate les frais pour l'affichage
 */
export function formatFeesBreakdown(fees: TransactionFees): string {
    return `Montant: ${fees.amount} FCFA + Frais: ${fees.fees} FCFA = Total: ${fees.totalToPay} FCFA`
}