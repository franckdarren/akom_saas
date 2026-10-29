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
import type {SubscriptionPlan, FeatureKey} from "@/lib/config/subscription"
import {getLabels} from "@/lib/config/activity-labels"
import type {ActivityType} from "@/lib/config/activity-labels"
import {MODULE_CATALOG, type ModuleKey} from "@/lib/config/modules"
import {ModulesQuickSheet} from "@/components/modules/ModulesQuickSheet"
import {RestaurantSwitcher} from "@/components/dashboard/RestaurantSwitcher"
import {GuidedTour, type TourStep} from "@/components/dashboard/GuidedTour"
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
    MessageSquare,
    FileText,
    CircleDollarSign,
    FileCheck,
    AlertCircle,
    ArrowRightLeft,
    Warehouse,
    Activity,
    Wallet,
    Lock,
    TrendingUp,
    ClipboardList,
    Coins,
    ClipboardCheck,
    LayoutGrid,
    Compass,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
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
import {Badge} from "@/components/ui/badge"
import {useRestaurant} from "@/lib/hooks/use-restaurant"

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "admin" | "kitchen" | "superadmin" | "cashier"

interface AppSidebarProps {
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
    description: string // texte de l'étape correspondante dans la visite guidée
}

interface MenuGroup {
    title: string
    items: MenuItem[]
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function AppSidebar({
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
    const [modulesSheetOpen, setModulesSheetOpen] = useState(false)
    const [isTourOpen, setIsTourOpen] = useState(false)
    const {isMobile, setOpenMobile, setOpen} = useSidebar()

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

    // ─── Menu config ──────────────────────────────────────────────────────────
    // `description` alimente la visite guidée : chaque entrée du menu y a son étape.

    const supportDescription = "Contactez l'équipe Akôm ou suivez vos tickets de support."
    const posItems: MenuItem[] = [
        {
            title: `${labels.orderGender === 'f' ? 'Nouvelle' : 'Nouveau'} ${labels.orderName}`,
            href: "/dashboard/pos",
            icon: ShoppingCart,
            description: `Prenez une ${labels.orderName} rapidement au comptoir : sélectionnez les ${labels.productNamePlural}, puis enregistrez le paiement reçu (espèces, Airtel Money, Moov Money ou carte).`,
        },
        {
            title: `${labels.orderNamePluralCapital} du jour`,
            href: "/dashboard/pos/orders",
            icon: ClipboardList,
            description: `Retrouvez les ${labels.orderNamePlural} du comptoir, jour par jour.`,
        },
        {
            title: "Monnaie due",
            href: "/dashboard/pos/monnaie-due",
            icon: Coins,
            description: "Suivez la monnaie non rendue aux clients. Une monnaie due peut aussi être déduite d'un prochain achat grâce à son code.",
        },
    ]

    const menuConfig: Record<UserRole, MenuGroup[]> = {

        admin: [
            {
                title: "Général",
                items: [
                    {
                        title: "Tableau de bord",
                        href: "/dashboard",
                        icon: LayoutDashboard,
                        description: `Vue d'ensemble de votre ${labels.structureName} : chiffre d'affaires, graphiques d'activité et synthèse financière.`,
                    },
                ],
            },
            {
                title: labels.catalogNameCapital,
                items: [
                    {
                        title: labels.categoryNamePluralCapital,
                        href: "/dashboard/menu/categories",
                        icon: Menu,
                        module: 'catalog' as ModuleKey,
                        description: `Organisez votre ${labels.catalogName} en ${labels.categoryNamePlural}, puis en familles pour affiner le classement.`,
                    },
                    {
                        title: labels.productNameCapital + "s",
                        href: "/dashboard/menu/products",
                        icon: Utensils,
                        module: 'catalog' as ModuleKey,
                        description: `Créez et gérez vos ${labels.productNamePlural} (prix en FCFA, photo…). Ils apparaissent dans votre ${labels.catalogName} en ligne.`,
                    },
                ],
            },
            {
                title: "Opérations",
                items: [
                    {
                        title: labels.tableNameCapital + "s",
                        href: "/dashboard/tables",
                        icon: Users,
                        module: 'tables' as ModuleKey,
                        description: `Gérez les ${labels.tableNamePlural} de votre ${labels.structureName} et générez leurs QR codes : vos clients scannent et commandent directement.`,
                    },
                    {
                        title: labels.orderNamePluralCapital,
                        href: "/dashboard/orders",
                        icon: ShoppingCart,
                        module: 'orders' as ModuleKey,
                        description: `Suivez en temps réel toutes les ${labels.orderNamePlural} (QR code, lien public, comptoir) et faites évoluer leur statut.`,
                    },
                    {
                        title: "Stocks",
                        href: "/dashboard/stocks",
                        icon: Package,
                        requiredFeature: 'stock_management',
                        module: 'stocks' as ModuleKey,
                        description: `Ajustez les quantités en stock. Les ${labels.productNamePlural} avec un stock supérieur à 0 sont automatiquement disponibles.`,
                    },
                    {
                        title: "Inventaire",
                        href: "/dashboard/inventory",
                        icon: ClipboardCheck,
                        requiredFeature: 'stock_management',
                        module: 'stocks' as ModuleKey,
                        description: "Lancez des sessions de comptage physique du stock et obtenez un rapport des écarts avec le stock théorique.",
                    },
                    {
                        title: "Transactions",
                        href: "/dashboard/transactions",
                        icon: ArrowRightLeft,
                        module: 'transactions' as ModuleKey,
                        description: "Vue centralisée de tous les flux d'argent : entrées, sorties et résultat net.",
                    },
                    {
                        title: "Abonnements",
                        href: "/dashboard/subscription",
                        icon: CalendarSync,
                        description: `Consultez l'abonnement de votre ${labels.structureName}, renouvelez-le ou changez de plan.`,
                    },
                    {
                        title: "Caisse",
                        href: "/dashboard/caisse",
                        icon: Wallet,
                        requiredFeature: 'caisse_module',
                        module: 'caisse' as ModuleKey,
                        description: "Ouvrez et clôturez vos sessions de caisse, contrôlez le solde et consultez l'historique.",
                    },
                ],
            },
            {
                title: "Comptoir",
                items: posItems.map(item => ({...item, module: 'pos' as ModuleKey})),
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
                        description: `Gérez votre magasin de stockage et réapprovisionnez le stock opérationnel de votre ${labels.structureName}.`,
                    },
                    {
                        title: "Produits",
                        href: "/dashboard/warehouse/products/new",
                        icon: Package,
                        requiredFeature: 'warehouse_module',
                        module: 'warehouse' as ModuleKey,
                        description: "Ajoutez les produits que vous stockez en volume dans votre entrepôt.",
                    },
                    {
                        title: "Mouvements",
                        href: "/dashboard/warehouse/movements",
                        icon: Activity,
                        requiredFeature: 'warehouse_module',
                        module: 'warehouse' as ModuleKey,
                        description: "Historique complet de tous les mouvements d'entrepôt.",
                    },
                    {
                        title: "Transferts",
                        href: "/dashboard/warehouse/transfers",
                        icon: ArrowRightLeft,
                        requiredFeature: 'warehouse_module',
                        module: 'warehouse' as ModuleKey,
                        description: "Historique des transferts du magasin vers votre stock opérationnel.",
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
                        description: `Analysez vos performances : chiffre d'affaires, ${labels.orderNamePlural}, panier moyen et alertes stock.`,
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
                        description: `Gérez les informations et les documents de votre ${labels.structureName}.`,
                    },
                    {
                        title: "Modules",
                        href: "/dashboard/settings/modules",
                        icon: LayoutGrid,
                        description: "Activez uniquement les modules dont vous avez besoin : le menu s'adapte en temps réel.",
                    },
                    {
                        title: "Utilisateurs",
                        href: "/dashboard/users",
                        icon: Users,
                        disabled: !currentRestaurant,
                        description: `Gérez les membres de votre ${labels.structureName}, leurs rôles et leurs permissions.`,
                    },
                    {title: "Support", href: "/dashboard/support", icon: MessageSquare, description: supportDescription},
                ],
            },
        ],

        kitchen: [
            {
                title: "Cuisine",
                items: [
                    {
                        title: labels.orderNamePluralCapital,
                        href: "/dashboard/orders",
                        icon: ChefHat,
                        badge: "New",
                        description: `Les ${labels.orderNamePlural} arrivent ici en temps réel : faites évoluer leur statut au fil de la préparation.`,
                    },
                    {title: "Support", href: "/dashboard/support", icon: MessageSquare, description: supportDescription},
                ],
            },
        ],

        cashier: [
            {
                title: "Comptoir",
                items: [
                    ...posItems,
                    {title: "Support", href: "/dashboard/support", icon: MessageSquare, description: supportDescription},
                ],
            },
        ],

        superadmin: [
            {
                title: "Administration",
                items: [
                    {title: "Vue d'ensemble", href: "/superadmin", icon: Crown, description: "Vue globale de la plateforme Akôm : structures, commandes, abonnements et vérifications."},
                    {title: "Structures", href: "/superadmin/restaurants", icon: Building2, description: "Toutes les structures inscrites sur la plateforme et leur fiche détaillée."},
                    {title: "Utilisateurs", href: "/superadmin/users", icon: Users, description: "Tous les utilisateurs de la plateforme."},
                    {title: "Statistiques", href: "/superadmin/stats", icon: BarChart3, description: "Analyse détaillée de l'activité de la plateforme."},
                    {title: "Support", href: "/superadmin/support", icon: MessageSquare, description: "Gérez les tickets de support client."},
                    {title: "Logs", href: "/superadmin/logs", icon: FileText, description: "Historique des événements système."},
                    {title: "Abonnements", href: "/superadmin/payments", icon: CircleDollarSign, description: "Validez ou refusez les paiements manuels d'abonnement."},
                    {title: "Vérifications", href: "/superadmin/verifications", icon: FileCheck, description: "Validez ou rejetez les documents d'identité soumis par les structures."},
                    {title: "Fiches circuit", href: "/superadmin/circuit-sheets", icon: FileText, description: "Vérifiez et validez les fiches circuit soumises par les structures sous offre Business."},
                    {title: "Suspendus", href: "/superadmin/suspended", icon: AlertCircle, description: "Gérez les structures dont le compte a été suspendu."},
                ],
            },
        ],
    }

    const menuItems = menuConfig[role]

    // ─── Visite guidée ────────────────────────────────────────────────────────

    // Précise pourquoi une fonctionnalité n'est pas accessible (module désactivé / plan requis)
    function getTourNote(item: MenuItem): string | undefined {
        const notes: string[] = []
        if (item.module && !isModuleActive(item.module)) {
            notes.push(`Module désactivé : activez « ${MODULE_CATALOG[item.module].label} » dans Configuration › Modules pour l'afficher.`)
        }
        if (item.requiredFeature && !hasFeature(item.requiredFeature)) {
            const plan = getRequiredPlan(item.requiredFeature)
            notes.push(`Disponible à partir du plan ${plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'supérieur'}.`)
        }
        return notes.length > 0 ? notes.join(' ') : undefined
    }

    const tourSteps: TourStep[] = [
        {
            title: "Bienvenue sur Akôm 👋",
            description: "Cette visite présente, une à une, toutes les fonctionnalités auxquelles vous avez accès. Avancez avec les boutons ou les flèches du clavier, et quittez à tout moment avec Échap.",
        },
        ...(role !== 'superadmin' ? [
            {
                target: "structure",
                title: `Votre ${labels.structureName}`,
                description: "Basculez d'une structure commerciale à l'autre ou ajoutez-en une nouvelle depuis ce sélecteur.",
            },
            {
                target: "plan",
                title: "Votre plan",
                description: "Le plan d'abonnement actif. Les fonctionnalités marquées d'un cadenas sont disponibles sur un plan supérieur.",
            },
        ] : []),
        // Toutes les entrées du menu, y compris celles masquées par un module désactivé
        ...menuItems.flatMap(group => group.items.map(item => ({
            target: item.href,
            title: `${group.title} › ${item.title}`,
            description: item.description,
            note: getTourNote(item),
        }))),
        ...(role === 'admin' ? [{
            target: "modules-shortcut",
            title: "Personnaliser le menu",
            description: "Raccourci pour activer ou masquer des modules sans quitter la page en cours.",
        }] : []),
        {
            target: "notifications",
            title: "Notifications",
            description: "Vos alertes et messages au même endroit. Vous pouvez choisir comment être notifié pour chaque événement.",
        },
        {
            target: "theme",
            title: "Thème",
            description: "Passez l'interface en mode clair, sombre ou suivez le réglage de votre appareil.",
        },
        {
            target: "account",
            title: "Mon compte",
            description: "Changez votre mot de passe ou déconnectez-vous.",
        },
        {
            target: "guided-tour",
            title: "C'est terminé !",
            description: "Vous pouvez relancer cette visite guidée à tout moment depuis ce bouton.",
        },
    ]

    function startTour() {
        // Sur mobile, la sidebar est une sheet modale : on la ferme et les étapes s'affichent centrées
        if (isMobile) setOpenMobile(false)
        else setOpen(true)
        setIsTourOpen(true)
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <TooltipProvider>
            <NavigationLoader loading={loading}/>

            <Sidebar>
                {/* ── Header : switcher multi-structure ── */}
                <SidebarHeader className="px-2 py-3" data-tour="structure">
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
                    <div className="px-3 py-1.5 border-b border-sidebar-border flex justify-between items-center" data-tour="plan">
                        <div className="flex items-center">
                            <span className="text-sm text-sidebar-foreground/70">
                                Plan {'  '}
                                <span className="text-md font-semibold capitalize text-sidebar-foreground">
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
                                            <SidebarMenuItem key={item.href} data-tour={item.href}>
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

                    {/* ── Visite guidée (tous rôles) + accès rapide modules (admin uniquement) ──
                        Dans la zone scrollable : défile avec le menu au lieu de rester figé */}
                    <div className="mt-auto px-3 py-2 border-t border-sidebar-border">
                        <button
                            type="button"
                            onClick={startTour}
                            data-tour="guided-tour"
                            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                        >
                            <Compass className="h-3.5 w-3.5 shrink-0" />
                            <span>Visite guidée</span>
                        </button>
                        {role === 'admin' && (
                            <button
                                type="button"
                                onClick={() => setModulesSheetOpen(true)}
                                data-tour="modules-shortcut"
                                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                            >
                                <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                                <span>Personnaliser le menu</span>
                            </button>
                        )}
                    </div>
                </SidebarContent>

                {role === 'admin' && (
                    <ModulesQuickSheet
                        restaurantId={currentRestaurant?.id ?? ''}
                        activeModules={activeModules}
                        open={modulesSheetOpen}
                        onOpenChange={setModulesSheetOpen}
                    />
                )}

            </Sidebar>

            {isTourOpen && (
                <GuidedTour steps={tourSteps} onClose={() => setIsTourOpen(false)}/>
            )}
        </TooltipProvider>
    )
}