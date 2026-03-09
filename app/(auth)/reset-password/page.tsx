'use client'

import {useState, useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {resetPassword, getUser} from '@/lib/actions/auth'
import {createClient} from '@/lib/supabase/client' // ← client-side, pas server
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Loader2, Eye, EyeOff} from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        const supabase = createClient()

        // ✅ Écouter les changements de session côté client
        // Supabase JS détecte automatiquement le #access_token dans l'URL
        // et déclenche l'événement PASSWORD_RECOVERY
        const {data: {subscription}} = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Session recovery détectée → on peut afficher le formulaire
                setCheckingSession(false)
            } else if (event === 'SIGNED_IN' && session) {
                // Déjà connecté normalement → aussi OK
                setCheckingSession(false)
            }
        })

        // Fallback : vérifier s'il y a déjà une session active après 2s
        // (cas où l'événement a déjà été déclenché avant le montage)
        const timeout = setTimeout(async () => {
            const user = await getUser()
            if (user) {
                setCheckingSession(false)
            } else {
                router.replace('/forgot-password')
            }
        }, 2000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
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
        } else {
            setError(result.error || result.message)
            setLoading(false)
        }
    }

    if (checkingSession) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
            </div>
        )
    }

    if (success) {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-6">Mot de passe réinitialisé</h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-sm">
                        Votre mot de passe a été mis à jour avec succès.
                        Vous pouvez maintenant vous connecter.
                    </p>
                </div>
                <Link href="/login">
                    <Button className="w-full">Se connecter maintenant</Button>
                </Link>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-2">Nouveau mot de passe</h2>
            <p className="text-sm text-zinc-600 mb-6">Choisissez un nouveau mot de passe</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="password" className="pb-1">Nouveau mot de passe</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? 'Masquer' : 'Afficher'}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Minimum 6 caractères</p>
                </div>

                <div>
                    <Label htmlFor="confirmPassword" className="pb-1">Confirmer le mot de passe</Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? 'Masquer' : 'Afficher'}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </button>
                    </div>
                </div>

                {error && (
                    <div
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin"/>}
                    {loading ? 'Mise à jour…' : 'Réinitialiser le mot de passe'}
                </Button>
            </form>
        </div>
    )
}