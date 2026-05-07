'use client'

import { useState, useTransition } from 'react'
import { Bell, Mail, MonitorSmartphone } from 'lucide-react'
import { toast } from 'sonner'
import { AppCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/app-card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { upsertNotificationPreference, type NotificationPreferenceItem } from '@/lib/actions/notifications'

interface NotificationGroup {
    label: string
    types: Array<{
        type: string
        label: string
        description: string
    }>
}

const GROUPS: NotificationGroup[] = [
    {
        label: 'Support',
        types: [
            { type: 'support_reply', label: 'Réponse du support', description: "Quand notre équipe répond à l'un de vos tickets." },
            { type: 'support_ticket_resolved', label: 'Ticket résolu', description: 'Quand un ticket est marqué comme résolu.' },
        ],
    },
    {
        label: 'Vérification',
        types: [
            { type: 'verification_approved', label: 'Établissement approuvé', description: "Quand vos documents de vérification sont approuvés." },
            { type: 'verification_rejected', label: 'Documents rejetés', description: "Quand vos documents de vérification doivent être corrigés." },
            { type: 'circuit_sheet_deadline', label: 'Fiche circuit à soumettre', description: "Rappel avant l'échéance de la fiche circuit." },
        ],
    },
    {
        label: 'Paiements',
        types: [
            { type: 'payment_received', label: 'Paiement reçu', description: 'Quand un paiement de commande est confirmé.' },
            { type: 'payment_failed', label: 'Paiement échoué', description: 'Quand un paiement de commande échoue.' },
            { type: 'subscription_paid', label: 'Abonnement renouvelé', description: "Confirmation de paiement d'abonnement." },
            { type: 'subscription_expiring', label: 'Abonnement bientôt expiré', description: "Rappels J-7, J-3, J-1 avant expiration." },
            { type: 'subscription_suspended', label: 'Abonnement suspendu', description: "Quand votre abonnement est suspendu." },
        ],
    },
    {
        label: 'Opérations',
        types: [
            { type: 'low_stock_alert', label: 'Stock bas', description: "Quand un produit atteint son seuil d'alerte." },
            { type: 'slow_order_alert', label: 'Commande en attente', description: "Quand une commande est en attente depuis plus de 15 minutes." },
            { type: 'new_invitation_accepted', label: 'Invitation acceptée', description: "Quand un collaborateur rejoint votre équipe." },
        ],
    },
]

interface Props {
    initialPrefs: NotificationPreferenceItem[]
}

type PrefsMap = Record<string, { inApp: boolean; email: boolean }>

function buildMap(prefs: NotificationPreferenceItem[]): PrefsMap {
    const map: PrefsMap = {}
    for (const p of prefs) {
        map[p.type] = { inApp: p.inApp, email: p.email }
    }
    return map
}

function getPref(map: PrefsMap, type: string): { inApp: boolean; email: boolean } {
    return map[type] ?? { inApp: true, email: true }
}

export function NotificationSettingsClient({ initialPrefs }: Props) {
    const [prefsMap, setPrefsMap] = useState<PrefsMap>(buildMap(initialPrefs))
    const [pending, startTransition] = useTransition()

    const toggle = (type: string, channel: 'inApp' | 'email', value: boolean) => {
        const current = getPref(prefsMap, type)
        const next = { ...current, [channel]: value }

        setPrefsMap((prev) => ({ ...prev, [type]: next }))

        startTransition(async () => {
            try {
                await upsertNotificationPreference(type, next.inApp, next.email)
            } catch {
                // Rollback optimiste
                setPrefsMap((prev) => ({ ...prev, [type]: current }))
                toast.error('Erreur lors de la mise à jour des préférences')
            }
        })
    }

    return (
        <div className="layout-sections max-w-2xl">
            <div>
                <h1 className="type-page-title">Préférences de notifications</h1>
                <p className="type-body-muted">
                    Choisissez comment vous souhaitez être notifié pour chaque événement.
                </p>
            </div>

            {GROUPS.map((group) => (
                <AppCard key={group.label}>
                    <CardHeader>
                        <CardTitle className="type-card-title">{group.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="layout-card-body">
                        {/* En-tête colonnes */}
                        <div className="flex items-center justify-end gap-6 pb-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MonitorSmartphone className="size-3.5" />
                                In-app
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="size-3.5" />
                                Email
                            </div>
                        </div>
                        <Separator />
                        <ul className="divide-y">
                            {group.types.map((item, idx) => {
                                const pref = getPref(prefsMap, item.type)
                                return (
                                    <li key={item.type} className="flex items-center justify-between gap-4 py-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">{item.label}</p>
                                            <p className="type-caption text-muted-foreground">{item.description}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-6">
                                            <Switch
                                                checked={pref.inApp}
                                                onCheckedChange={(v) => toggle(item.type, 'inApp', v)}
                                                disabled={pending}
                                                aria-label={`Notifications in-app pour ${item.label}`}
                                            />
                                            <Switch
                                                checked={pref.email}
                                                onCheckedChange={(v) => toggle(item.type, 'email', v)}
                                                disabled={pending}
                                                aria-label={`Email pour ${item.label}`}
                                            />
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </CardContent>
                </AppCard>
            ))}
        </div>
    )
}
