// app/(dashboard)/dashboard/warehouse/products/[id]/edit/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getCurrentUserAndRestaurant } from '@/lib/auth/session'
import prisma from '@/lib/prisma'
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
    title: "Modifier produit d'entrepôt | Akôm",
    description:
        "Modifiez les informations d'un produit de votre magasin de stockage",
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditWarehouseProductPage({
                                                           params,
                                                       }: PageProps) {
    const { id } = await params
    const { restaurantId } = await getCurrentUserAndRestaurant()

    const productFromDb = await prisma.warehouseProduct.findUnique({
        where: {
            id,
            restaurantId,
        },
        include: {
            stock: true,
            linkedProduct: true,
        },
    })

    if (!productFromDb) {
        notFound()
    }

    // 🔥 SERIALIZATION COMPLETE (IMPORTANT)
    const stockData = productFromDb.stock?.[0] ?? null

    const product = {
        ...productFromDb,
        conversionRatio: Number(productFromDb.conversionRatio),

        stock: stockData
            ? {
                ...stockData,
                quantity: Number(stockData.quantity),
                alertThreshold: Number(stockData.alertThreshold),
                unitCost: stockData.unitCost !== null ? Number(stockData.unitCost) : null,
                totalValue:
                    stockData.unitCost != null
                        ? Number(stockData.quantity) * Number(stockData.unitCost)
                        : null,
                lastInventoryDate: stockData.lastInventoryDate ?? null,
                updatedAt: stockData.updatedAt ?? new Date(),
            }
            : null, // si pas de stock
    }


    const menuProducts = await prisma.product.findMany({
        where: {
            restaurantId,
            isAvailable: true,
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
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/warehouse">Magasin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Magasin de stockage</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">

            {/* Title */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Modifier le produit d&#39;entrepôt
                </h1>
                <p className="text-muted-foreground mt-1">
                    Mettez à jour les informations de {product.name}
                </p>
            </div>

            {/* Info box */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4">
                <div className="flex gap-3">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-5 w-5 text-blue-600 dark:text-blue-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            À propos des modifications de stock
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Le stock et le coût unitaire ne peuvent pas être
                            modifiés directement ici. Utilisez les actions
                            "Entrée de stock" ou "Ajustement d'inventaire"
                            depuis la page du produit pour garantir la
                            traçabilité complète.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <WarehouseProductForm
                initialData={product}
                availableProducts={menuProducts}
            />
            </div>
        </>
    )
}
