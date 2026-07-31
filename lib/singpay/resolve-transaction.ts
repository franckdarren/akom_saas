// lib/singpay/resolve-transaction.ts

import { singpayClient } from './client'
import type { SingpayTransaction } from './types'

/**
 * Résout une transaction SingPay, que l'on dispose de son ID ou seulement
 * de notre référence.
 *
 * Les paiements initiés via le lien externe (POST /ext) n'ont pas de
 * transactionId : SingPay ne le retourne pas à la génération du lien. Sans
 * résolution par référence, ces paiements ne peuvent jamais être confirmés,
 * ni par le webhook ni par le polling.
 */

export interface ResolvedTransaction {
  transaction: SingpayTransaction
  /** true si la transaction a été retrouvée par référence (et non par ID) */
  resolvedByReference: boolean
}

/** Vérifie qu'une valeur inconnue est une transaction SingPay exploitable. */
function isSingpayTransaction(value: unknown): value is SingpayTransaction {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.status === 'string' && typeof candidate.reference === 'string'
  )
}

/**
 * Normalise la réponse de GET /transaction/api/search/by-reference/{ref}.
 *
 * La forme exacte n'est pas garantie : selon les endpoints, l'API SingPay
 * retourne soit la transaction brute, soit un objet { transaction, status },
 * soit une liste. Les trois formes sont acceptées.
 */
function normalizeByReference(payload: unknown): SingpayTransaction | null {
  if (isSingpayTransaction(payload)) return payload

  if (Array.isArray(payload)) {
    const first = payload.find(isSingpayTransaction)
    return first ?? null
  }

  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>

    if (isSingpayTransaction(record.transaction)) return record.transaction
    if (record.data !== undefined) return normalizeByReference(record.data)
  }

  return null
}

/**
 * Récupère l'état autoritatif d'une transaction auprès de SingPay.
 *
 * Utilise l'ID quand il est connu, sinon retombe sur la recherche par
 * référence. Retourne null si SingPay ne reconnaît pas la transaction
 * (paiement jamais finalisé sur la page externe, par exemple).
 *
 * Les erreurs réseau / HTTP remontent en exception : l'appelant décide
 * s'il doit échouer en fail-closed.
 */
export async function resolveSingpayTransaction(params: {
  transactionId?: string | null
  reference?: string | null
  walletId: string
}): Promise<ResolvedTransaction | null> {
  const { transactionId, reference, walletId } = params

  if (transactionId) {
    const result = await singpayClient.getTransactionStatus(transactionId, walletId)
    if (!result.status.success || !isSingpayTransaction(result.transaction)) {
      return null
    }
    return { transaction: result.transaction, resolvedByReference: false }
  }

  if (!reference) return null

  const payload = await singpayClient.getTransactionByReference(reference, walletId)
  const transaction = normalizeByReference(payload)

  return transaction ? { transaction, resolvedByReference: true } : null
}
