'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from "lucide-react"


export default function LoginPage() {
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

        const result = await signIn({ email, password })

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
                    Connexion
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                    Accédez à votre tableau de bord
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                    <Label htmlFor="email" className='pb-1'>Email</Label>
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
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className='pb-1'>Mot de passe</Label>
                        <Link
                            href="/forgot-password"
                            className="text-sm text-blue-600 hover:text-blue-500"
                        >
                            Mot de passe oublié ?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                    />
                </div>

                {/* Error Message  */}
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
                > {loading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                )}
                    {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Pas encore de compte ?{' '}
                    <Link
                        href="/register"
                        className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                        Créer un compte
                    </Link>
                </p>
            </div>
        </div>
    )
}