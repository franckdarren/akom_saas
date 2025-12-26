'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { resetPassword, signOut, getUser } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // ✅ Vérifier la session SUPABASE (PAS l’URL)
    useEffect(() => {
        async function checkSession() {
            const user = await getUser()

            // Pas de session → accès direct interdit
            if (!user) {
                router.replace('/forgot-password')
                return
            }

            setCheckingSession(false)
        }

        checkSession()
    }, [router])

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

            // 🔐 Important : supprimer la session temporaire
            await signOut()
        } else {
            setError(result.error || result.message)
            setLoading(false)
        }
    }

    // ⏳ Pendant la vérification de session
    if (checkingSession) {
        return null
    }

    // ✅ Succès
    if (success) {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-6">
                    Mot de passe réinitialisé
                </h2>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-sm">
                        Votre mot de passe a été mis à jour avec succès.
                        Vous pouvez maintenant vous connecter.
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

    // ✅ Formulaire
    return (
        <div>
            <h2 className="text-2xl font-bold mb-2">
                Nouveau mot de passe
            </h2>

            <p className="text-sm text-zinc-600 mb-6">
                Choisissez un nouveau mot de passe
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="password">Nouveau mot de passe</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        autoComplete="new-password"
                    />
                </div>

                <div>
                    <Label htmlFor="confirmPassword">
                        Confirmer le mot de passe
                    </Label>
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        autoComplete="new-password"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Mise à jour…' : 'Réinitialiser le mot de passe'}
                </Button>
            </form>
        </div>
    )
}
