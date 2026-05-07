// lib/config/order-status.ts
// ============================================================
// Source de vérité pour le flux des statuts de commande,
// les icônes et les couleurs — adapté par type d'activité.
//
// Aucun import React ici (pure logique + icônes Lucide
// utilisables côté serveur comme côté client).
// ============================================================

import {
    Clock, ChefHat, CheckCircle, XCircle, Package,
    ShoppingBag, Bus, Car, Wrench, Hotel, Sparkles, Building2,
    LogOut, type LucideIcon,
} from 'lucide-react'
import type {ActivityType, OrderStatusKey} from './activity-labels'

// ============================================================
// FLUX DES STATUTS PAR ACTIVITÉ
// ============================================================
// Les 5 statuts core sont fixes en DB :
//   pending → preparing → ready → delivered (+ cancelled / awaiting_payment)
// Mais toutes les activités n'utilisent pas toutes les étapes.
// On définit ici quelles étapes sont visibles dans l'UI/le workflow.

type FlowStep = Exclude<OrderStatusKey, 'awaiting_payment' | 'cancelled'>

export interface OrderFlow {
    /** Étapes du parcours principal, dans l'ordre. */
    steps: FlowStep[]
}

const FLOWS: Record<ActivityType, OrderFlow> = {
    // 4 étapes classiques : commande → cuisine → prête → servie
    restaurant: {steps: ['pending', 'preparing', 'ready', 'delivered']},
    // Boutique : reçue → préparation → prête à retirer → remise
    retail: {steps: ['pending', 'preparing', 'ready', 'delivered']},
    // Transport : reçue → confirmée → embarquement → embarqué
    transport: {steps: ['pending', 'preparing', 'ready', 'delivered']},
    // Location véhicule : reçue → confirmée → disponible → récupérée
    vehicle_rental: {steps: ['pending', 'preparing', 'ready', 'delivered']},
    // Hôtel : reçue → en préparation → prête → check-out
    hotel: {steps: ['pending', 'preparing', 'ready', 'delivered']},
    // Service / prestation : pas d'étape « prête » — on passe en cours puis terminé
    service_rental: {steps: ['pending', 'preparing', 'delivered']},
    // RDV beauté : pareil — pas de phase « prête »
    beauty: {steps: ['pending', 'preparing', 'delivered']},
    // Générique
    other: {steps: ['pending', 'preparing', 'ready', 'delivered']},
}

export function getOrderFlow(activityType?: ActivityType | string | null): OrderFlow {
    if (activityType && activityType in FLOWS) {
        return FLOWS[activityType as ActivityType]
    }
    return FLOWS.restaurant
}

// ============================================================
// TRANSITIONS AUTORISÉES
// ============================================================

/**
 * Statut suivant dans le flux séquentiel (mode cuisine / lien public).
 * Retourne null si la commande est en fin de parcours ou hors flux.
 */
export function getNextStatus(
    activityType: ActivityType | string | null | undefined,
    currentStatus: OrderStatusKey
): OrderStatusKey | null {
    if (currentStatus === 'awaiting_payment') return 'pending'
    if (currentStatus === 'delivered' || currentStatus === 'cancelled') return null

    const {steps} = getOrderFlow(activityType)
    const idx = steps.indexOf(currentStatus as FlowStep)
    if (idx === -1) {
        // Statut hors flux (ex: ready pour une activité qui ne l'utilise pas) → fin
        return 'delivered'
    }
    return steps[idx + 1] ?? null
}

/**
 * Liste des transitions autorisées depuis le statut courant.
 * - mode "sequential" : un seul saut autorisé (le suivant), plus annulation
 * - mode "free"       : tous les statuts en aval autorisés (comptoir)
 *
 * `cancelled` est toujours autorisé tant que la commande est active.
 */
export function getAllowedTransitions(
    activityType: ActivityType | string | null | undefined,
    currentStatus: OrderStatusKey,
    mode: 'sequential' | 'free'
): OrderStatusKey[] {
    if (currentStatus === 'delivered' || currentStatus === 'cancelled') return []
    if (currentStatus === 'awaiting_payment') return ['pending', 'cancelled']

    const {steps} = getOrderFlow(activityType)
    const idx = steps.indexOf(currentStatus as FlowStep)

    // Statut hors flux : on autorise au moins delivered + cancelled
    if (idx === -1) return ['delivered', 'cancelled']

    if (mode === 'sequential') {
        const next = steps[idx + 1]
        return next ? [next, 'cancelled'] : ['cancelled']
    }

    // free : tous les statuts en aval + annulation
    return [...steps.slice(idx + 1), 'cancelled']
}

// ============================================================
// ICÔNES PAR STATUT × ACTIVITÉ
// ============================================================
// Les icônes par défaut ne dépendent pas de l'activité ; certaines
// activités les surchargent pour coller au métier (Bus, Car, Hotel...).

const COMMON_ICONS: Record<OrderStatusKey, LucideIcon> = {
    awaiting_payment: Clock,
    pending: Clock,
    preparing: ChefHat,
    ready: CheckCircle,
    delivered: Package,
    cancelled: XCircle,
}

const ICON_OVERRIDES: Partial<Record<ActivityType, Partial<Record<OrderStatusKey, LucideIcon>>>> = {
    restaurant: {
        preparing: ChefHat,
        delivered: Package,
    },
    retail: {
        preparing: ShoppingBag,
        delivered: Package,
    },
    transport: {
        preparing: Bus,
        ready: Bus,
        delivered: CheckCircle,
    },
    vehicle_rental: {
        preparing: Car,
        ready: Car,
        delivered: CheckCircle,
    },
    hotel: {
        preparing: Hotel,
        ready: Hotel,
        delivered: LogOut,
    },
    service_rental: {
        preparing: Wrench,
        delivered: CheckCircle,
    },
    beauty: {
        preparing: Sparkles,
        delivered: CheckCircle,
    },
    other: {
        preparing: Building2,
    },
}

export function getOrderStatusIcon(
    activityType: ActivityType | string | null | undefined,
    status: OrderStatusKey
): LucideIcon {
    if (activityType && activityType in ICON_OVERRIDES) {
        const override = ICON_OVERRIDES[activityType as ActivityType]?.[status]
        if (override) return override
    }
    return COMMON_ICONS[status]
}

// ============================================================
// COULEURS DE BADGE PAR STATUT
// ============================================================
// Utilise les tokens sémantiques définis dans app/globals.css.

export function getOrderStatusBadgeClass(status: OrderStatusKey): string {
    switch (status) {
        case 'awaiting_payment':
            return 'bg-status-awaiting-payment-subtle text-status-awaiting-payment-fg border-status-awaiting-payment/30'
        case 'pending':
            return 'bg-status-pending text-status-pending-fg'
        case 'preparing':
            return 'bg-status-preparing text-status-preparing-fg'
        case 'ready':
            return 'bg-status-ready text-status-ready-fg'
        case 'delivered':
            return 'bg-status-delivered text-status-delivered-fg'
        case 'cancelled':
            return 'bg-status-cancelled text-status-cancelled-fg'
    }
}
