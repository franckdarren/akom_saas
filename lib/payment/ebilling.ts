// lib/payment/ebilling.ts - VERSION CORRIGÉE

interface EBillingConfig {
    username: string
    sharedKey: string
    baseUrl: string
}

interface CreateBillParams {
    payerMsisdn: string
    payerEmail: string
    payerName: string
    amount: number
    externalReference: string
    shortDescription: string
    expiryPeriod?: number
}

interface EBillingResponse {
    success: boolean
    billId?: string
    error?: string
    data?: any
}

/**
 * Classe EBillingService - Modifiée pour accepter une config optionnelle
 * 
 * Cette version permet de créer des instances avec des configurations
 * différentes, ce qui est essentiel pour gérer les paiements de commandes
 * où chaque restaurant a ses propres identifiants eBilling.
 */
export class EBillingService {
    private config: EBillingConfig

    /**
     * Constructeur qui accepte maintenant une configuration optionnelle
     * 
     * Si aucune config n'est fournie, on utilise celle d'Akôm depuis les
     * variables d'environnement. Si une config est fournie, on l'utilise
     * (cas des paiements de commandes avec les identifiants du restaurant).
     */
    constructor(customConfig?: Partial<EBillingConfig>) {
        this.config = {
            username: customConfig?.username || process.env.EBILLING_USERNAME!,
            sharedKey: customConfig?.sharedKey || process.env.EBILLING_SHARED_KEY!,
            baseUrl: customConfig?.baseUrl || process.env.EBILLING_BASE_URL || 'https://lab.billing-easy.net',
        }
    }

    async createBill(params: CreateBillParams): Promise<EBillingResponse> {
        try {
            const requestBody = {
                payer_msisdn: params.payerMsisdn,
                payer_email: params.payerEmail,
                payer_name: params.payerName,
                amount: params.amount.toString(),
                external_reference: params.externalReference,
                short_description: params.shortDescription,
                expiry_period: (params.expiryPeriod || 60).toString(),
            }

            const auth = Buffer.from(
                `${this.config.username}:${this.config.sharedKey}`
            ).toString('base64')

            const response = await fetch(
                `${this.config.baseUrl}/api/v1/merchant/e_bills`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Basic ${auth}`,
                    },
                    body: JSON.stringify(requestBody),
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                return {
                    success: false,
                    error: errorData.message || 'Erreur lors de la création de la facture',
                }
            }

            const data = await response.json()
            const billId = data.e_bill?.bill_id

            if (!billId) {
                return {
                    success: false,
                    error: 'bill_id manquant dans la réponse eBilling',
                }
            }

            return {
                success: true,
                billId,
                data,
            }
        } catch (error) {
            console.error('Erreur eBilling createBill:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            }
        }
    }

    async sendUssdPush(
        billId: string,
        payerMsisdn: string,
        operator: 'airtelmoney' | 'moovmoney4'
    ): Promise<EBillingResponse> {
        try {
            const auth = Buffer.from(
                `${this.config.username}:${this.config.sharedKey}`
            ).toString('base64')

            const response = await fetch(
                `${this.config.baseUrl}/api/v1/merchant/e_bills/${billId}/ussd_push`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Basic ${auth}`,
                    },
                    body: JSON.stringify({
                        payer_msisdn: payerMsisdn,
                        payment_system_name: operator,
                    }),
                }
            )

            const data = await response.json()

            if (!response.ok || data.message !== 'Accepted') {
                return {
                    success: false,
                    error: 'Échec de l\'envoi du push USSD',
                }
            }

            return {
                success: true,
                data,
            }
        } catch (error) {
            console.error('Erreur eBilling sendUssdPush:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            }
        }
    }

    getPaymentPortalUrl(billId: string, callbackUrl: string): string {
        const baseUrl = this.config.baseUrl.replace('lab', 'test')
        return `${baseUrl}?invoice=${billId}&redirect_url=${encodeURIComponent(callbackUrl)}`
    }

    getCardPaymentUrl(billId: string, callbackUrl: string): string {
        const baseUrl = this.config.baseUrl.replace('lab', 'test')
        return `${baseUrl}?invoice=${billId}&operator=ORABANK_NG&redirect=${encodeURIComponent(callbackUrl)}`
    }
}

/**
 * Instance singleton pour les paiements Akôm (abonnements)
 * Cette instance utilise les identifiants d'Akôm depuis les variables d'environnement
 */
export const ebilling = new EBillingService()