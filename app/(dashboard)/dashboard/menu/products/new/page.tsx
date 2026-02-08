// app/(dashboard)/dashboard/menu/products/new/page.tsx
import { redirect } from 'next/navigation'
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
import { ProductForm } from '../product-form'
import { getUserRole } from "@/lib/actions/auth"


export default async function NewProductPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const userRole = await getUserRole()

    if (!user) {
        redirect('/login')
    }

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
    })

    if (!restaurantUser) {
        redirect('/onboarding')
    }

    // Récupérer les catégories pour le select
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
                                <BreadcrumbPage>Nouveau</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4 max-w-2xl">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nouveau produit</h1>
                    <p className="text-muted-foreground mt-2">
                        Ajoutez un nouveau produit à votre menu
                    </p>
                </div>

                <ProductForm categories={categories} />
            </div>
        </>
    )
}