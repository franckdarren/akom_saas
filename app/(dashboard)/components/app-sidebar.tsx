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
    LogOut,
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
                ],
            },
            {
                title: "Système",
                items: [
                    { title: "Paramètres", href: "/superadmin/settings", icon: Settings },
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
            <SidebarHeader className="border-b px-6 py-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground">
                        {restaurantLogoUrl && (
                            <Image
                                src={restaurantLogoUrl}
                                width={50}
                                height={50}
                                alt="logo"
                            />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-lg">{restaurantName}</span>
                    </div>
                </Link>
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

            <SidebarFooter className="border-t bg-background/50">
                <SidebarMenu>
                    {/* Logout */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={onSignOut}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="font-medium">Déconnexion</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}