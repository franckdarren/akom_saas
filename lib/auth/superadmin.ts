// lib/auth/superadmin.ts
import { createClient } from '@/lib/supabase/server'

export async function isSuperadmin(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
        return false
    }

    const superadminEmails =
        process.env.SUPER_ADMIN_EMAILS?.split(',') || []

    return superadminEmails
        .map(e => e.trim().toLowerCase())
        .includes(user.email.toLowerCase())
}

export async function getSuperadminUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) return null

    const superadminEmails =
        process.env.SUPER_ADMIN_EMAILS?.split(',') || []

    const isSuperAdmin = superadminEmails
        .map(e => e.trim().toLowerCase())
        .includes(user.email.toLowerCase())

    return isSuperAdmin ? user : null
}
