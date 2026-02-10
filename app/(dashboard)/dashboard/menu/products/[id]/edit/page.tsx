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

    // ✅ OPTIMISATION : Charger le produit, les catégories ET les familles en parallèle
    // Cela réduit le temps de chargement total de la page
    const [product, categories, families] = await Promise.all([
        // ✅ MODIFICATION 1 : Récupérer le produit avec son familyId
        // Ce champ est essentiel pour pré-sélectionner la bonne famille dans le formulaire
        prisma.product.findUnique({
            where: {
                id,
                restaurantId: restaurantUser.restaurantId, // Sécurité RLS
            },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                categoryId: true,
                familyId: true, // ← NOUVEAU : on récupère la famille actuelle du produit
                imageUrl: true,
            },
        }),

        // Récupérer toutes les catégories actives
        prisma.category.findMany({
            where: {
                restaurantId: restaurantUser.restaurantId,
                isActive: true,
            },
            orderBy: { position: 'asc' },
        }),

        // ✅ MODIFICATION 2 : Récupérer toutes les familles actives du restaurant
        // On les charge toutes pour que le ProductForm puisse filtrer dynamiquement
        // selon la catégorie sélectionnée par l'utilisateur
        prisma.family.findMany({
            where: {
                restaurantId: restaurantUser.restaurantId,
                isActive: true,
            },
            orderBy: { position: 'asc' },
            select: {
                id: true,
                name: true,
                categoryId: true, // ← CRUCIAL : permet le filtrage dans ProductForm
                position: true,
                isActive: true,
            },
        }),
    ])

    // Si le produit n'existe pas ou n'appartient pas au restaurant, 404
    if (!product) {
        notFound()
    }

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
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4 max-w-2xl">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Modifier le produit</h1>
                    <p className="text-muted-foreground mt-2">{product.name}</p>
                </div>

                {/* ✅ MODIFICATION FINALE : On passe maintenant trois props au ProductForm
                    - categories : la liste des catégories pour le premier select
                    - families : toutes les familles (filtrées dynamiquement côté client)
                    - product : les données existantes du produit, incluant familyId
                    
                    Le ProductForm va :
                    1. Pré-sélectionner la catégorie actuelle (product.categoryId)
                    2. Pré-sélectionner la famille actuelle (product.familyId) si elle existe
                    3. Filtrer les familles disponibles selon la catégorie
                    4. Si l'utilisateur change de catégorie, réinitialiser la famille
                       si elle n'est plus compatible
                */}
                <ProductForm 
                    categories={categories} 
                    families={families}
                    product={product} 
                />
            </div>
        </>
    )
}