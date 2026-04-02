// app/(dashboard)/dashboard/warehouse/products/new/page.tsx
import {Metadata} from 'next'
import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {WarehouseProductForm} from '@/components/warehouse/WarehouseProductForm'
import {FeatureGuard} from '@/components/guards/FeatureGuard'
import {SidebarTrigger} from "@/components/ui/sidebar"
import {Separator} from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import {ArrowLeft} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {PageHeader} from '@/components/ui/page-header'

export const metadata: Metadata = {
    title: "Nouveau produit d'entrepôt | Akôm",
    description: 'Ajoutez un nouveau produit à votre magasin de stockage',
}

export default async function NewWarehouseProductPage() {
    const {restaurantId} = await getCurrentUserAndRestaurant()

    // Récupérer les produits du menu
    const menuProducts = await prisma.product.findMany({
        where: {
            restaurantId,
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

    // ============================================================
    // PROTECTION : Vérifier que l'utilisateur a accès au module warehouse
    // ============================================================

    return (
        <FeatureGuard
            restaurantId={restaurantId}
            requiredFeature="warehouse_module"
            showError={true}
        >
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/warehouse">Magasin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Créer un produit d&#39;entrepôt</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="layout-page">
                <Button asChild variant="ghost" size="sm" className="-ml-2">
                    <Link href="/dashboard/warehouse">
                        <ArrowLeft className="h-4 w-4 mr-1"/>
                        Retour au magasin
                    </Link>
                </Button>
                <PageHeader
                    title="Nouveau produit d'entrepôt"
                    description="Ajoutez un produit que vous stockez en volume dans votre entrepôt"
                />

                <WarehouseProductForm availableProducts={menuProducts}/>
            </div>
        </FeatureGuard>
    )
}