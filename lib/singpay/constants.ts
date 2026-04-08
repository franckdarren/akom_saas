// lib/singpay/constants.ts

export const SINGPAY_CONFIG = {
  baseUrl: process.env.SINGPAY_BASE_URL || 'https://gateway.singpay.ga/v1',
  clientId: process.env.SINGPAY_CLIENT_ID!,
  clientSecret: process.env.SINGPAY_CLIENT_SECRET!,

  /** Wallet Akom pour recevoir les paiements d'abonnement */
  platformWalletId: process.env.SINGPAY_WALLET_ID!,

  /** Disbursement ID pour les paiements d'abonnement */
  platformDisbursementId: process.env.SINGPAY_DISBURSEMENT_ID!,

  /** Timeout pour les requêtes HTTP vers SingPay (30s) */
  requestTimeout: 30_000,

  /** Timeout pour la génération de lien externe /ext (60s — endpoint plus lent) */
  extRequestTimeout: 60_000,

  /** Intervalle de polling côté client (5s) */
  statusCheckInterval: 5_000,

  /** Nombre max de vérifications de statut (24 × 5s = 2min) */
  maxStatusChecks: 24,
} as const

export const SINGPAY_ENDPOINTS = {
  /** Paiement Airtel Money — USSD Push */
  airtelPayment: '/74/paiement',

  /** Paiement Moov Money — USSD Push */
  moovPayment: '/62/paiement',

  /** Vérifier le statut d'une transaction par ID */
  transactionStatus: (id: string) => `/transaction/api/status/${id}`,

  /** Rechercher une transaction par référence */
  transactionByReference: (ref: string) =>
    `/transaction/api/search/by-reference/${ref}`,

  /** Interface de paiement externe SingPay */
  externalPayment: '/ext',

  /** Détails d'un portefeuille */
  walletDetails: (id: string) => `/portefeuille/api/${id}`,
} as const
