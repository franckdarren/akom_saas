'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
    CheckCircle2,
    AlertTriangle,
    CreditCard,
    AlertCircle,
    Clock,
    Package,
    UserCheck,
    ExternalLink,
    Bell,
    ShieldCheck,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { NotificationListItem } from '@/lib/actions/notifications'

interface Props {
    notification: NotificationListItem | null
    onClose: () => void
}

const TYPE_ICON: Record<string, React.ElementType> = {
    verification_approved: CheckCircle2,
    verification_rejected: AlertTriangle,
    circuit_sheet_deadline: AlertTriangle,
    payment_received: CreditCard,
    payment_failed: AlertCircle,
    subscription_paid: CreditCard,
    subscription_expiring: Clock,
    subscription_suspended: AlertCircle,
    low_stock_alert: Package,
    slow_order_alert: Clock,
    new_invitation_accepted: UserCheck,
    new_support_ticket: Bell,
    new_verification_submitted: ShieldCheck,
    new_subscription_payment: CreditCard,
}

const TYPE_ICON_CLASS: Record<string, string> = {
    verification_approved: 'text-success',
    verification_rejected: 'text-destructive',
    circuit_sheet_deadline: 'text-warning',
    payment_received: 'text-success',
    payment_failed: 'text-destructive',
    subscription_paid: 'text-success',
    subscription_expiring: 'text-warning',
    subscription_suspended: 'text-destructive',
    low_stock_alert: 'text-warning',
    slow_order_alert: 'text-warning',
    new_invitation_accepted: 'text-info',
    new_support_ticket: 'text-info',
    new_verification_submitted: 'text-warning',
    new_subscription_payment: 'text-success',
}

const ACTION_LABELS: Record<string, string> = {
    verification_approved: 'Accéder au tableau de bord',
    verification_rejected: 'Renvoyer mes documents',
    circuit_sheet_deadline: 'Soumettre la fiche',
    payment_received: 'Voir la commande',
    payment_failed: 'Voir la commande',
    subscription_paid: 'Voir mon abonnement',
    subscription_expiring: 'Renouveler',
    subscription_suspended: 'Réactiver',
    low_stock_alert: 'Gérer les stocks',
    slow_order_alert: 'Voir la commande',
    new_invitation_accepted: "Voir l'équipe",
    new_support_ticket: 'Traiter le ticket',
    new_verification_submitted: 'Vérifier les documents',
    new_subscription_payment: 'Voir les abonnements',
}

const PRIORITY_LABEL: Record<string, string> = {
    low: 'Info',
    normal: 'Normale',
    high: 'Importante',
    urgent: 'Urgente',
}

const PRIORITY_BADGE_CLASS: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    normal: 'bg-info/10 text-info border-info/20',
    high: 'bg-warning/10 text-warning border-warning/20',
    urgent: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function NotificationDetailModal({ notification, onClose }: Props) {
    const router = useRouter()

    if (!notification) return null

    const Icon = TYPE_ICON[notification.type] ?? Bell
    const iconClass = TYPE_ICON_CLASS[notification.type] ?? 'text-muted-foreground'
    const actionLabel = ACTION_LABELS[notification.type] ?? 'Voir'

    const handleAction = () => {
        if (notification.actionUrl) router.push(notification.actionUrl)
        onClose()
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        <div className={cn('mt-0.5 shrink-0', iconClass)}>
                            <Icon className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="type-dialog-title leading-snug">
                                {notification.title}
                            </DialogTitle>
                            <div className="mt-1.5 flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={cn('text-2xs', PRIORITY_BADGE_CLASS[notification.priority])}
                                >
                                    {PRIORITY_LABEL[notification.priority] ?? notification.priority}
                                </Badge>
                                <span className="type-caption">
                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                        addSuffix: true,
                                        locale: fr,
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <p className="type-body text-foreground py-1">{notification.body}</p>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Fermer
                    </Button>
                    {notification.actionUrl && (
                        <Button size="sm" onClick={handleAction}>
                            <ExternalLink className="mr-2 size-3.5" />
                            {actionLabel}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
