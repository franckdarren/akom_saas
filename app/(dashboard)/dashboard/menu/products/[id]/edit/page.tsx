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
import {Separator} from '@/components/ui/separator'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {ProductForm} from '../../product-form'
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
                                <BreadcrumbPage>Modifier</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="layout-page max-w-2xl">
                <Button asChild variant="ghost" size="sm" className="-ml-2">
                    <Link href="/dashboard/menu/products">
                        <ArrowLeft className="h-4 w-4 mr-1"/>
                        Retour aux {labels.productNameCapital}s
                    </Link>
                </Button>
                <PageHeader
                    title={`Modifier le ${labels.productName}`}
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