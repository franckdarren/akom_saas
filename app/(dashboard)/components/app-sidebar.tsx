// app/components/app-sidebar.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import Image from 'next/image'
import { usePathname } from "next/navigation"
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

    SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useRestaurant } from "@/lib/hooks/use-restaurant"
import { sign } from "crypto"
import { DashboardHeader } from "../dashboard/components/DashboardHeader"
import { User } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


type UserRole = "admin" | "kitchen" | "superadmin"

interface AppSidebarProps {
    user: {
        email: string
        id: string
    }
    role: UserRole
    restaurantName?: string
    restaurantId?: string
    restaurantLogoUrl?: string


    onSignOut: () => void
}

export function AppSidebar({ user, role, restaurantName, restaurantLogoUrl, onSignOut }: AppSidebarProps) {
    const pathname = usePathname()
    const { currentRestaurant } = useRestaurant() // Récupérer le restaurant actuel

    // 🆕 Configuration des menus par rôle (déplacée à l'intérieur pour accéder à currentRestaurant)
    const menuConfig: Record<UserRole, Array<{
        title: string
        items: Array<{
            title: string
            href: string
            icon: React.ComponentType<{ className?: string }>
            badge?: string
            disabled?: boolean
        }>
    }>> = {
        admin: [
            {
                title: "Général",
                items: [
                    { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
                ],
            },
            {
                title: "Menu",
                items: [
                    { title: "Catégories", href: "/dashboard/menu/categories", icon: Menu },
                    { title: "Produits", href: "/dashboard/menu/products", icon: Utensils },
                ],
            },
            {
                title: "Opérations",
                items: [
                    { title: "Tables", href: "/dashboard/tables", icon: Users },
                    { title: "Commandes", href: "/dashboard/orders", icon: ShoppingCart },
                    { title: "Stocks", href: "/dashboard/stocks", icon: Package },
                    { title: "Paiements", href: "/dashboard/payments", icon: CreditCard },
                    { title: "Abonnements", href: "/dashboard/subscription", icon: CalendarSync },
                ],
            },
            {
                title: "Magasin",
                items: [
                    {
                        title: "Vue d'ensemble",
                        href: "/dashboard/warehouse",
                        icon: Warehouse
                    },
                    {
                        title: "Produits entrepôt",
                        href: "/dashboard/warehouse/products/new",
                        icon: Package
                    },
                    {
                        title: "Mouvements",
                        href: "/dashboard/warehouse/movements",
                        icon: Activity
                    },
                    {
                        title: "Transferts vers restaurant",
                        href: "/dashboard/warehouse/transfers",
                        icon: ArrowRightLeft
                    },
                ],
            },
            {
                title: "Analyse",
                items: [
                    { title: "Statistiques", href: "/dashboard/stats", icon: BarChart3 },
                ],
            },
            {
                title: "Configuration", // 🆕 Nouvelle section
                items: [
                    {
                        title: "Paramètres",
                        href: currentRestaurant?.id
                            ? `/dashboard/restaurants/${currentRestaurant.id}/settings`
                            : '#',
                        icon: Settings,
                    },
                    {
                        title: "Utilisateurs",
                        href: '/dashboard/users',
                        icon: Users,
                        disabled: !currentRestaurant, // Désactivé si pas de restaurant
                    },
                ],
            },
        ],
        kitchen: [
            {
                title: "Cuisine",
                items: [
                    { title: "Commandes", href: "/dashboard/orders", icon: ChefHat, badge: "New" },
                ],
            },
        ],
        superadmin: [
            {
                title: "Administration",
                items: [
                    { title: "Vue d'ensemble", href: "/superadmin", icon: Crown },
                    { title: "Restaurants", href: "/superadmin/restaurants", icon: Building2 },
                    { title: "Utilisateurs", href: "/superadmin/users", icon: Users },
                    { title: "Statistiques", href: "/superadmin/stats", icon: BarChart3 },
                    { title: "Support", href: "/superadmin/support", icon: MessageSquare },
                    { title: "Logs", href: "/superadmin/logs", icon: FileText },
                    { title: "Abonnements", href: "/superadmin/payments", icon: CircleDollarSign },
                    { title: "Vérifications", href: "/superadmin/verifications", icon: FileCheck },
                    { title: "Fiches circuit", href: "/superadmin/circuit-sheets", icon: FileText },
                    { title: "Suspendus", href: "/superadmin/suspended", icon: AlertCircle },

                ],
            },
        ],
    }

    const menuItems = menuConfig[role]

    // Initiales pour l'avatar
    const initials = user.email
        .split("@")[0]
        .substring(0, 2)
        .toUpperCase()

    // Badge du rôle
    const roleBadge = {
        admin: { label: "Admin", variant: "default" as const },
        kitchen: { label: "Cuisine", variant: "secondary" as const },
        superadmin: { label: "Super Admin", variant: "destructive" as const },
    }[role]

    return (
        <Sidebar>
            <SidebarHeader className="px-1 py-4 flex-row justify-between items-center">
                <Link href="/dashboard" className="flex items-center gap-1">
                    {restaurantLogoUrl && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground">
                            <Image
                                src={restaurantLogoUrl}
                                width={100}
                                height={100}
                                alt="logo"
                            />
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{restaurantName}</span>
                    </div>
                </Link>
                <DashboardHeader />
            </SidebarHeader>

            <SidebarContent>
                {menuItems.map((group, i) => (
                    <SidebarGroup key={i}>
                        <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href
                                    const isDisabled = item.disabled

                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild={!isDisabled}
                                                isActive={isActive}
                                                disabled={isDisabled}
                                                className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                            >
                                                {isDisabled ? (
                                                    <div className="flex items-center gap-2">
                                                        <item.icon className="h-4 w-4" />
                                                        <span>{item.title}</span>
                                                    </div>
                                                ) : (
                                                    <Link href={item.href}>
                                                        <item.icon className="h-4 w-4" />
                                                        <span>{item.title}</span>
                                                        {item.badge && (
                                                            <Badge variant="secondary" className="ml-auto">
                                                                {item.badge}
                                                            </Badge>
                                                        )}
                                                    </Link>
                                                )}
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className="">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted rounded-md transition">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">
                                    {role}
                                </p>
                                <p className="text-sm font-light truncate">
                                    {user.email}
                                </p>
                            </div>
                            {/* Icône double chevron */}
                            <span className="flex flex-col gap-2 items-center justify-center text-muted-foreground">
                                <ChevronUp className="h-3 w-3 -mb-1" />
                                <ChevronDown className="h-3 w-3 -mt-1" />
                            </span>

                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        side="top"
                        align="start"
                        className="w-56"
                    >
                        <DropdownMenuLabel>Mon compte</DropdownMenuLabel>

                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            Profil
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Paramètres
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={onSignOut}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Déconnexion
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>

        </Sidebar>
    )
}