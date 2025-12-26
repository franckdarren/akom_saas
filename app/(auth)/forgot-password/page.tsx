'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string

        const result = await forgotPassword({ email })

        if (result.success) {
            setSuccess(true)
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
                        Email envoyé
                    </h2>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-green-800 dark:text-green-200">
                        Un email de réinitialisation a été envoyé à votre adresse.
                        Vérifiez votre boîte de réception et suivez les instructions.
                    </p>
                </div>

                <Link href="/login">
                    <Button variant="outline" className="w-full">
                        Retour à la connexion
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Mot de passe oublié
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                    Entrez votre email pour recevoir un lien de réinitialisation
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
                    {loading ? 'Envoi...' : 'Envoyer le lien'}
                </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
                <Link
                    href="/login"
                    className="text-sm text-blue-600 hover:text-blue-500"
                >
                    ← Retour à la connexion
                </Link>
            </div>
        </div>
    )
}