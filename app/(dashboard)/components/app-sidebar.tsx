// app/components/app-sidebar.tsx
"use client"

import * as React from "react"
import Link from "next/link"
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

type UserRole = "admin" | "kitchen" | "superadmin"

interface AppSidebarProps {
    user: {
        email: string
        id: string
    }
    role: UserRole
    restaurantName?: string
    onSignOut: () => void
}

// Configuration des menus par rôle
const menuConfig: Record<UserRole, Array<{
    title: string
    items: Array<{
        title: string
        href: string
        icon: React.ComponentType<{ className?: string }>
        badge?: string
    }>
}>> = {
    admin: [
        {
            title: "Général",
            items: [
                { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
                { title: "Restaurants", href: "/dashboard/restaurants", icon: Building2 },
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

export function AppSidebar({ user, role, restaurantName, onSignOut }: AppSidebarProps) {
    const pathname = usePathname()
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <ChefHat className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-lg">Akôm</span>
                        {restaurantName && (
                            <span className="text-xs text-muted-foreground">{restaurantName}</span>
                        )}
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
                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton asChild isActive={isActive}>
                                                <Link href={item.href}>
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                    {item.badge && (
                                                        <Badge variant="secondary" className="ml-auto">
                                                            {item.badge}
                                                        </Badge>
                                                    )}
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className="border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center gap-3 px-2 py-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.email}</p>
                                <Badge variant={roleBadge.variant} className="mt-1">
                                    {roleBadge.label}
                                </Badge>
                            </div>
                        </div>
                    </SidebarMenuItem>
                    <Separator />
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={onSignOut}>
                            <LogOut className="h-4 w-4" />
                            <span>Déconnexion</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}