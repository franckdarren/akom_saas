import {getTicketById, getTicketMessages} from '@/lib/actions/support'
import {notFound, redirect} from 'next/navigation'
import {TicketChatView} from '@/components/superadmin/support/TicketChatView'
import {getSuperadminUser} from '@/lib/auth/superadmin'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {SidebarTrigger} from '@/components/ui/sidebar'
import {Separator} from '@/components/ui/separator'

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage({
                                                   params,
                                               }: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = await params
    const ticketId = resolvedParams.id

    const user = await getSuperadminUser()
    if (!user) redirect('/login')

    const ticketResult = await getTicketById(ticketId)
    if (!ticketResult.success || !ticketResult.ticket) {
        notFound()
    }

    const messagesResult = await getTicketMessages(ticketId)

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1"/>
                    <Separator orientation="vertical" className="mr-2 h-4"/>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/superadmin">
                                    SuperAdmin
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block"/>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/superadmin/support">
                                    Support
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block"/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    {ticketResult.ticket.subject}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-6 mb-5">
                <TicketChatView
                    ticket={ticketResult.ticket}
                    initialMessages={messagesResult.messages || []}
                />
            </div>
        </>
    )
}