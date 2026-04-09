// app/(dashboard)/dashboard/menu/products/new/page.tsx
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {Separator} from '@/components/ui/separator'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {ProductForm} from '../product-form'
import {getUserRole} from "@/lib/actions/auth"
import {getLabels} from "@/lib/config/activity-labels" // ← NOUVEAU
import {ArrowLeft} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {PageHeader} from '@/components/ui/page-header'

export default async function NewProductPage() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    const userRole = await getUserRole()

    if (!user) redirect('/login')

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
        include: {
            restaurant: {
                select: {activityType: true}, // ← NOUVEAU
            },
        },
    })

    if (!restaurantUser) redirect('/onboarding')

    // ← Calcul des labels
    const labels = getLabels(restaurantUser.restaurant.activityType)

    const [categories, families] = await Promise.all([
        prisma.category.findMany({
            where: {
                restaurantId: restaurantUser.restaurantId,
                isActive: true,
            },
            orderBy: {position: 'asc'},
        }),
        prisma.family.findMany({
            where: {
                restaurantId: restaurantUser.restaurantId,
                isActive: true,
            },
            orderBy: {position: 'asc'},
            select: {
                id: true,
                name: true,
                categoryId: true,
                position: true,
                isActive: true,
            },
        }),
    ])

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1"/>
                <Separator orientation="vertical" className="mr-2 h-4"/>
                <div className="flex justify-between w-full">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Tableau de bord</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                {/* ← Label dynamique */}
                                <BreadcrumbLink href="/dashboard/menu/products">
                                    {labels.productNameCapital}s
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Nouveau</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="layout-page max-w-2xl">
                <Button asChild variant="ghost" size="sm" className="-ml-2.5 self-start">
                    <Link href="/dashboard/menu/products">
                        <ArrowLeft className="h-4 w-4 mr-1"/>
                        Retour aux {labels.productNameCapital}s
                    </Link>
                </Button>
                <PageHeader
                    title={`Nouveau ${labels.productName}`}
                    description={`Ajoutez un ${labels.productName} à votre ${labels.catalogName}`}
                />

                <ProductForm
                    categories={categories}
                    families={families}
                />
            </div>
        </>
    )
}