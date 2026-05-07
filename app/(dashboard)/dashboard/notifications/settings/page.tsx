import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { redirect } from 'next/navigation'
import { AppInsetHeader } from '@/components/layout/AppInsetHeader'
import { createClient } from '@/lib/supabase/server'
import { getMyNotificationPreferences } from '@/lib/actions/notifications'
import { NotificationSettingsClient } from './notification-settings-client'

export default async function NotificationSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const prefs = await getMyNotificationPreferences()

    return (
        <>
            <AppInsetHeader>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Tableau de bord</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/notifications">Notifications</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Préférences</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </AppInsetHeader>

            <div className="layout-page">
                <NotificationSettingsClient initialPrefs={prefs} />
            </div>
        </>
    )
}
