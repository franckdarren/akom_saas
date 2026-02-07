'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from "lucide-react"
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'




export default function RegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)


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
            return
        }

        // ✅ Petit feedback visuel avant la redirection
        // (si tu utilises shadcn/ui toast par exemple)
        toast.success('Compte créé avec succès ! Veuillez vérifier votre email pour confirmer votre compte.')


        // ✅ Rediriger vers dashboard - le middleware décidera de la destination finale
        // Petit délai pour que l'utilisateur voie le message
        setTimeout(() => {
            router.push('/dashboard')
        }, 500)

        // Alternative plus explicite si tu préfères :
        // router.push('/onboarding')
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
                    <Label htmlFor="password" className="pb-1">
                        Mot de passe
                    </Label>

                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            placeholder="••••••••"
                            className="pr-10"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={
                                showPassword
                                    ? 'Masquer le mot de passe'
                                    : 'Afficher le mot de passe'
                            }
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Minimum 6 caractères
                    </p>
                </div>


                {/* Confirm Password */}
                <div>
                    <Label htmlFor="confirmPassword" className="pb-1">
                        Confirmer le mot de passe
                    </Label>

                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            placeholder="••••••••"
                            className="pr-10"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={
                                showPassword
                                    ? 'Masquer le mot de passe'
                                    : 'Afficher le mot de passe'
                            }
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>


                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {/* Accepter la politique de confidentialité */}
                <div className="flex items-start gap-2 mt-4">
                    <Checkbox id="terms" required />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                        En créant un compte, j'accepte les{' '}
                        <Link
                            href="/legal/privacy"
                            className="text-primary hover:underline"
                            target="_blank"
                        >
                            conditions d'utilisation et la politique de confidentialité
                        </Link>
                    </label>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                > {loading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                )}
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