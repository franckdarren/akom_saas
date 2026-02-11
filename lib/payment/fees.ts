// lib/payment/fees.ts

/**
 * Calcul des frais de transaction
 * 
 * ARCHITECTURE DES FRAIS:
 * - Les frais eBilling sont payés par le CLIENT
 * - La commission Akôm est payée par le CLIENT
 * - Le restaurant reçoit le montant exact de sa commande
 * - Akôm reçoit sa commission
 * - eBilling reçoit ses frais
 */

export interface TransactionFees {
    amount: number          // Montant de la commande (ce que le restaurant reçoit)
    fees: number           // Frais eBilling (payés par le client)
    totalToPay: number     // Montant total que le client paie (amount + fees)
}

export interface CommissionBreakdown {
    restaurantAmount: number    // Ce qui va au restaurant
    akomCommission: number      // Commission Akôm (X% du montant restaurant)
    transactionFees: number     // Frais eBilling
    totalPaid: number          // Total payé par le client
}

/**
 * Taux de commission Akôm sur les transactions
 * 
 * DÉCISION PRODUIT:
 * - 5% = bon équilibre entre rentabilité et attractivité
 * - Alternative: 3% si vous voulez être très compétitif
 * - Alternative: 7% si vous offrez beaucoup de valeur ajoutée
 */
export const AKOM_COMMISSION_RATE = 0.05 // 5%

/**
 * Calcule les frais de transaction selon l'opérateur
 * 
 * ⚠️ IMPORTANT: Ces pourcentages sont des ESTIMATIONS.
 * Contactez eBilling support pour obtenir votre grille tarifaire exacte.
 * 
 * Grille typique au Gabon:
 * - Airtel Money: 1,5% - 2,5%
 * - Moov Money: 1,5% - 2,5%
 * - Carte bancaire: 2,5% - 3,5%
 */
export function calculateTransactionFees(
    amount: number,
    operator: 'airtel' | 'moov' | 'card'
): TransactionFees {
    let feesPercentage: number

    switch (operator) {
        case 'airtel':
            feesPercentage = 0.02 // 2%
            break
        case 'moov':
            feesPercentage = 0.02 // 2%
            break
        case 'card':
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
 * Calcule la décomposition complète du paiement
 * 
 * Cette fonction calcule:
 * 1. Le montant qui revient au restaurant (orderAmount)
 * 2. La commission Akôm (X% du orderAmount)
 * 3. Les frais eBilling
 * 4. Le total que le client doit payer
 * 
 * Exemple pour une commande de 10 000 FCFA:
 * - Restaurant reçoit: 10 000 FCFA
 * - Commission Akôm (5%): 500 FCFA
 * - Frais eBilling (2%): 210 FCFA (2% de 10 500)
 * - Client paie: 10 710 FCFA
 */
export function calculateCommissionBreakdown(
    orderAmount: number,
    operator: 'airtel' | 'moov' | 'card'
): CommissionBreakdown {
    // 1. Commission Akôm (5% du montant de la commande)
    const akomCommission = Math.ceil(orderAmount * AKOM_COMMISSION_RATE)
    
    // 2. Sous-total avant frais eBilling
    const subtotalBeforeFees = orderAmount + akomCommission
    
    // 3. Frais eBilling (% du sous-total)
    const { fees: transactionFees } = calculateTransactionFees(
        subtotalBeforeFees,
        operator
    )
    
    // 4. Total final
    const totalPaid = orderAmount + akomCommission + transactionFees

    return {
        restaurantAmount: orderAmount,
        akomCommission,
        transactionFees,
        totalPaid,
    }
}

/**
 * Formate la décomposition pour affichage client
 */
export function formatCommissionBreakdown(breakdown: CommissionBreakdown): string {
    return [
        `Commande: ${breakdown.restaurantAmount.toLocaleString()} FCFA`,
        `Frais service: ${breakdown.akomCommission.toLocaleString()} FCFA`,
        `Frais transaction: ${breakdown.transactionFees.toLocaleString()} FCFA`,
        `─────────────────`,
        `TOTAL: ${breakdown.totalPaid.toLocaleString()} FCFA`
    ].join('\n')
}

/**
 * Version courte pour affichage simple
 */
export function formatShortBreakdown(breakdown: CommissionBreakdown): string {
    return `${breakdown.restaurantAmount} + ${breakdown.akomCommission + breakdown.transactionFees} = ${breakdown.totalPaid} FCFA`
}