'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Cookie, Shield, BarChart3, Target } from 'lucide-react'

/**
 * Types de cookies et leur configuration
 */
interface CookieCategory {
    id: string
    name: string
    description: string
    required: boolean
    icon: React.ComponentType<{ className?: string }>
}

const COOKIE_CATEGORIES: CookieCategory[] = [
    {
        id: 'necessary',
        name: 'Cookies nécessaires',
        description:
            'Ces cookies sont essentiels au fonctionnement du site. Ils permettent la navigation, la sécurité et l\'authentification. Ils ne peuvent pas être désactivés.',
        required: true,
        icon: Shield,
    },
    {
        id: 'analytics',
        name: 'Cookies analytiques',
        description:
            'Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site afin d\'améliorer l\'expérience utilisateur et les performances.',
        required: false,
        icon: BarChart3,
    },
    {
        id: 'marketing',
        name: 'Cookies marketing',
        description:
            'Ces cookies sont utilisés pour personnaliser les publicités et mesurer l\'efficacité de nos campagnes marketing.',
        required: false,
        icon: Target,
    },
]

const CONSENT_COOKIE_NAME = 'akom_cookie_consent'
const CONSENT_VERSION = '1.0' // À incrémenter si vos pratiques changent

export function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [preferences, setPreferences] = useState({
        necessary: true,
        analytics: false,
        marketing: false,
    })

    // Vérifier si l'utilisateur a déjà donné son consentement
    useEffect(() => {
        const consent = getStoredConsent()
        
        if (!consent || consent.version !== CONSENT_VERSION) {
            // Pas de consentement ou version obsolète → afficher la bannière
            setShowBanner(true)
        } else {
            // Consentement valide → appliquer les préférences
            setPreferences(consent.preferences)
            applyConsent(consent.preferences)
        }
    }, [])

    /**
     * Récupérer le consentement stocké
     */
    function getStoredConsent() {
        try {
            const stored = localStorage.getItem(CONSENT_COOKIE_NAME)
            return stored ? JSON.parse(stored) : null
        } catch {
            return null
        }
    }

    /**
     * Sauvegarder le consentement
     */
    function saveConsent(prefs: typeof preferences) {
        const consent = {
            version: CONSENT_VERSION,
            timestamp: new Date().toISOString(),
            preferences: prefs,
        }
        localStorage.setItem(CONSENT_COOKIE_NAME, JSON.stringify(consent))
        applyConsent(prefs)
    }

    /**
     * Appliquer les préférences (activer/désactiver les scripts)
     */
    function applyConsent(prefs: typeof preferences) {
        // Analytics (ex: Google Analytics, Plausible, etc.)
        if (prefs.analytics) {
            enableAnalytics()
        } else {
            disableAnalytics()
        }

        // Marketing (ex: Facebook Pixel, Google Ads, etc.)
        if (prefs.marketing) {
            enableMarketing()
        } else {
            disableMarketing()
        }
    }

    /**
     * Accepter tous les cookies
     */
    function acceptAll() {
        const allAccepted = {
            necessary: true,
            analytics: true,
            marketing: true,
        }
        setPreferences(allAccepted)
        saveConsent(allAccepted)
        setShowBanner(false)
        setShowSettings(false)
    }

    /**
     * Accepter uniquement les cookies nécessaires
     */
    function acceptNecessaryOnly() {
        const necessaryOnly = {
            necessary: true,
            analytics: false,
            marketing: false,
        }
        setPreferences(necessaryOnly)
        saveConsent(necessaryOnly)
        setShowBanner(false)
        setShowSettings(false)
    }

    /**
     * Sauvegarder les préférences personnalisées
     */
    function saveCustomPreferences() {
        saveConsent(preferences)
        setShowBanner(false)
        setShowSettings(false)
    }

    /**
     * Ouvrir les paramètres de cookies
     */
    function openSettings() {
        setShowSettings(true)
    }

    if (!showBanner) {
        return null
    }

    return (
        <>
            {/* Bannière principale */}
            <div className="fixed inset-x-0 bottom-0 z-50 bg-background border-t shadow-lg animate-in slide-in-from-bottom-5">
                <div className="container max-w-6xl mx-auto p-6">
                    <div className="flex items-start gap-4">
                        <Cookie className="h-6 w-6 text-primary shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">
                                Nous respectons votre vie privée
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Akôm utilise des cookies pour améliorer votre expérience,
                                analyser le trafic et personnaliser le contenu. Vous pouvez
                                accepter tous les cookies ou personnaliser vos préférences.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={acceptAll} size="sm">
                                    Tout accepter
                                </Button>
                                <Button
                                    onClick={acceptNecessaryOnly}
                                    variant="outline"
                                    size="sm"
                                >
                                    Nécessaires uniquement
                                </Button>
                                <Button
                                    onClick={openSettings}
                                    variant="ghost"
                                    size="sm"
                                >
                                    Personnaliser
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialog des paramètres */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Paramètres de confidentialité</DialogTitle>
                        <DialogDescription>
                            Gérez vos préférences en matière de cookies. Vous pouvez
                            modifier ces paramètres à tout moment.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {COOKIE_CATEGORIES.map((category) => (
                            <div key={category.id} className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <category.icon className="h-5 w-5 text-primary mt-0.5" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Label
                                                    htmlFor={category.id}
                                                    className="text-base font-medium"
                                                >
                                                    {category.name}
                                                </Label>
                                                {category.required && (
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                        Requis
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {category.description}
                                            </p>
                                        </div>
                                    </div>
                                    <Checkbox
                                        id={category.id}
                                        checked={
                                            preferences[
                                                category.id as keyof typeof preferences
                                            ]
                                        }
                                        onCheckedChange={(checked) => {
                                            if (!category.required) {
                                                setPreferences({
                                                    ...preferences,
                                                    [category.id]: checked === true,
                                                })
                                            }
                                        }}
                                        disabled={category.required}
                                    />
                                </div>
                                {category.id !== 'marketing' && <Separator />}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={acceptNecessaryOnly}
                            size="sm"
                        >
                            Refuser tout
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={acceptAll}
                                size="sm"
                            >
                                Tout accepter
                            </Button>
                            <Button onClick={saveCustomPreferences} size="sm">
                                Enregistrer mes préférences
                            </Button>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground pt-4 border-t">
                        Pour en savoir plus sur notre utilisation des cookies,
                        consultez notre{' '}
                        <a
                            href="/legal/privacy"
                            className="text-primary hover:underline"
                        >
                            Politique de confidentialité
                        </a>
                        .
                    </p>
                </DialogContent>
            </Dialog>
        </>
    )
}

/**
 * Fonctions pour activer/désactiver les services externes
 * À adapter selon vos besoins
 */

function enableAnalytics() {
    // Exemple : Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
            analytics_storage: 'granted',
        })
    }
    
    // Exemple : Plausible (pas besoin de consentement mais on peut tracker)
    // Ou tout autre outil d'analytics
}

function disableAnalytics() {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
            analytics_storage: 'denied',
        })
    }
}

function enableMarketing() {
    // Exemple : Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('consent', 'grant')
    }
    
    // Exemple : Google Ads
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted',
        })
    }
}

function disableMarketing() {
    if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('consent', 'revoke')
    }
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
        })
    }
}
