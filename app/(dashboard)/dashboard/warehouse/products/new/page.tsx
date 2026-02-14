// app/(dashboard)/dashboard/warehouse/products/new/page.tsx
import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { getCurrentUserAndRestaurant } from '@/lib/auth/session'
import { WarehouseProductForm } from '@/components/warehouse/WarehouseProductForm'
import {SidebarTrigger} from "@/components/ui/sidebar";
import {Separator} from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
    title: "Nouveau produit d'entrepôt | Akôm",
    description:
        'Ajoutez un nouveau produit à votre magasin de stockage',
}

export default async function NewWarehouseProductPage() {
    const { restaurantId } = await getCurrentUserAndRestaurant()

    // ⚠️ Suppression de isActive, on ne filtre que par restaurantId
    const menuProducts = await prisma.product.findMany({
        where: {
            restaurantId,
            // Si ton modèle a un champ pour indiquer l'activité, remplace ici :
            // isAvailable: true
        },
        select: {
            id: true,
            name: true,
            imageUrl: true,
        },
        orderBy: {
            name: 'asc',
        },
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
                                <BreadcrumbLink href="/dashboard">Magasin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Créer un produit d&#39;entrepot</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Nouveau produit d&#39;entrepôt
                    </h1>

                    <p className="text-muted-foreground mt-1">
                        Ajoutez un produit que vous stockez en volume
                        dans votre entrepôt
                    </p>
                </div>

                <WarehouseProductForm
                    availableProducts={menuProducts}
                />
            </div>
        </>
    )
}
