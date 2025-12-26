'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { resetPassword, signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Vérifier si on a un code de récupération dans l'URL
    const hasRecoveryCode = searchParams.get('code') !== null

    useEffect(() => {
        // Si pas de code de récupération, c'est que l'user essaie d'accéder directement
        if (!hasRecoveryCode) {
            router.push('/forgot-password')
        }
    }, [hasRecoveryCode, router])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string

        const result = await resetPassword(password, confirmPassword)

        if (result.success) {
            setSuccess(true)
            // Déconnecter l'utilisateur pour forcer une nouvelle connexion
            await signOut()
        } else {
            setError(result.error || result.message)
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                        Mot de passe réinitialisé
                    </h2>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-green-800 dark:text-green-200">
                        Votre mot de passe a été mis à jour avec succès.
                        Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                    </p>
                </div>

                <Link href="/login">
                    <Button className="w-full">
                        Se connecter maintenant
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Nouveau mot de passe
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                    Choisissez un nouveau mot de passe pour votre compte
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                    <Label htmlFor="password">Nouveau mot de passe</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        placeholder="••••••••"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Minimum 6 caractères
                    </p>
                </div>

                {/* Confirm Password */}
                <div>
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        placeholder="••••••••"
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
                </Button>
            </form>

            {/* Info message */}
            <div className="mt-6 text-center">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Veuillez réinitialiser votre mot de passe pour continuer
                </p>
            </div>
        </div>
    )
}