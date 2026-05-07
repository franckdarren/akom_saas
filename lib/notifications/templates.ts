import type { NotificationType, NotificationPriority } from '@prisma/client'

export interface NotificationTemplateContext {
    restaurantName?: string
    appUrl: string
}

export interface RenderedNotification {
    title: string
    body: string
    actionUrl?: string
    priority: NotificationPriority
    emailSubject: string
    emailIntro: string
    emailCtaLabel?: string
}

type TemplateData = Record<string, string | number | undefined | null>

/**
 * Map type → renderer. Chaque renderer reçoit les `data` contextuelles
 * passées à `notify()` et le contexte global (URL app, nom structure).
 */
const renderers: Record<
    NotificationType,
    (data: TemplateData, ctx: NotificationTemplateContext) => RenderedNotification
> = {
    // ─── SUPPORT ────────────────────────────────────────────────────────
    support_reply: (data, ctx) => ({
        title: 'Nouvelle réponse du support',
        body: data.preview
            ? `Notre équipe a répondu à votre ticket : « ${truncate(String(data.preview), 120)} »`
            : 'Notre équipe a répondu à votre ticket de support.',
        actionUrl: data.ticketId ? `/dashboard/support?ticket=${data.ticketId}` : '/dashboard/support',
        priority: 'high',
        emailSubject: `[Akôm] Nouvelle réponse à votre ticket${data.subject ? ` : ${data.subject}` : ''}`,
        emailIntro: 'Notre équipe support vous a répondu.',
        emailCtaLabel: 'Voir la conversation',
    }),

    support_ticket_resolved: (data, ctx) => ({
        title: 'Ticket résolu',
        body: data.subject
            ? `Votre ticket « ${truncate(String(data.subject), 80)} » a été marqué comme résolu.`
            : 'Votre ticket a été marqué comme résolu.',
        actionUrl: data.ticketId ? `/dashboard/support?ticket=${data.ticketId}` : '/dashboard/support',
        priority: 'normal',
        emailSubject: '[Akôm] Votre ticket de support est résolu',
        emailIntro: 'Votre demande a été résolue par notre équipe.',
        emailCtaLabel: 'Consulter le ticket',
    }),

    // ─── VÉRIFICATION ───────────────────────────────────────────────────
    verification_approved: (data, ctx) => ({
        title: 'Établissement vérifié',
        body: `Votre établissement ${ctx.restaurantName ?? ''} est désormais approuvé. Toutes les fonctionnalités sont actives.`,
        actionUrl: '/dashboard',
        priority: 'high',
        emailSubject: `[Akôm] ${ctx.restaurantName ?? 'Votre établissement'} est approuvé !`,
        emailIntro: 'Votre établissement a été vérifié par notre équipe.',
        emailCtaLabel: 'Accéder au tableau de bord',
    }),

    verification_rejected: (data, ctx) => ({
        title: 'Documents de vérification rejetés',
        body: data.reason
            ? `Vos documents ont été rejetés. Motif : ${truncate(String(data.reason), 150)}`
            : 'Vos documents de vérification ont été rejetés. Veuillez les soumettre à nouveau.',
        actionUrl: '/onboarding/verification',
        priority: 'urgent',
        emailSubject: '[Akôm] Action requise : documents de vérification à mettre à jour',
        emailIntro: 'Vos documents de vérification doivent être corrigés.',
        emailCtaLabel: 'Renvoyer mes documents',
    }),

    circuit_sheet_deadline: (data, ctx) => ({
        title: 'Fiche circuit à transmettre',
        body: data.daysRemaining != null
            ? `Il reste ${data.daysRemaining} jour(s) pour soumettre votre fiche circuit.`
            : 'Votre fiche circuit doit être soumise prochainement.',
        actionUrl: '/dashboard/settings/verification',
        priority: 'high',
        emailSubject: '[Akôm] Échéance fiche circuit',
        emailIntro: 'Votre fiche circuit doit être transmise avant l’échéance.',
        emailCtaLabel: 'Soumettre la fiche',
    }),

    // ─── PAIEMENTS ──────────────────────────────────────────────────────
    payment_received: (data, ctx) => ({
        title: 'Paiement reçu',
        body: data.orderNumber && data.amount
            ? `Commande ${data.orderNumber} : ${data.amount} XAF encaissés.`
            : 'Un paiement a été reçu pour une commande.',
        actionUrl: data.orderId ? `/dashboard/orders/${data.orderId}` : '/dashboard/orders',
        priority: 'normal',
        emailSubject: `[Akôm] Paiement reçu — Commande ${data.orderNumber ?? ''}`,
        emailIntro: 'Un paiement vient d’être confirmé.',
        emailCtaLabel: 'Voir la commande',
    }),

    payment_failed: (data, ctx) => ({
        title: 'Paiement échoué',
        body: data.orderNumber
            ? `Le paiement de la commande ${data.orderNumber} a échoué.`
            : 'Un paiement a échoué.',
        actionUrl: data.orderId ? `/dashboard/orders/${data.orderId}` : '/dashboard/orders',
        priority: 'high',
        emailSubject: '[Akôm] Paiement échoué',
        emailIntro: 'Un paiement a échoué et nécessite votre attention.',
        emailCtaLabel: 'Voir la commande',
    }),

    subscription_paid: (data, ctx) => ({
        title: 'Abonnement renouvelé',
        body: data.plan
            ? `Votre abonnement ${data.plan} a été renouvelé avec succès.`
            : 'Votre abonnement a été renouvelé.',
        actionUrl: '/dashboard/subscription',
        priority: 'normal',
        emailSubject: '[Akôm] Abonnement renouvelé',
        emailIntro: 'Le paiement de votre abonnement a été confirmé.',
        emailCtaLabel: 'Voir mon abonnement',
    }),

    subscription_expiring: (data, ctx) => ({
        title: 'Abonnement bientôt expiré',
        body: data.daysRemaining != null
            ? `Votre abonnement expire dans ${data.daysRemaining} jour(s).`
            : 'Votre abonnement arrive à échéance.',
        actionUrl: '/dashboard/subscription/choose-plan',
        priority: 'high',
        emailSubject: '[Akôm] Votre abonnement arrive à échéance',
        emailIntro: 'Pensez à renouveler votre abonnement avant l’expiration.',
        emailCtaLabel: 'Renouveler',
    }),

    subscription_suspended: (data, ctx) => ({
        title: 'Abonnement suspendu',
        body: 'Votre abonnement a été suspendu. Renouvelez pour réactiver les fonctionnalités.',
        actionUrl: '/dashboard/subscription/choose-plan',
        priority: 'urgent',
        emailSubject: '[Akôm] Abonnement suspendu',
        emailIntro: 'Votre accès aux fonctionnalités payantes est suspendu.',
        emailCtaLabel: 'Réactiver',
    }),

    // ─── OPÉRATIONS ─────────────────────────────────────────────────────
    low_stock_alert: (data, ctx) => ({
        title: 'Stock bas',
        body: data.productName && data.quantity != null
            ? `${data.productName} : seulement ${data.quantity} unité(s) restante(s).`
            : 'Un produit a atteint son seuil d’alerte.',
        actionUrl: '/dashboard/stocks',
        priority: 'normal',
        emailSubject: '[Akôm] Alerte stock bas',
        emailIntro: 'Un produit a atteint son seuil d’alerte.',
        emailCtaLabel: 'Gérer les stocks',
    }),

    slow_order_alert: (data, ctx) => ({
        title: 'Commande en attente',
        body: data.orderNumber
            ? `La commande ${data.orderNumber} est en attente depuis plus de 15 minutes.`
            : 'Une commande est en attente depuis trop longtemps.',
        actionUrl: data.orderId ? `/dashboard/orders/${data.orderId}` : '/dashboard/orders',
        priority: 'high',
        emailSubject: '[Akôm] Commande en attente prolongée',
        emailIntro: 'Une commande nécessite votre attention.',
        emailCtaLabel: 'Voir la commande',
    }),

    new_invitation_accepted: (data, ctx) => ({
        title: 'Invitation acceptée',
        body: data.userEmail
            ? `${data.userEmail} a rejoint votre équipe.`
            : 'Un nouvel utilisateur a rejoint votre équipe.',
        actionUrl: '/dashboard/users',
        priority: 'low',
        emailSubject: '[Akôm] Nouvelle personne dans votre équipe',
        emailIntro: 'Un nouvel utilisateur a rejoint votre établissement.',
        emailCtaLabel: 'Voir l’équipe',
    }),

    // ─── SUPERADMIN ─────────────────────────────────────────────────────
    new_support_ticket: (data, ctx) => ({
        title: 'Nouveau ticket support',
        body: data.subject && data.restaurantName
            ? `${data.restaurantName} : « ${truncate(String(data.subject), 100)} »`
            : 'Un nouveau ticket de support a été créé.',
        actionUrl: data.ticketId ? `/superadmin/support?ticket=${data.ticketId}` : '/superadmin/support',
        priority: 'high',
        emailSubject: '[Akôm Admin] Nouveau ticket support',
        emailIntro: 'Un nouveau ticket vient d’être ouvert.',
        emailCtaLabel: 'Traiter le ticket',
    }),

    new_verification_submitted: (data, ctx) => ({
        title: 'Documents à vérifier',
        body: data.restaurantName
            ? `${data.restaurantName} a soumis ses documents pour vérification.`
            : 'Une nouvelle structure a soumis ses documents.',
        actionUrl: '/superadmin/verifications',
        priority: 'normal',
        emailSubject: '[Akôm Admin] Nouvelle vérification à traiter',
        emailIntro: 'Une structure a soumis ses documents.',
        emailCtaLabel: 'Vérifier les documents',
    }),

    new_subscription_payment: (data, ctx) => ({
        title: 'Nouveau paiement abonnement',
        body: data.amount && data.restaurantName
            ? `${data.restaurantName} : ${data.amount} XAF reçus.`
            : 'Un paiement d’abonnement a été reçu.',
        actionUrl: '/superadmin/subscriptions',
        priority: 'low',
        emailSubject: '[Akôm Admin] Nouveau paiement abonnement',
        emailIntro: 'Un paiement d’abonnement a été enregistré.',
    }),
}

export function renderNotification(
    type: NotificationType,
    data: TemplateData,
    ctx: NotificationTemplateContext
): RenderedNotification {
    return renderers[type](data, ctx)
}

function truncate(s: string, max: number): string {
    if (s.length <= max) return s
    return s.slice(0, max - 1) + '…'
}
