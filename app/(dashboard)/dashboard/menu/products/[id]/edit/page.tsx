// app/(dashboard)/dashboard/menu/products/[id]/edit/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from "@/lib/actions/auth"
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
import { ProductForm } from '../../product-form'

export default async function EditProductPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const userRole = await getUserRole()

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
    })

    if (!restaurantUser) {
        redirect('/onboarding')
    }

    // Récupérer le produit
    const product = await prisma.product.findUnique({
        where: {
            id,
            restaurantId: restaurantUser.restaurantId, // Sécurité
        },
    })

    if (!product) {
        notFound()
    }

    // Récupérer les catégories
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
                                <BreadcrumbLink href="/dashboard">Tableau de bord</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/menu/products">Produits</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Modifier</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <div className="border-black text-right leading-tight text-sm hidden sm:block">
                    {
                        userRole === "admin" && <p className="truncate font-medium">Administrateur</p>
                    }
                    {
                        userRole === "kitchen" && <p className="truncate font-medium">Cuisine</p>
                    }
                    <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                </div>
            </header >

            <div className="flex flex-1 flex-col gap-4 p-4 max-w-2xl">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Modifier le produit</h1>
                    <p className="text-muted-foreground mt-2">{product.name}</p>
                </div>

                <ProductForm categories={categories} product={product} />
            </div>
        </>
    )
}