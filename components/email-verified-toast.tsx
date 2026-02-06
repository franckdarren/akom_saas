// components/email-verified-toast.tsx
'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner' // ou ton système de toast préféré

export function EmailVerifiedToast() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const verified = searchParams.get('verified')

    useEffect(() => {
        if (verified === 'true') {
            toast.success('Email confirmé avec succès !', {
                description: 'Bienvenue sur Akôm, vous pouvez maintenant utiliser toutes les fonctionnalités.'
            })
            
            // Nettoyer l'URL pour éviter de réafficher le toast
            const url = new URL(window.location.href)
            url.searchParams.delete('verified')
            router.replace(url.pathname + url.search, { scroll: false })
        }
    }, [verified, router])

    return null
}