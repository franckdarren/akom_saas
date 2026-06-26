// components/sidebar/app-sidebar.tsx
'use client'

import * as React from "react"
import {useState} from "react"
import Link from "next/link"
import Image from 'next/image'
import {usePathname} from "next/navigation"
import {useNavigationLoading} from "@/lib/hooks/use-navigation-loading"
import {useSubscriptionFeatures} from "@/lib/hooks/use-subscription-features"
import {NavigationLoader} from "@/components/NavigationLoader"
import {signOut} from "@/lib/actions/auth"
import type {SubscriptionPlan, FeatureKey} from "@/lib/config/subscription"
import {getLabels} from "@/lib/config/activity-labels"
import type {ActivityType} from "@/lib/config/activity-labels"
import {MODULE_CATALOG, type ModuleKey} from "@/lib/config/modules"
import {ModulesQuickSheet} from "@/components/modules/ModulesQuickSheet"
import {RestaurantSwitcher} from "@/components/dashboard/RestaurantSwitcher"
import {Logo} from "@/components/ui/logo"

import {
    ChefHat,
    LayoutDashboard,
    Menu,
    Package,
    ShoppingCart,
    Users,
    Utensils,
    CreditCard,
    BarChart3,
    Settings,
    Crown,
    Building2,
    CalendarSync,
    LogOut,
    MessageSquare,
    FileText,
    CircleDollarSign,
    ChevronUp,
    ChevronDown,
    FileCheck,
    AlertCircle,
    ArrowRightLeft,
    Warehouse,
    Activity,
    User,
    Loader2,
    Wallet,
    Lock,
    TrendingUp,
    ClipboardList,
    LayoutGrid,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {Avatar, AvatarFallback} from "@/components/ui/avatar"
import {Badge} from "@/components/ui/badge"
import {useRestaurant} from "@/lib/hooks/use-restaurant"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {useRouter} from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "admin" | "kitchen" | "superadmin" | "cashier"

interface AppSidebarProps {
    user: { email: string; id: string }
    role: UserRole
    restaurantName?: string
    activityType?: ActivityType
    restaurantId?: string
    restaurantLogoUrl?: string
    currentPlan?: SubscriptionPlan
    onSignOut: () => void
    canAddMoreRestaurants?: boolean
    activeModules?: ModuleKey[]
}

interface MenuItem {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    badge?: string
    disabled?: boolean
    requiredFeature?: FeatureKey
    module?: ModuleKey // si défini, masqué si le module est désactivé
}

interface MenuGroup {
    title: string
    items: MenuItem[]
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function AppSidebar({
                               user,
                               role,
                               restaurantName,
                               activityType,
                               restaurantLogoUrl,
                               currentPlan,
                               canAddMoreRestaurants = false,
                               activeModules = [],
                           }: AppSidebarProps) {
    const pathname = usePathname()
    const {currentRestaurant} = useRestaurant()
    const {loading, startLoading} = useNavigationLoading()
    const [isSigningOut, setIsSigningOut] = useState(false)
    const [modulesSheetOpen, setModulesSheetOpen] = useState(false)
    const router = useRouter()
    const {isMobile, setOpenMobile} = useSidebar()

    const {hasFeature, getRequiredPlan, planName} = useSubscriptionFeatures(currentPlan)

    const labels = getLabels(activityType)

    const isPathActive = (itemHref: string, currentPath: string) =>
        itemHref === currentPath

    // Un item est visible si son module est actif (ou s'il n'a pas de module = toujours visible)
    const isModuleActive = (moduleKey?: ModuleKey): boolean => {
        if (!moduleKey) return true
        if (MODULE_CATALOG[moduleKey]?.isCore) return true
        return activeModules.includes(moduleKey)
    }

    async function handleSignOut() {
        if (isSigningOut) return
        setIsSigningOut(true)
        try {
            await signOut()
        } catch {
            setIsSigningOut(false)
        }
    }

    // ─── Menu config ──────────────────────────────────────────────────────────

    const menuConfig: Record<UserRole, MenuGroup[]> = {

        admin: [
            {
                title: "Général",
                items: [
                    {title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard},
                ],
            },
            {
                title: labels.catalogNameCapital,
                items: [
                    {title: labels.categoryNamePluralCapital, href: "/dashboard/menu/categories", icon: Menu, module: 'catalog' as ModuleKey},
                    {title: labels.productNameCapital + "s", href: "/dashboard/menu/products", icon: Utensils, module: 'catalog' as ModuleKey},
                ],
            },
            {
                title: "Opérations",
                items: [
                    {title: labels.tableNameCapital + "s", href: "/dashboard/tables", icon: Users, module: 'tables' as ModuleKey},
                    {title: labels.orderNamePluralCapital, href: "/dashboard/orders", icon: ShoppingCart, module: 'orders' as ModuleKey},
                    {
                        title: "Stocks",
                        href: "/dashboard/stocks",
                        icon: Package,
                        requiredFeature: 'stock_management',
                        module: 'stocks' as ModuleKey,
                    },
                    {title: "Transactions", href: "/dashboard/transactions", icon: ArrowRightLeft, module: 'transactions' as ModuleKey},
                    {title: "Abonnements", href: "/dashboard/subscription", icon: CalendarSync},
                    {
                        title: "Caisse",
                        href: "/dashboard/caisse",
                        icon: Wallet,
                        requiredFeature: 'caisse_module',
                        module: 'caisse' as ModuleKey,
                    },
                ],
            },
            {
                title: "Comptoir",
                items: [
                    {title: `${labels.orderGender === 'f' ? 'Nouvelle' : 'Nouveau'} ${labels.orderName}`, href: "/dashboard/pos", icon: ShoppingCart, module: 'pos' as ModuleKey},
                    {title: `${labels.orderNamePluralCapital} du jour`, href: "/dashboard/pos/orders", icon: ClipboardList, module: 'pos' as ModuleKey},
                ],
            },
            {
                title: "Entrepôt",
                items: [
                    {
                        title: "Accueil",
                        href: "/dashboard/warehouse",
                        icon: Warehouse,
                        requiredFeature: 'warehouse_module',
                        module: 'warehouse' as ModuleKey,
                    },
                    {
                        title: "Produits",
                        href: "/dashboard/warehouse/products/new",
                        icon: Package,
                        requiredFeature: 'warehouse_module',
                        module: 'warehouse' as ModuleKey,
                    },
                    {
                        title: "Mouvements",
                        href: "/dashboard/warehouse/movements",
                        icon: Activity,
                        requiredFeature: 'warehouse_module',
                        module: 'warehouse' as ModuleKey,
                    },
                    {
                        title: "Transferts",
                        href: "/dashboard/warehouse/transfers",
                        icon: ArrowRightLeft,
                        requiredFeature: 'warehouse_module',
                        module: 'warehouse' as ModuleKey,
                    },
                ],
            },
            {
                title: "Analyse",
                items: [
                    {
                        title: "Statistiques",
                        href: "/dashboard/stats",
                        icon: BarChart3,
                        requiredFeature: 'advanced_stats',
                        module: 'stats' as ModuleKey,
                    },
                ],
            },
            {
                title: "Configuration",
                items: [
                    {
                        title: "Paramètres",
                        href: currentRestaurant?.id
                            ? `/dashboard/restaurants/${currentRestaurant.id}/settings`
                            : "#",
                        icon: Settings,
                    },
                    {
                        title: "Modules",
                        href: "/dashboard/settings/modules",
                        icon: LayoutGrid,
                    },
                    {
                        title: "Utilisateurs",
                        href: "/dashboard/users",
                        icon: Users,
                        disabled: !currentRestaurant,
                    },
                    {title: "Support", href: "/dashboard/support", icon: MessageSquare},
                ],
            },
        ],

        kitchen: [
            {
                title: "Cuisine",
                items: [
                    {title: labels.orderNamePluralCapital, href: "/dashboard/orders", icon: ChefHat, badge: "New"},
                    {title: "Support", href: "/dashboard/support", icon: MessageSquare},
                ],
            },
        ],

        cashier: [
            {
                title: "Comptoir",
                items: [
                    {title: `${labels.orderGender === 'f' ? 'Nouvelle' : 'Nouveau'} ${labels.orderName}`, href: "/dashboard/pos", icon: ShoppingCart},
                    {title: `${labels.orderNamePluralCapital} du jour`, href: "/dashboard/pos/orders", icon: ClipboardList},
                    {title: "Support", href: "/dashboard/support", icon: MessageSquare},
                ],
            },
        ],

        superadmin: [
            {
                title: "Administration",
                items: [
                    {title: "Vue d'ensemble", href: "/superadmin", icon: Crown},
                    {title: "Restaurants", href: "/superadmin/restaurants", icon: Building2},
                    {title: "Utilisateurs", href: "/superadmin/users", icon: Users},
                    {title: "Statistiques", href: "/superadmin/stats", icon: BarChart3},
                    {title: "Support", href: "/superadmin/support", icon: MessageSquare},
                    {title: "Logs", href: "/superadmin/logs", icon: FileText},
                    {title: "Abonnements", href: "/superadmin/payments", icon: CircleDollarSign},
                    {title: "Vérifications", href: "/superadmin/verifications", icon: FileCheck},
                    {title: "Fiches circuit", href: "/superadmin/circuit-sheets", icon: FileText},
                    {title: "Suspendus", href: "/superadmin/suspended", icon: AlertCircle},
                ],
            },
        ],
    }

    const menuItems = menuConfig[role]
    const initials = user.email.split("@")[0].substring(0, 2).toUpperCase()

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <TooltipProvider>
            <NavigationLoader loading={loading}/>

            {isSigningOut && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                        <p className="text-sm text-muted-foreground font-medium">Déconnexion en cours...</p>
                    </div>
                </div>
            )}

            <Sidebar>
                {/* ── Header : switcher multi-structure ── */}
                <SidebarHeader className="px-2 py-3">
                    {role === 'superadmin' ? (
                        // Superadmin : affichage simple sans switcher
                        <Link
                            href="/superadmin"
                            onClick={() => {
                                if (pathname !== "/superadmin") startLoading()
                                if (isMobile) setOpenMobile(false)
                            }}
                            className="flex items-center gap-2 px-1"
                        >
                            <Logo size="sm" variant="color" />
                        </Link>
                    ) : (
                        // Utilisateurs normaux : switcher multi-structure
                        <RestaurantSwitcher
                            canAddMore={canAddMoreRestaurants}
                            variant="sidebar"
                        />
                    )}


                </SidebarHeader>

                {/* ── Plan badge sous le header ── */}
                {role !== 'superadmin' && (
                    <div className="px-3 py-1.5 border-b flex justify-between items-center">
                        <div className="flex items-center">
                            <span className="text-sm text-muted-foreground">
                                Plan {'  '}
                                <span className="text-md font-semibold capitalize text-foreground">
                                    {planName}
                                </span>
                            </span>
                        </div>
                    </div>
                )}

                {/* ── Menu ── */}
                <SidebarContent>
                    {menuItems.map((group, i) => {
                        // Filtrer les items dont le module est désactivé
                        const visibleItems = group.items.filter(item => isModuleActive(item.module))
                        // Masquer le groupe entier s'il n'a plus d'items visibles
                        if (visibleItems.length === 0) return null

                        return (
                        <SidebarGroup key={i}>
                            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {visibleItems.map((item) => {
                                        const isActive = isPathActive(item.href, pathname)
                                        const isFeatureLocked = item.requiredFeature
                                            ? !hasFeature(item.requiredFeature)
                                            : false
                                        const isDisabled = item.disabled || isFeatureLocked
                                        const requiredPlan = item.requiredFeature
                                            ? getRequiredPlan(item.requiredFeature)
                                            : null

                                        return (
                                            <SidebarMenuItem key={item.href}>
                                                {isFeatureLocked ? (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div>
                                                                <SidebarMenuButton
                                                                    disabled
                                                                    className="opacity-60 cursor-not-allowed"
                                                                >
                                                                    <div className="flex items-center gap-2 w-full">
                                                                        <item.icon className="h-4 w-4"/>
                                                                        <span>{item.title}</span>
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="ml-auto bg-primary/10 text-primary hover:bg-primary/20"
                                                                        >
                                                                            <Lock className="h-3 w-3 mr-1"/>
                                                                            {requiredPlan && requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
                                                                        </Badge>
                                                                    </div>
                                                                </SidebarMenuButton>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="max-w-xs">
                                                            <div className="space-y-2">
                                                                <p className="font-semibold">Feature Premium</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {item.title} est disponible à partir du plan{' '}
                                                                    <span className="font-semibold capitalize">
                                                                        {requiredPlan}
                                                                    </span>.
                                                                </p>
                                                                <Link
                                                                    href="/dashboard/subscription/choose-plan"
                                                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                                >
                                                                    <TrendingUp className="h-3 w-3"/>
                                                                    Passer au plan supérieur
                                                                </Link>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    <SidebarMenuButton
                                                        asChild={!isDisabled}
                                                        isActive={isActive}
                                                        disabled={isDisabled}
                                                        className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                                                    >
                                                        {isDisabled ? (
                                                            <div className="flex items-center gap-2">
                                                                <item.icon className="h-4 w-4"/>
                                                                <span>{item.title}</span>
                                                            </div>
                                                        ) : (
                                                            <Link
                                                                href={item.href}
                                                                onClick={() => {
                                                                    if (pathname !== item.href) startLoading()
                                                                    if (isMobile) setOpenMobile(false)
                                                                }}
                                                                className="flex items-center gap-2 w-full"
                                                            >
                                                                <item.icon className="h-4 w-4"/>
                                                                <span>{item.title}</span>
                                                                {item.badge && (
                                                                    <Badge variant="secondary" className="ml-auto">
                                                                        {item.badge}
                                                                    </Badge>
                                                                )}
                                                            </Link>
                                                        )}
                                                    </SidebarMenuButton>
                                                )}
                                            </SidebarMenuItem>
                                        )
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                        )
                    })}
                </SidebarContent>

                {/* ── Bouton accès rapide modules (admin uniquement) ── */}
                {role === 'admin' && (
                    <>
                        <div className="px-3 py-2 border-t">
                            <button
                                onClick={() => setModulesSheetOpen(true)}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                                <span>Personnaliser le menu</span>
                            </button>
                        </div>
                        <ModulesQuickSheet
                            restaurantId={currentRestaurant?.id ?? ''}
                            activeModules={activeModules}
                            open={modulesSheetOpen}
                            onOpenChange={setModulesSheetOpen}
                        />
                    </>
                )}

                {/* ── Footer : profil utilisateur ── */}
                <SidebarFooter>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted rounded-md transition"
                                disabled={isSigningOut}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate capitalize">{role}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>

                                <span className="flex flex-col gap-2 items-center justify-center text-muted-foreground">
                                    <ChevronUp className="h-3 w-3 -mb-1"/>
                                    <ChevronDown className="h-3 w-3 -mt-1"/>
                                </span>
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent side="top" align="start" className="w-56">
                            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>

                            <DropdownMenuItem onClick={() => {
                                startLoading()
                                router.push('/update-password')
                            }}>
                                <User className="mr-2 h-4 w-4"/>
                                Changer mot de passe
                            </DropdownMenuItem>

                            <DropdownMenuSeparator/>

                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                disabled={isSigningOut}
                                onSelect={(e) => {
                                    e.preventDefault()
                                    handleSignOut()
                                }}
                            >
                                {isSigningOut ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        Déconnexion...
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="mr-2 h-4 w-4"/>
                                        Déconnexion
                                    </>
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarFooter>
            </Sidebar>
        </TooltipProvider>
    )
}