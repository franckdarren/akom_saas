// app/(dashboard)/dashboard/warehouse/products/new/page.tsx
import {Metadata} from 'next'
import prisma from '@/lib/prisma'
import {getCurrentUserAndRestaurant} from '@/lib/auth/session'
import {WarehouseProductForm} from '@/components/warehouse/WarehouseProductForm'
import {FeatureGuard} from '@/components/guards/FeatureGuard'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import {ArrowLeft} from 'lucide-react'
import {AppInsetHeader} from '@/components/layout/AppInsetHeader'
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
            <AppInsetHeader>
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
            </AppInsetHeader>

            <div className="layout-page">
                <Button asChild variant="ghost" size="sm" className="-ml-2.5 self-start">
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