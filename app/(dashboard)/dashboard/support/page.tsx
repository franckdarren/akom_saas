import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {SupportPageClient} from './support-page-client'
import {AppInsetHeader} from '@/components/layout/AppInsetHeader'

export default async function SupportPage({
    searchParams,
}: {
    searchParams: Promise<{ ticket?: string }>
}) {
    const { ticket } = await searchParams

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
                            <BreadcrumbPage>Support</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </AppInsetHeader>

            <div className="layout-page">
                <SupportPageClient initialTicketId={ticket} />
            </div>
        </>
    )
}
