'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import {signIn} from '@/lib/actions/auth'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Loader2, Eye, EyeOff} from 'lucide-react'
import {toast} from 'sonner'
import {translateAuthError} from '@/lib/translate/auth-error-messages'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false) // ← toggle mot de passe

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        const result = await signIn({email, password})

        if (result.success) {
            toast.success('Connexion réussie')
            router.push('/dashboard')
            router.refresh()
        } else {
            toast.error(result.message)
            setError(translateAuthError(result.error || result.message))
        }

        setLoading(false)
    }

    return (
        <div className="max-w-md mx-auto">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Connexion</CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                    Accédez à votre tableau de bord
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <Label htmlFor="email" className="pb-1 mt-5">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="vous@exemple.com"
                        />
                    </div>

                    {/* Password avec toggle */}
                    <div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="pb-1">Mot de passe</Label>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-blue-600 hover:text-blue-500"
                            >
                                Mot de passe oublié ?
                            </Link>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div
                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2 inline-block"/>}
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </Button>
                </form>

                {/* Register Link */}
                <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    Pas encore de compte ?{' '}
                    <Link
                        href="/register"
                        className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                        Créer un compte
                    </Link>
                </p>
            </CardContent>
        </div>
    )
}