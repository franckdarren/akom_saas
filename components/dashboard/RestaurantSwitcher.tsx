// components/dashboard/RestaurantSwitcher.tsx
'use client'

import {useState, useTransition, useRef} from 'react'
import {useRouter} from 'next/navigation'
import {useRestaurant} from '@/lib/hooks/use-restaurant'
import {useNavigationLoading} from '@/lib/hooks/use-navigation-loading'
import {
    Building2, ChevronDown, ChevronUp, Plus, Check,
    Loader2, Crown, Utensils, Store, Car, Bus,
    Wrench, Hotel, Scissors, Settings,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {cn} from '@/lib/utils'
import {getRoleBadge} from '@/lib/utils/permissions'
import type {RestaurantWithRole} from '@/types/auth'
import type {ActivityType} from '@/lib/config/activity-labels'
import {AddRestaurantModal} from './AddRestaurantModal'

function ActivityIcon({type, className}: {type?: ActivityType | string | null; className?: string}) {
    const props = {className: cn('h-3.5 w-3.5', className)}
    switch (type) {
        case 'restaurant':     return <Utensils {...props} />
        case 'retail':         return <Store {...props} />
        case 'vehicle_rental': return <Car {...props} />
        case 'transport':      return <Bus {...props} />
        case 'service_rental': return <Wrench {...props} />
        case 'hotel':          return <Hotel {...props} />
        case 'beauty':         return <Scissors {...props} />
        default:               return <Building2 {...props} />
    }
}

function PlanBadge({plan}: {plan?: string}) {
    if (!plan) return null
    const styles: Record<string, string> = {
        premium:  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        business: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        starter:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    }
    return (
        <span className={cn(
            'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
            styles[plan] ?? styles.starter
        )}>
            {plan === 'premium' && <Crown className="mr-0.5 h-2.5 w-2.5"/>}
            {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </span>
    )
}

interface RestaurantSwitcherProps {
    canAddMore?: boolean
    variant?: 'sidebar' | 'header'
}

export function RestaurantSwitcher({canAddMore = false, variant = 'sidebar'}: RestaurantSwitcherProps) {
    const router = useRouter()
    const {startLoading} = useNavigationLoading()
    const {restaurants, currentRestaurant, setCurrentRestaurant, hasMultipleRestaurants, loading} = useRestaurant()

    const [open, setOpen]             = useState(false)
    const [modalOpen, setModalOpen]   = useState(false)
    const [switching, startSwitching] = useTransition()

    // ✅ Empêche la double ouverture de la modale après router.refresh()
    const pendingModalRef = useRef(false)

    function handleSwitch(restaurant: RestaurantWithRole) {
        if (restaurant.id === currentRestaurant?.id) { setOpen(false); return }
        startSwitching(() => {
            setCurrentRestaurant(restaurant)
            document.cookie = `akom_current_restaurant_id=${restaurant.id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
            setOpen(false)
            startLoading()
            router.refresh()
        })
    }

    function handleManage(restaurantId: string) {
        setOpen(false)
        startLoading()
        router.push(`/dashboard/restaurants/${restaurantId}/settings`)
    }

    function handleOpenModal() {
        // Guard : n'ouvrir qu'une seule fois même si le composant re-render
        if (pendingModalRef.current || modalOpen) return
        pendingModalRef.current = true
        setOpen(false)
        setTimeout(() => {
            pendingModalRef.current = false
            setModalOpen(true)
        }, 120)
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md animate-pulse">
                <div className="h-7 w-7 rounded-md bg-muted shrink-0"/>
                <div className="h-3 w-28 rounded bg-muted"/>
            </div>
        )
    }

    if (!currentRestaurant) return null

    const showChevron = hasMultipleRestaurants || canAddMore

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <button className={cn(
                        'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left text-sm',
                        'hover:bg-accent hover:text-accent-foreground transition-colors duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        switching && 'opacity-60 pointer-events-none'
                    )}>
                        {switching ? (
                            <Loader2 className="h-4 w-4 animate-spin shrink-0"/>
                        ) : (
                            <>
                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
                                    <ActivityIcon
                                        type={currentRestaurant.activityType}
                                        className="h-3.5 w-3.5 text-primary"
                                    />
                                </div>

                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-semibold leading-tight max-w-[140px]">
                                        {currentRestaurant.name}
                                    </span>
                                    {hasMultipleRestaurants && (
                                        <span className="text-[10px] text-muted-foreground leading-tight">
                                            {restaurants.length} structures
                                        </span>
                                    )}
                                </div>

                                {showChevron && (
                                    <div className="ml-auto shrink-0 text-muted-foreground">
                                        {open
                                            ? <ChevronUp className="h-3.5 w-3.5"/>
                                            : <ChevronDown className="h-3.5 w-3.5"/>
                                        }
                                    </div>
                                )}
                            </>
                        )}
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-72 max-w-[calc(100vw-2rem)] p-1.5" align="start" side="bottom" sideOffset={4}>
                    <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Mes structures ({restaurants.length})
                    </DropdownMenuLabel>

                    <div className="mt-1 space-y-0.5">
                        {restaurants.map((restaurant) => {
                            const isActive = restaurant.id === currentRestaurant.id
                            const sub = restaurant.subscription

                            return (
                                <div key={restaurant.id}>
                                    <DropdownMenuItem
                                        onSelect={() => handleSwitch(restaurant)}
                                        className={cn(
                                            'flex items-center gap-3 rounded-md px-2 py-2.5 cursor-pointer focus:bg-accent',
                                            isActive && 'bg-accent'
                                        )}
                                    >
                                        <div className={cn(
                                            'flex h-8 w-8 items-center justify-center rounded-md shrink-0',
                                            isActive
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground'
                                        )}>
                                            <ActivityIcon
                                                type={restaurant.activityType}
                                                className="h-4 w-4"
                                            />
                                        </div>

                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className={cn(
                                                    'truncate text-sm max-w-[110px]',
                                                    isActive ? 'font-semibold' : 'font-medium'
                                                )}>
                                                    {restaurant.name}
                                                </span>
                                                {sub && <PlanBadge plan={sub.plan}/>}
                                            </div>
                                            <span className="text-[11px] text-muted-foreground capitalize">
                                                {restaurant.activityType?.replace('_', ' ') ?? 'restaurant'}
                                                {' · '}
                                                {getRoleBadge(restaurant.role).label}
                                            </span>
                                        </div>

                                        {isActive ? (
                                            <Check className="ml-auto h-4 w-4 text-primary shrink-0"/>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleManage(restaurant.id)
                                                }}
                                                className="ml-auto shrink-0 rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
                                                title="Paramètres"
                                            >
                                                <Settings className="h-3.5 w-3.5"/>
                                            </button>
                                        )}
                                    </DropdownMenuItem>
                                </div>
                            )
                        })}
                    </div>

                    {canAddMore && (
                        <>
                            <DropdownMenuSeparator className="my-1.5"/>
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault()
                                    handleOpenModal()
                                }}
                                className="flex items-center gap-3 rounded-md px-2 py-2.5 cursor-pointer text-primary focus:text-primary focus:bg-primary/10"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
                                    <Plus className="h-4 w-4 text-primary"/>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Nouvelle structure</span>
                                    <span className="text-[11px] text-muted-foreground">
                                        Restaurant, boutique, service…
                                    </span>
                                </div>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AddRestaurantModal
                open={modalOpen}
                onOpenChange={(next) => {
                    // ✅ Reset le guard quand la modale se ferme
                    if (!next) pendingModalRef.current = false
                    setModalOpen(next)
                }}
            />
        </>
    )
}