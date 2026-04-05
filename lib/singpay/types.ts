// lib/singpay/types.ts
// Types basés sur la documentation Swagger SingPay v1

/** Headers d'authentification OAuth 2.0 requis par toutes les requêtes SingPay */
export interface SingpayHeaders {
  'x-client-id': string
  'x-client-secret': string
  'x-wallet': string
  'Content-Type': string
}

/** Body pour POST /74/paiement (Airtel) et POST /62/paiement (Moov) */
export interface SingpayPaymentRequest {
  amount: number
  reference: string
  client_msisdn: string
  portefeuille: string
  disbursement?: string
  isTransfer?: boolean
}

/** Objet transaction retourné par SingPay */
export interface SingpayTransaction {
  status: string // 'Start' | 'Partenaire' | 'Terminate' | 'Disbursement' | 'Refund'
  result?: string // 'Success' | 'PasswordError' | 'BalanceError' | 'TimeOutError' | 'Error'
  isTransfer: boolean
  airtel_money_id?: string
  check: string
  _id: string
  amount: string
  client_msisdn: string
  id: string // Référence SingPay de la transaction
  reference: string // Notre référence unique
  updated_at: string
  created_at: string
  portefeuille: {
    id: string
    nom: string
    merchant_code: string
    merchant_msisdn: string
  }
}

/** Réponse de POST /74/paiement, /62/paiement et GET /transaction/api/status/{id} */
export interface SingpayPaymentResponse {
  transaction: SingpayTransaction
  status: {
    code: string
    message: string
    success: boolean
    result_code?: string
  }
}

/** Body pour POST /ext (interface de paiement externe SingPay) */
export interface SingpayExtRequest {
  portefeuille: string
  reference: string
  amount: number
  redirect_success: string
  redirect_error: string
  disbursement?: string
  logoURL?: string
  isTransfer?: boolean
}

/** Réponse de POST /ext */
export interface SingpayExtResponse {
  link: string
  exp: string
}

/** Payload reçu sur notre webhook callback (même shape que PaymentResponse) */
export type SingpayCallbackData = SingpayPaymentResponse
