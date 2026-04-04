// lib/singpay/client.ts

import { SINGPAY_CONFIG, SINGPAY_ENDPOINTS } from './constants'
import type {
  SingpayHeaders,
  SingpayPaymentRequest,
  SingpayPaymentResponse,
  SingpayTransaction,
} from './types'

/**
 * Client HTTP pour l'API SingPay.
 *
 * Gère l'authentification OAuth 2.0, les timeouts et la gestion d'erreurs.
 * Chaque restaurant utilise son propre walletId (passé dans les params),
 * tandis que clientId / clientSecret sont globaux à la plateforme Akôm.
 */
class SingpayClient {
  private baseUrl: string
  private clientId: string
  private clientSecret: string

  constructor() {
    this.baseUrl = SINGPAY_CONFIG.baseUrl
    this.clientId = SINGPAY_CONFIG.clientId
    this.clientSecret = SINGPAY_CONFIG.clientSecret
  }

  private getHeaders(walletId: string): Record<string, string> {
    return {
      'x-client-id': this.clientId,
      'x-client-secret': this.clientSecret,
      'x-wallet': walletId,
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit,
    walletId: string,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = this.getHeaders(walletId)

    console.log('[SingPay] Request:', {
      url,
      method: options.method,
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
      clientIdPrefix: this.clientId?.substring(0, 8) + '...',
    })

    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(SINGPAY_CONFIG.requestTimeout),
    })

    const responseText = await response.text()
    console.log('[SingPay] HTTP', response.status, responseText)

    if (!response.ok) {
      throw new Error(`SingPay API Error (${response.status}): ${responseText}`)
    }

    return JSON.parse(responseText) as T
  }

  /** Initie un paiement Airtel Money (USSD Push) — POST /74/paiement */
  async initiateAirtelPayment(
    params: SingpayPaymentRequest,
  ): Promise<SingpayPaymentResponse> {
    return this.request<SingpayPaymentResponse>(
      SINGPAY_ENDPOINTS.airtelPayment,
      { method: 'POST', body: JSON.stringify(params) },
      params.portefeuille,
    )
  }

  /** Initie un paiement Moov Money (USSD Push) — POST /62/paiement */
  async initiateMoovPayment(
    params: SingpayPaymentRequest,
  ): Promise<SingpayPaymentResponse> {
    return this.request<SingpayPaymentResponse>(
      SINGPAY_ENDPOINTS.moovPayment,
      { method: 'POST', body: JSON.stringify(params) },
      params.portefeuille,
    )
  }

  /** Vérifie le statut d'une transaction — GET /transaction/api/status/{id} */
  async getTransactionStatus(
    transactionId: string,
    walletId: string,
  ): Promise<SingpayPaymentResponse> {
    return this.request<SingpayPaymentResponse>(
      SINGPAY_ENDPOINTS.transactionStatus(transactionId),
      { method: 'GET' },
      walletId,
    )
  }

  /** Recherche une transaction par référence — GET /transaction/api/search/by-reference/{ref} */
  async getTransactionByReference(
    reference: string,
    walletId: string,
  ): Promise<SingpayTransaction> {
    return this.request<SingpayTransaction>(
      SINGPAY_ENDPOINTS.transactionByReference(reference),
      { method: 'GET' },
      walletId,
    )
  }
}

/** Instance singleton — les credentials sont globaux à la plateforme */
export const singpayClient = new SingpayClient()
