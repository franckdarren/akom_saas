'use client'

import {useState, useMemo, useTransition} from 'react'
import {useRouter} from 'next/navigation'
import {toast} from 'sonner'
import {format, isToday, isYesterday, parseISO} from 'date-fns'
import {fr} from 'date-fns/locale'
import {
    Clock, ChefHat, CheckCircle2, Truck, XCircle,
    ShoppingBag, TrendingUp, RefreshCw, Receipt,
    AlertCircle, Banknote, Smartphone,
    ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react'
import {Card, CardContent} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Separator} from '@/components/ui/separator'
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
    DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {updateOrderStatus} from '@/lib/actions/order'
import {markOrderPaid} from '../_actions/mark-order-paid'
import {PaymentMethod} from '@prisma/client'
import {cn} from '@/lib/utils'

// ============================================================
// TYPES
// ============================================================

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
type PaymentSt = 'pending' | 'paid' | 'failed' | 'refunded'
type StatusFilter = OrderStatus | 'unpaid' | 'all'

interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number
}

interface OrderPayment {
    id: string;
    method: string;
    status: PaymentSt;
    amount: number
}

interface Order {
    id: string
    orderNumber: string | null
    status: OrderStatus
    totalAmount: number
    source: string
    tableLabel: string | null
    customerName: string | null
    notes: string | null
    createdAt: Date
    orderItems: OrderItem[]
    table: { number: number } | null
    payments: OrderPayment[]
}

interface DayStats {
    total: number;
    pending: number;
    preparing: number
    ready: number;
    delivered: number;
    cancelled: number
    unpaid: number;
    revenue: number
}

interface POSOrdersShellProps {
    orders: Order[]
    stats: DayStats
    selectedDate: string
}

// ============================================================
// CONFIG STATUTS
// ============================================================

const STATUS_CONFIG: Record<OrderStatus, {
    label: string
    icon: React.ElementType
    badgeClass: string
    // nextStatus : flux séquentiel (cuisine / QR)
    nextStatus: OrderStatus | null
    nextLabel: string | null
}> = {
    pending: {
        label: 'En attente',
        icon: Clock,
        badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
        nextStatus: 'preparing',
        nextLabel: 'Démarrer prépa.'
    },
    preparing: {
        label: 'En préparation',
        icon: ChefHat,
        badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
        nextStatus: 'ready',
        nextLabel: 'Marquer prêt'
    },
    ready: {
        label: 'Prêt',
        icon: CheckCircle2,
        badgeClass: 'bg-green-100 text-green-700 border-green-200',
        nextStatus: 'delivered',
        nextLabel: 'Marquer livré'
    },
    delivered: {
        label: 'Servie',
        icon: Truck,
        badgeClass: 'bg-muted text-muted-foreground border-border',
        nextStatus: null,
        nextLabel: null
    },
    cancelled: {
        label: 'Annulé',
        icon: XCircle,
        badgeClass: 'bg-red-100 text-red-700 border-red-200',
        nextStatus: null,
        nextLabel: null
    },
}

// Statuts accessibles depuis le menu libre (comptoir uniquement)
// Chaque statut indique vers lesquels on peut sauter directement
const FREE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending: ['preparing', 'ready', 'delivered', 'cancelled'],
    preparing: ['ready', 'delivered', 'cancelled'],
    ready: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
    {value: PaymentMethod.cash, label: 'Espèces', icon: Banknote},
    {value: PaymentMethod.airtel_money, label: 'Airtel Money', icon: Smartphone},
    {value: PaymentMethod.moov_money, label: 'Moov Money', icon: Smartphone},
]

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'Espèces', airtel_money: 'Airtel Money',
    moov_money: 'Moov Money', mobile_money: 'Mobile Money', card: 'Carte',
}

const SOURCE_LABELS: Record<string, string> = {
    counter: 'Comptoir', qr_table: 'QR Table',
    public_link: 'Lien public', dashboard: 'Dashboard',
}

// ============================================================
// HELPERS DATE
// ============================================================

function formatDateLabel(dateStr: string): string {
    const d = parseISO(dateStr)
    if (isToday(d)) return "Aujourd'hui"
    if (isYesterday(d)) return 'Hier'
    return format(d, 'EEEE d MMMM yyyy', {locale: fr})
}

function shiftDate(dateStr: string, days: number): string {
    const d = parseISO(dateStr)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
}

function isFutureDate(dateStr: string): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return parseISO(dateStr) > today
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export function POSOrdersShell({orders: initialOrders, stats, selectedDate}: POSOrdersShellProps) {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const [filter, setFilter] = useState<StatusFilter>('all')
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [payDialog, setPayDialog] = useState<Order | null>(null)
    const [isPending, startTransition] = useTransition()

    const filtered = useMemo(() => {
        if (filter === 'all') return orders
        if (filter === 'unpaid') return orders.filter(o =>
            o.status !== 'cancelled' && !o.payments.some(p => p.status === 'paid')
        )
        return orders.filter(o => o.status === filter)
    }, [orders, filter])

    function goToDate(dateStr: string) {
        router.push(`/dashboard/pos/orders?date=${dateStr}`)
    }

    async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
        setLoadingId(orderId)
        try {
            const result = await updateOrderStatus(orderId, newStatus)
            if ('error' in result) {
                toast.error(result.error);
                return
            }
            setOrders(prev => prev.map(o =>
                o.id === orderId ? {...o, status: newStatus} : o
            ))
            toast.success(`Commande → ${STATUS_CONFIG[newStatus].label}`)
        } catch {
            toast.error('Erreur lors de la mise à jour')
        } finally {
            setLoadingId(null)
        }
    }

    async function handleMarkPaid(order: Order, method: PaymentMethod) {
        setLoadingId(order.id)
        setPayDialog(null)
        try {
            const result = await markOrderPaid(order.id, method)
            if ('error' in result) {
                toast.error(result.error);
                return
            }
            setOrders(prev => prev.map(o => {
                if (o.id !== order.id) return o
                const existingPending = o.payments.find(p => p.status === 'pending')
                const updatedPayments = existingPending
                    ? o.payments.map(p =>
                        p.id === existingPending.id ? {...p, status: 'paid' as PaymentSt, method} : p
                    )
                    : [...o.payments, {id: 'new', method, status: 'paid' as PaymentSt, amount: o.totalAmount}]
                return {...o, payments: updatedPayments}
            }))
            toast.success('Commande encaissée')
        } catch {
            toast.error('Erreur encaissement')
        } finally {
            setLoadingId(null)
        }
    }

    const canGoNext = !isFutureDate(shiftDate(selectedDate, 1))

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête + sélecteur de date ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Historique des ventes</h1>
                    <p className="text-sm text-muted-foreground mt-0.5 capitalize">
                        {formatDateLabel(selectedDate)}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon"
                            onClick={() => goToDate(shiftDate(selectedDate, -1))}
                            title="Jour précédent"
                    >
                        <ChevronLeft className="h-4 w-4"/>
                    </Button>

                    <input
                        type="date"
                        value={selectedDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={e => e.target.value && goToDate(e.target.value)}
                        className={cn(
                            'h-9 rounded-md border border-input bg-background px-3 text-sm',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer'
                        )}
                    />

                    <Button variant="outline" size="icon"
                            onClick={() => goToDate(shiftDate(selectedDate, 1))}
                            disabled={!canGoNext}
                            title="Jour suivant"
                    >
                        <ChevronRight className="h-4 w-4"/>
                    </Button>

                    {!isToday(parseISO(selectedDate)) && (
                        <Button variant="secondary" size="sm"
                                onClick={() => goToDate(new Date().toISOString().split('T')[0])}
                        >
                            Aujourd'hui
                        </Button>
                    )}

                    <Button variant="outline" size="sm"
                            onClick={() => startTransition(() => router.refresh())}
                            disabled={isPending}
                            className="gap-1.5"
                    >
                        <RefreshCw className={cn('h-3.5 w-3.5', isPending && 'animate-spin')}/>
                        <span className="hidden sm:inline">Actualiser</span>
                    </Button>
                </div>
            </div>

            {/* ── Cartes statistiques ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <StatCard label="Commandes" value={stats.total} icon={ShoppingBag}
                          className="col-span-2 sm:col-span-1"/>
                <StatCard label="En attente" value={stats.pending} icon={Clock} highlight={stats.pending > 0}
                          highlightClass="border-amber-200 bg-amber-50"/>
                <StatCard label="En prépa." value={stats.preparing} icon={ChefHat} highlight={stats.preparing > 0}
                          highlightClass="border-blue-200 bg-blue-50"/>
                <StatCard label="Prêts" value={stats.ready} icon={CheckCircle2} highlight={stats.ready > 0}
                          highlightClass="border-green-200 bg-green-50"/>
                <StatCard label="Servies" value={stats.delivered} icon={Truck}/>
                <StatCard label="Annulés" value={stats.cancelled} icon={XCircle}/>
                <StatCard label="Non payés" value={stats.unpaid} icon={AlertCircle}
                          highlight={stats.unpaid > 0} highlightClass="border-orange-200 bg-orange-50"
                />
                <StatCard
                    label="CA du jour"
                    value={`${stats.revenue.toLocaleString('fr-FR')} F`}
                    icon={TrendingUp} isText
                    className="col-span-2 sm:col-span-1"
                />
            </div>

            {/* ── Filtres ── */}
            <div className="flex flex-wrap gap-2">
                {([
                    ['all', "Toutes", stats.total],
                    ['pending', 'En attente', stats.pending],
                    ['preparing', 'En préparation', stats.preparing],
                    ['ready', 'Prêtes', stats.ready],
                    ['delivered', 'Servies', stats.delivered],
                    ['cancelled', 'Annulées', stats.cancelled],
                    ['unpaid', 'Non payées', stats.unpaid],
                ] as [StatusFilter, string, number][]).map(([value, label, count]) => (
                    <button
                        key={value}
                        onClick={() => setFilter(value)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                            'transition-all duration-150 border',
                            filter === value
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground',
                            value === 'unpaid' && count > 0 && filter !== value
                            && 'border-orange-300 text-orange-600 hover:bg-orange-50'
                        )}
                    >
                        {label}
                        <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                            filter === value
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                        )}>
                            {count}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Liste des commandes ── */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                    <Receipt className="h-10 w-10 opacity-25"/>
                    <p className="text-sm">
                        {filter === 'all'
                            ? `Aucune commande le ${formatDateLabel(selectedDate).toLowerCase()}`
                            : 'Aucune commande pour ce filtre'
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
                    {filtered.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onStatusChange={handleStatusChange}
                            onRequestPay={() => setPayDialog(order)}
                            isLoading={loadingId === order.id}
                        />
                    ))}
                </div>
            )}

            <PaymentDialog
                order={payDialog}
                onClose={() => setPayDialog(null)}
                onConfirm={handleMarkPaid}
            />
        </div>
    )
}

// ============================================================
// CARTE COMMANDE
// ============================================================

function OrderCard({
                       order, onStatusChange, onRequestPay, isLoading,
                   }: {
    order: Order
    onStatusChange: (id: string, status: OrderStatus) => void
    onRequestPay: () => void
    isLoading: boolean
}) {
    const config = STATUS_CONFIG[order.status]
    const StatusIcon = config.icon
    const isPaid = order.payments.some(p => p.status === 'paid')
    const paidPayment = order.payments.find(p => p.status === 'paid')
    const isCancelled = order.status === 'cancelled'
    const isDelivered = order.status === 'delivered'
    const isCounter = order.source === 'counter'

    // Transitions libres disponibles (saut direct) — uniquement pour les commandes comptoir
    const freeTransitions = isCounter ? FREE_TRANSITIONS[order.status] : []

    const location = order.tableLabel
        || (order.table ? `Table ${order.table.number}` : null)
        || order.customerName
        || '—'

    return (
        <Card className={cn(
            'flex flex-col overflow-hidden transition-shadow',
            !isCancelled && 'hover:shadow-md',
            isCancelled && 'opacity-55'
        )}>

            {/* ── En-tête ── */}
            <div className="flex items-start justify-between px-4 pt-4 pb-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">
                            #{order.orderNumber ?? order.id.slice(-6).toUpperCase()}
                        </span>
                        <Badge variant="outline" className={cn('text-xs border font-medium', config.badgeClass)}>
                            <StatusIcon className="h-3 w-3 mr-1"/>
                            {config.label}
                        </Badge>
                        {!isCancelled && (
                            <Badge variant="outline" className={cn(
                                'text-xs font-medium',
                                isPaid
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-orange-50 text-orange-700 border-orange-200'
                            )}>
                                {isPaid ? '✓ Payé' : '⏳ Non payé'}
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {SOURCE_LABELS[order.source] ?? order.source}
                        {' · '}{location}
                        {' · '}{format(new Date(order.createdAt), 'HH:mm')}
                    </p>
                </div>
                <span className="font-bold text-sm text-primary shrink-0 ml-2">
                    {order.totalAmount.toLocaleString('fr-FR')} F
                </span>
            </div>

            <Separator/>

            {/* ── Articles ── */}
            <div className="px-4 py-3 flex flex-col gap-1.5">
                {order.orderItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                            <span
                                className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                                {item.quantity}
                            </span>
                            <span className="truncate">{item.productName}</span>
                        </div>
                        <span className="text-muted-foreground shrink-0 ml-2 text-xs">
                            {(item.unitPrice * item.quantity).toLocaleString('fr-FR')} F
                        </span>
                    </div>
                ))}
            </div>

            {order.notes && (
                <>
                    <Separator/>
                    <p className="px-4 py-2 text-xs text-muted-foreground italic">📝 {order.notes}</p>
                </>
            )}

            <Separator/>

            {/* ── Pied : paiement + actions ── */}
            <div className="px-4 py-3 flex items-center justify-between gap-2 flex-wrap">

                {/* Info paiement */}
                <span className="text-xs text-muted-foreground">
                    {isPaid && paidPayment
                        ? `💳 ${PAYMENT_METHOD_LABELS[paidPayment.method] ?? paidPayment.method}`
                        : isCancelled ? '' : '⚠ En attente de paiement'
                    }
                </span>

                <div className="flex items-center gap-2 ml-auto">

                    {/* Bouton Encaisser */}
                    {!isPaid && !isCancelled && (
                        <Button
                            size="sm" variant="outline"
                            onClick={onRequestPay}
                            disabled={isLoading}
                            className="text-xs h-7 border-orange-300 text-orange-600 hover:bg-orange-50"
                        >
                            Encaisser
                        </Button>
                    )}

                    {/* ── ACTIONS STATUT ──────────────────────────────────
                        Deux modes selon la source de la commande :

                        COMPTOIR (counter) : Dropdown avec accès libre à tous
                        les statuts disponibles. Permet de passer directement
                        de "En attente" à "Servie" pour un achat immédiat,
                        comme en caisse de supermarché.

                        AUTRES SOURCES (QR, lien public...) : Bouton linéaire
                        classique qui avance d'un cran à la fois.
                    ── */}

                    {!isCancelled && !isDelivered && (
                        isCounter && freeTransitions.length > 0 ? (

                            // ── Mode comptoir : dropdown libre ──
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={isLoading}
                                        className="text-xs h-7 gap-1"
                                    >
                                        {isLoading
                                            ? <RefreshCw className="h-3 w-3 animate-spin"/>
                                            : <>Changer statut <ChevronDown className="h-3 w-3 opacity-70"/></>
                                        }
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                        Choisir le statut
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator/>
                                    {freeTransitions.map(status => {
                                        const cfg = STATUS_CONFIG[status]
                                        const Icon = cfg.icon
                                        return (
                                            <DropdownMenuItem
                                                key={status}
                                                onClick={() => onStatusChange(order.id, status)}
                                                className={cn(
                                                    'gap-2 cursor-pointer',
                                                    // Mise en avant visuelle du statut "Servie"
                                                    // car c'est l'action la plus fréquente au comptoir
                                                    status === 'delivered' && 'font-medium text-primary',
                                                    status === 'cancelled' && 'text-destructive focus:text-destructive'
                                                )}
                                            >
                                                <Icon className="h-3.5 w-3.5"/>
                                                {cfg.label}

                                            </DropdownMenuItem>
                                        )
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>

                        ) : (

                            // ── Mode séquentiel : bouton linéaire (autres sources) ──
                            config.nextStatus && config.nextLabel && (
                                <Button
                                    size="sm"
                                    variant={order.status === 'ready' ? 'default' : 'secondary'}
                                    onClick={() => onStatusChange(order.id, config.nextStatus!)}
                                    disabled={isLoading}
                                    className="text-xs h-7"
                                >
                                    {isLoading
                                        ? <RefreshCw className="h-3 w-3 animate-spin"/>
                                        : config.nextLabel
                                    }
                                </Button>
                            )
                        )
                    )}
                </div>
            </div>
        </Card>
    )
}

// ============================================================
// DIALOG ENCAISSEMENT
// ============================================================

function PaymentDialog({
                           order, onClose, onConfirm,
                       }: {
    order: Order | null
    onClose: () => void
    onConfirm: (order: Order, method: PaymentMethod) => void
}) {
    return (
        <Dialog open={!!order} onOpenChange={open => !open && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Encaisser la commande</DialogTitle>
                    <DialogDescription>
                        {order && (
                            <>
                                Commande #{order.orderNumber ?? order.id.slice(-6).toUpperCase()}
                                {' · '}<strong>{order.totalAmount.toLocaleString('fr-FR')} FCFA</strong>
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 pt-2">
                    <p className="text-sm text-muted-foreground">Choisir le mode de paiement :</p>
                    {PAYMENT_METHODS.map(({value, label, icon: Icon}) => (
                        <Button
                            key={value}
                            variant="outline"
                            className="w-full justify-start gap-3 h-12"
                            onClick={() => order && onConfirm(order, value)}
                        >
                            <Icon className="h-4 w-4 text-muted-foreground"/>
                            {label}
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ============================================================
// CARTE STATISTIQUE
// ============================================================

function StatCard({
                      label, value, icon: Icon,
                      highlight = false, highlightClass = '',
                      isText = false, className = '',
                  }: {
    label: string; value: number | string; icon: React.ElementType
    highlight?: boolean; highlightClass?: string
    isText?: boolean; className?: string
}) {
    return (
        <Card className={cn('transition-all', highlight && highlightClass, className)}>
            <CardContent className="p-3 sm:p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5"/>
                    {label}
                </div>
                <p className={cn('font-bold', isText ? 'text-sm leading-tight' : 'text-2xl')}>
                    {value}
                </p>
            </CardContent>
        </Card>
    )
}