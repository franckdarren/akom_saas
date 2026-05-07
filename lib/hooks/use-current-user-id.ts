'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function useCurrentUserId(): string | null {
    const [userId, setUserId] = useState<string | null>(null)
    useEffect(() => {
        createClient().auth.getSession().then(({ data }) => {
            setUserId(data.session?.user.id ?? null)
        })
    }, [])
    return userId
}
