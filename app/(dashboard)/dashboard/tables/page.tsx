// app/(dashboard)/dashboard/tables/page.tsx
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
import { TablesList } from './tables-list'
import { CreateTableDialog } from './create-table-dialog'
import { getUserRole } from "@/lib/actions/auth"

export default async function TablesPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const userRole = await getUserRole()

    if (!user) {
        redirect('/login')
    }

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
    })

    if (!restaurantUser) {
        redirect('/onboarding')
    }

    // Récupérer toutes les tables
    const tables = await prisma.table.findMany({
        where: { restaurantId: restaurantUser.restaurantId },
        orderBy: { number: 'asc' },
        include: {
            _count: {
                select: {
                    orders: {
                        where: {
                            status: { in: ['pending', 'preparing', 'ready'] },
                        },
                    },
                },
            },
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
                                <BreadcrumbLink href="/dashboard">Tableau de bord</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Tables</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <div className="border-black text-right leading-tight text-sm">
                    {
                        userRole === "admin" && <p className="truncate font-medium">Administrateur</p>
                    }
                    {
                        userRole === "kitchen" && <p className="truncate font-medium">Cuisine</p>
                    }
                    <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tables</h1>
                        <p className="text-muted-foreground mt-2">
                            Gérez les tables de votre restaurant et générez les QR codes
                        </p>
                    </div>
                    <CreateTableDialog>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nouvelle table
                        </Button>
                    </CreateTableDialog>
                </div>

                <TablesList tables={tables} />
            </div>
        </>
    )
}