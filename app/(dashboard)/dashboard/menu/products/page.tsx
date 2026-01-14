// app/(dashboard)/dashboard/menu/products/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Plus, Zap } from 'lucide-react'
import { ProductsList } from './products-list'
import { QuickCreateProductDialog } from './quick-create-product-dialog'
import { getUserRole } from "@/lib/actions/auth"

export default async function ProductsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const userRole = await getUserRole()


    // Récupérer le restaurant de l'utilisateur
    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
    })

    if (!restaurantUser) {
        redirect('/onboarding')
    }

    // Récupérer tous les produits avec leurs catégories et stocks
    const products = await prisma.product.findMany({
        where: { restaurantId: restaurantUser.restaurantId },
        include: {
            category: {
                select: { name: true },
            },
            stock: {
                select: { quantity: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    // Récupérer les catégories actives pour la modale
    const categories = await prisma.category.findMany({
        where: {
            restaurantId: restaurantUser.restaurantId,
            isActive: true,
        },
        orderBy: { position: 'asc' },
    })

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Menu</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Produits</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <div className="border-black text-right leading-tight text-sm">
                    {
                        userRole === "admin" && <p className="truncate font-medium">Administrateur</p>
                    }
                    {
                        userRole === "kitchen" && <p className="truncate font-medium">Cuisine</p>
                    }
                    <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
                        <p className="text-muted-foreground mt-2">
                            Gérez tous les produits de votre menu
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <QuickCreateProductDialog categories={categories}>
                            <Button variant="outline">
                                <Zap className="mr-2 h-4 w-4" />
                                Création rapide
                            </Button>
                        </QuickCreateProductDialog>
                        <Link href="/dashboard/menu/products/new">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nouveau produit
                            </Button>
                        </Link>
                    </div>
                </div>

                <ProductsList products={products} />
            </div>
        </>
    )
}