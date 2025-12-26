'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updatePassword } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UpdatePasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const currentPassword = formData.get('currentPassword') as string
        const newPassword = formData.get('newPassword') as string
        const confirmPassword = formData.get('confirmPassword') as string

        const result = await updatePassword(
            currentPassword,
            newPassword,
            confirmPassword
        )

        if (result.success) {
            setSuccess(true)
            // Rediriger vers le dashboard après 2 secondes
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)
        } else {
            setError(result.error || result.message)
        }

        setLoading(false)
    }

    if (success) {
        return (
            <div>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                        Mot de passe modifié
                    </h2>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-green-800 dark:text-green-200">
                        Votre mot de passe a été mis à jour avec succès.
                        Redirection vers le tableau de bord...
                    </p>
                </div>

                <Link href="/dashboard">
                    <Button variant="outline" className="w-full">
                        Retour au tableau de bord
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Modifier le mot de passe
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                    Changez votre mot de passe actuel
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                    />
                </div>

                {/* New Password */}
                <div>
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input
                        id="newPassword"
                        name="newPassword"
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
                    <Label htmlFor="confirmPassword">
                        Confirmer le nouveau mot de passe
                    </Label>
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
                    {loading ? 'Mise à jour...' : 'Modifier le mot de passe'}
                </Button>
            </form>

            {/* Back to Dashboard */}
            <div className="mt-6 text-center">
                <Link
                    href="/dashboard"
                    className="text-sm text-blue-600 hover:text-blue-500"
                >
                    ← Retour au tableau de bord
                </Link>
            </div>
        </div>
    )
}