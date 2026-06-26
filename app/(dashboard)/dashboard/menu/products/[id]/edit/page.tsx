// app/(dashboard)/dashboard/menu/products/[id]/edit/page.tsx
import {redirect, notFound} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import {getUserRole} from "@/lib/actions/auth"
import prisma from '@/lib/prisma'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {ProductForm} from '../../product-form'
import {AppInsetHeader} from '@/components/layout/AppInsetHeader'
import {getLabels} from "@/lib/config/activity-labels" // ← NOUVEAU
import {ArrowLeft} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {PageHeader} from '@/components/ui/page-header'

export default async function EditProductPage({
                                                  params,
                                              }: {
    params: Promise<{ id: string }>
}) {
    const {id} = await params
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const userRole = await getUserRole()

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

    const [product, categories, families] = await Promise.all([
        prisma.product.findUnique({
            where: {
                id,
                restaurantId: restaurantUser.restaurantId,
            },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                categoryId: true,
                familyId: true,
                imageUrl: true,
                productType: true,
                includePrice: true,
                hasStock: true,
            },
        }),
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

    if (!product) notFound()

    return (
        <>
            <AppInsetHeader>
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
                            <BreadcrumbPage>Modifier</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </AppInsetHeader>

            <div className="layout-page max-w-2xl">
                <Button asChild variant="ghost" size="sm" className="-ml-2.5 self-start">
                    <Link href="/dashboard/menu/products">
                        <ArrowLeft className="h-4 w-4 mr-1"/>
                        Retour aux {labels.productNamePlural}
                    </Link>
                </Button>
                <PageHeader
                    title={labels.editProductLabel}
                    description={product.name}
                />

                <ProductForm
                    categories={categories}
                    families={families}
                    product={product}
                    labels={labels} // ← NOUVEAU
                />
            </div>
        </>
    )
}