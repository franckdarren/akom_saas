'use client'

import { useState, useEffect } from 'react'

const CONSENT_COOKIE_NAME = 'akom_cookie_consent'

interface CookiePreferences {
    necessary: boolean
    analytics: boolean
    marketing: boolean
}

interface CookieConsent {
    version: string
    timestamp: string
    preferences: CookiePreferences
}

/**
 * Hook pour accéder aux préférences de cookies de l'utilisateur
 * Permet de vérifier si l'utilisateur a accepté certaines catégories
 */
export function useCookieConsent() {
    const [consent, setConsent] = useState<CookieConsent | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        try {
            const stored = localStorage.getItem(CONSENT_COOKIE_NAME)
            if (stored) {
                setConsent(JSON.parse(stored))
            }
        } catch (error) {
            console.error('Erreur lecture consentement cookies:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    /**
     * Vérifier si une catégorie de cookies a été acceptée
     */
    const hasConsent = (category: keyof CookiePreferences): boolean => {
        if (!consent) return false
        return consent.preferences[category] === true
    }

    /**
     * Vérifier si l'utilisateur a donné son consentement
     */
    const hasGivenConsent = (): boolean => {
        return consent !== null
    }

    return {
        consent,
        loading,
        hasConsent,
        hasGivenConsent,
        preferences: consent?.preferences || null,
    }
}