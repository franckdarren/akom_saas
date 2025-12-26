'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string

        const result = await signUp({ email, password, confirmPassword })

        if (!result.success) {
            setError(result.error || result.message)
            setLoading(false)
        }
        // La redirection est gérée par la Server Action
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Créer un compte
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                    Commencez à utiliser Akôm gratuitement
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="vous@exemple.com"
                    />
                </div>

                {/* Password */}
                <div>
                    <Label htmlFor="password">Mot de passe</Label>
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
                <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                >
                    {loading ? 'Création...' : 'Créer mon compte'}
                </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Vous avez déjà un compte ?{' '}
                    <Link
                        href="/login"
                        className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                        Se connecter
                    </Link>
                </p>
            </div>
        </div>
    )
}