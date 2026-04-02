// app/(dashboard)/dashboard/menu/categories/[id]/families/page.tsx
import { redirect, notFound } from 'next/navigation'
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
import { FamiliesList } from './families-list'
import { CreateFamilyDialog } from './create-family-dialog'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {PageHeader} from '@/components/ui/page-header'

/**
 * Page de gestion des familles pour une catégorie spécifique
 * 
 * Cette page affiche toutes les familles d'une catégorie donnée et permet de :
 * - Créer de nouvelles familles
 * - Modifier des familles existantes
 * - Réorganiser l'ordre des familles
 * - Activer/désactiver des familles
 * - Supprimer des familles (avec protection si produits liés)
 * 
 * Route : /dashboard/menu/categories/[id]/families
 * Exemple : /dashboard/menu/categories/abc-123/families
 */
export default async function CategoryFamiliesPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    // Récupération de l'ID de la catégorie depuis l'URL
    const { id: categoryId } = await params
    
    const supabase = await createClient()

    // Vérification de l'authentification
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Récupération du restaurant de l'utilisateur
    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
    })

    if (!restaurantUser) {
        redirect('/onboarding')
    }

    // ✅ ÉTAPE 1 : Vérifier que la catégorie existe et appartient au restaurant
    // C'est une sécurité importante : on ne veut pas qu'un utilisateur puisse
    // accéder aux familles d'une catégorie d'un autre restaurant
    const category = await prisma.category.findUnique({
        where: {
            id: categoryId,
            restaurantId: restaurantUser.restaurantId, // Sécurité RLS
        },
        select: {
            id: true,
            name: true,
            description: true,
        },
    })

    // Si la catégorie n'existe pas ou n'appartient pas au restaurant, 404
    if (!category) {
        notFound()
    }

    // ✅ ÉTAPE 2 : Charger toutes les familles de cette catégorie
    // On inclut aussi le compteur de produits pour chaque famille
    // Cela permet d'afficher "X produits" dans chaque carte de famille
    // et aussi de protéger contre la suppression d'une famille qui a des produits
    const families = await prisma.family.findMany({
        where: {
            categoryId: categoryId,
            restaurantId: restaurantUser.restaurantId, // Double sécurité
        },
        include: {
            _count: {
                select: {
                    products: true, // Compter combien de produits utilisent cette famille
                },
            },
        },
        orderBy: { position: 'asc' }, // Respecter l'ordre défini par l'utilisateur
    })

    return (
        <>
            {/* Header avec fil d'Ariane */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">
                                    Tableau de bord
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/menu/categories">
                                    Catégories
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{category.name}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            {/* Contenu principal */}
            <div className="layout-page">
                <Button asChild variant="ghost" size="sm" className="-ml-2">
                    <Link href="/dashboard/menu/categories">
                        <ArrowLeft className="h-4 w-4 mr-1"/>
                        Retour aux catégories
                    </Link>
                </Button>
                <PageHeader
                    title={`Familles de ${category.name}`}
                    description={category.description || 'Organisez vos produits en familles pour faciliter la navigation dans votre menu'}
                    action={
                        <CreateFamilyDialog
                            categoryId={categoryId}
                            categoryName={category.name}
                        >
                            <Button>+ Nouvelle famille</Button>
                        </CreateFamilyDialog>
                    }
                />

                {/* Liste des familles OU message si vide */}
                {families.length === 0 ? (
                    // État vide : aucune famille créée
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-lg">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                            <svg
                                className="h-6 w-6 text-muted-foreground"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">
                            Aucune famille pour le moment
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground max-w-md">
                            Les familles permettent de mieux organiser vos produits au sein d&apos;une catégorie.
                            Par exemple, dans &quot;{category.name}&quot;, vous pourriez créer des familles comme 
                            &quot;Grillades&quot;, &quot;Pâtes&quot;, ou &quot;Ragoûts&quot;.
                        </p>
                        <div className="mt-6">
                            <CreateFamilyDialog 
                                categoryId={categoryId}
                                categoryName={category.name}
                            >
                                <Button>+ Créer ma première famille</Button>
                            </CreateFamilyDialog>
                        </div>
                    </div>
                ) : (
                    // Liste des familles existantes
                    <FamiliesList families={families} categoryName={category.name} />
                )}

                {/* Informations supplémentaires en bas de page */}
                {families.length > 0 && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <h3 className="text-sm font-medium mb-2">💡 À savoir</h3>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>
                                Les familles sont optionnelles : vos produits peuvent exister sans être liés à une famille
                            </li>
                            <li>
                                Vous pouvez réorganiser l&apos;ordre des familles avec les boutons ↑ et ↓
                            </li>
                            <li>
                                Une famille ne peut être supprimée que si aucun produit ne l&apos;utilise
                            </li>
                            <li>
                                Les familles désactivées restent liées aux produits existants mais n&apos;apparaissent plus 
                                dans le menu client
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </>
    )
}