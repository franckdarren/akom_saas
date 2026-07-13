'use client'

import { RestaurantDetailsType } from './page'
import { formatDate, formatNumber, formatPrice } from '@/lib/utils/format'
import { getRoleBadge } from '@/lib/utils/permissions'
import { getLabels } from '@/lib/config/activity-labels'
import { SystemRole } from '@/types/auth'
import { calculateMonthlyPrice, getPlanConfig } from '@/lib/config/subscription'
import { PLAN_LABELS, STATUS_LABELS } from '@/types/subscription'
import {
    AppCard,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/app-card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ToggleRestaurantStatus } from '@/components/superadmin/ToggleRestaurantStatus'
import { ArrowLeft, Building2, CreditCard, ShoppingCart, Smartphone, TrendingUp } from 'lucide-react'
import Link from 'next/link'

// ----------------------------
// Props
// ----------------------------

interface Props {
    restaurant: RestaurantDetailsType
}

// ----------------------------
// Component
// ----------------------------

export default function RestaurantDetailsClient({ restaurant }: Props) {
    const labels = getLabels(restaurant.activityType)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">

                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="type-page-title">{restaurant.name}</h1>
                            <Badge variant="secondary">
                                <span className="mr-1">{labels.emoji}</span>
                                {labels.structureNameCapital}
                            </Badge>
                        </div>
                        <p className="type-description">
                            {restaurant.slug}
                        </p>
                    </div>
                </div>

                <ToggleRestaurantStatus
                    restaurantId={restaurant.id}
                    isActive={restaurant.isActive}
                />
            </div>

            {/* Infos générales */}
            <AppCard>
                <CardHeader>
                    <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <Info label="Téléphone">
                        {restaurant.phone || 'Non renseigné'}
                    </Info>
                    <Info label="Adresse">
                        {restaurant.address || 'Non renseigné'}
                    </Info>
                    <Info label="Statut">
                        <Badge variant={restaurant.isActive ? 'default' : 'outline'}>
                            {restaurant.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                    </Info>
                    <Info label="Créé le">
                        {formatDate(new Date(restaurant.createdAt))}
                    </Info>
                </CardContent>
            </AppCard>

            {/* Abonnement */}
            <AppCard>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="layout-inline">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="type-card-title">Abonnement</CardTitle>
                        </div>
                        {restaurant.subscription && (
                            <Badge variant={getSubscriptionBadgeVariant(restaurant.subscription.status)}>
                                {STATUS_LABELS[restaurant.subscription.status as keyof typeof STATUS_LABELS]}
                            </Badge>
                        )}
                    </div>
                    <CardDescription>
                        Détails de l&apos;abonnement de {restaurant.name}
                    </CardDescription>
                </CardHeader>

                <CardContent className="layout-card-body">
                    {!restaurant.subscription ? (
                        <EmptyState title="Aucun abonnement" description="Cette structure n'a pas encore d'abonnement." />
                    ) : (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Info label="Plan">
                                    {PLAN_LABELS[restaurant.subscription.plan as keyof typeof PLAN_LABELS]}
                                </Info>
                                <Info label="Coût mensuel">
                                    {formatPrice(
                                        calculateMonthlyPrice(
                                            restaurant.subscription.plan as Parameters<typeof calculateMonthlyPrice>[0],
                                            restaurant.subscription.activeUsersCount
                                        )
                                    )}
                                </Info>
                                <Info label="Cycle de facturation">
                                    {restaurant.subscription.billingCycle} mois
                                </Info>
                                <Info label="Utilisateurs actifs">
                                    {formatNumber(restaurant.subscription.activeUsersCount)}
                                </Info>

                                {restaurant.subscription.status === 'trial' ? (
                                    <>
                                        <Info label="Début essai">
                                            {formatDate(new Date(restaurant.subscription.trialStartsAt))}
                                        </Info>
                                        <Info label="Fin essai">
                                            {formatDate(new Date(restaurant.subscription.trialEndsAt))}
                                        </Info>
                                    </>
                                ) : (
                                    <>
                                        <Info label="Début période">
                                            {restaurant.subscription.currentPeriodStart
                                                ? formatDate(new Date(restaurant.subscription.currentPeriodStart))
                                                : 'Non renseigné'}
                                        </Info>
                                        <Info label="Fin période">
                                            {restaurant.subscription.currentPeriodEnd
                                                ? formatDate(new Date(restaurant.subscription.currentPeriodEnd))
                                                : 'Non renseigné'}
                                        </Info>
                                    </>
                                )}

                                <Info label="Jours restants">
                                    {(() => {
                                        const days = getSubscriptionDaysRemaining(restaurant.subscription)
                                        return days === null ? 'Non renseigné' : `${days} jour${days > 1 ? 's' : ''}`
                                    })()}
                                </Info>
                            </div>

                            <div>
                                <p className="type-label mb-2">Derniers paiements</p>
                                {restaurant.subscription.payments.length === 0 ? (
                                    <EmptyState title="Aucun paiement" description="Aucun paiement enregistré pour cet abonnement." />
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Montant</TableHead>
                                                <TableHead>Méthode</TableHead>
                                                <TableHead>Statut</TableHead>
                                                <TableHead>Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {restaurant.subscription.payments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell className="font-medium">
                                                        {formatPrice(payment.amount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {SUBSCRIPTION_PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getPaymentStatusBadgeVariant(payment.status)}>
                                                            {SUBSCRIPTION_PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDate(new Date(payment.createdAt))}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </AppCard>

            {/* Statistiques */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Commandes Total"
                    value={formatNumber(restaurant.stats.totalOrders)}
                    sub={`${restaurant.stats.ordersThisMonth} ce mois`}
                    icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
                />

                <StatCard
                    title="Revenu Total"
                    value={formatPrice(restaurant.stats.totalRevenue)}
                    icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                />

                <StatCard
                    title={capitalize(labels.productNamePlural)}
                    value={formatNumber(restaurant._count.products)}
                    icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
                />

                <StatCard
                    title={capitalize(labels.tableNamePlural)}
                    value={formatNumber(restaurant._count.tables)}
                    icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
                />
            </div>

            {/* Utilisateurs */}
            <AppCard>
                <CardHeader>
                    <CardTitle>Utilisateurs</CardTitle>
                    <CardDescription>
                        Liste des membres de {restaurant.name}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User ID</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Ajouté le</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {restaurant.users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3}>
                                        <EmptyState title="Aucun utilisateur"/>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                restaurant.users.map((user) => {
                                    const roleBadge = getRoleBadge(
                                        user.role ?? 'kitchen'
                                    )

                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-mono text-sm">
                                                {user.userId.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={roleBadge.color}>
                                                    {roleBadge.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(user.createdAt)}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </AppCard>

            {/* Paiement SingPay */}
            <AppCard>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="layout-inline">
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="type-card-title">Paiement Mobile Money</CardTitle>
                        </div>
                        {restaurant.singpayConfig?.enabled ? (
                            <Badge className="bg-success text-success-foreground">Activé</Badge>
                        ) : restaurant.singpayConfig?.isConfigured ? (
                            <Badge variant="secondary">Désactivé</Badge>
                        ) : (
                            <Badge variant="outline">Non configuré</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="layout-card-body">
                    {restaurant.singpayConfig?.isConfigured ? (
                        <p className="type-body-muted">
                            Wallet ID : <span className="type-code">{restaurant.singpayConfig.walletId?.substring(0, 8)}...{restaurant.singpayConfig.walletId?.slice(-4)}</span>
                        </p>
                    ) : (
                        <p className="type-body-muted">
                            Aucun portefeuille SingPay n'est relié à cet établissement.
                        </p>
                    )}
                    <Link
                        href={`/superadmin/restaurants/${restaurant.id}/singpay`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                        Configurer SingPay
                    </Link>
                </CardContent>
            </AppCard>
        </div>
    )
}

// ----------------------------
// UI Helpers
// ----------------------------

const SUBSCRIPTION_PAYMENT_METHOD_LABELS: Record<string, string> = {
    manual: 'Virement manuel',
    airtel_money: 'Airtel Money',
    moov_money: 'Moov Money',
    mobile_money: 'Mobile Money',
    card: 'Carte bancaire',
}

const SUBSCRIPTION_PAYMENT_STATUS_LABELS: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    failed: 'Échoué',
    refunded: 'Remboursé',
}

function getSubscriptionBadgeVariant(
    status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'active':
            return 'default'
        case 'trial':
            return 'secondary'
        case 'suspended':
        case 'expired':
            return 'destructive'
        default:
            return 'outline'
    }
}

function getPaymentStatusBadgeVariant(
    status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
        case 'confirmed':
            return 'default'
        case 'pending':
            return 'secondary'
        case 'failed':
            return 'destructive'
        default:
            return 'outline'
    }
}

function getSubscriptionDaysRemaining(subscription: {
    status: string
    trialEndsAt: string
    currentPeriodEnd: string | null
}): number | null {
    const endDate =
        subscription.status === 'trial'
            ? new Date(subscription.trialEndsAt)
            : subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd)
                : null

    if (!endDate) return null

    const diffTime = endDate.getTime() - Date.now()
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1)
}

function Info({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="font-medium">{children}</div>
        </div>
    )
}

function StatCard({
    title,
    value,
    sub,
    icon,
}: {
    title: string
    value: string | number
    sub?: string
    icon: React.ReactNode
}) {
    return (
        <AppCard>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {sub && (
                    <p className="text-xs text-muted-foreground">
                        {sub}
                    </p>
                )}
            </CardContent>
        </AppCard>
    )
}
