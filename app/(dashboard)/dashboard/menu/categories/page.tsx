// app/(dashboard)/dashboard/menu/categories/page.tsx
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
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CategoriesList } from './categories-list'
import { CreateCategoryDialog } from './create-category-dialog'

export default async function CategoriesPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Récupérer le restaurant de l'utilisateur
    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
    })

    if (!restaurantUser) {
        redirect('/onboarding')
    }

    // Récupérer toutes les catégories
    const categories = await prisma.category.findMany({
        where: { restaurantId: restaurantUser.restaurantId },
        orderBy: { position: 'asc' },
        include: {
            _count: {
                select: { products: true },
            },
        },
    })

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Tableau de bord</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Catégories</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Catégories</h1>
                        <p className="text-muted-foreground mt-2">
                            Organisez votre menu en catégories (Plats, Boissons, Desserts...)
                        </p>
                    </div>
                    <CreateCategoryDialog>
                        <Button className='cursor-pointer'>
                            <Plus className="mr-2 h-4 w-4" />
                            Nouvelle catégorie
                        </Button>
                    </CreateCategoryDialog>
                </div>

                <CategoriesList categories={categories} />
            </div>
        </>
    )
}

