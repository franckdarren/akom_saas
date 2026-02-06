'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Cookie, Shield, BarChart3, Target } from 'lucide-react'

const COOKIE_CATEGORIES = [
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

/**
 * Bouton flottant pour rouvrir les paramètres de cookies
 * À placer dans le footer ou en position fixe
 */
export function CookiePreferencesButton() {
    const [open, setOpen] = useState(false)
    const [preferences, setPreferences] = useState(() => {
        try {
            const stored = localStorage.getItem(CONSENT_COOKIE_NAME)
            if (stored) {
                const consent = JSON.parse(stored)
                return consent.preferences
            }
        } catch {
            // Erreur de parsing
        }
        return {
            necessary: true,
            analytics: false,
            marketing: false,
        }
    })

    function savePreferences() {
        const consent = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            preferences,
        }
        localStorage.setItem(CONSENT_COOKIE_NAME, JSON.stringify(consent))
        setOpen(false)
        
        // Recharger la page pour appliquer les changements
        window.location.reload()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                >
                    <Cookie className="h-4 w-4" />
                    Gérer les cookies
                </Button>
            </DialogTrigger>

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
                                                htmlFor={`pref-${category.id}`}
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
                                    id={`pref-${category.id}`}
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

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Annuler
                    </Button>
                    <Button onClick={savePreferences}>
                        Enregistrer mes préférences
                    </Button>
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
    )
}