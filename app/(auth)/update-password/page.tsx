'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {updatePassword} from '@/lib/actions/auth'
import {Button} from '@/components/ui/button'
import {LoadingButton} from '@/components/ui/loading-button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Eye, EyeOff} from 'lucide-react'

function PageSpinner() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"/>
        </div>
    )
}

export default function UpdatePasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [navigating, setNavigating] = useState(false) // ← spinner navigation
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    function goToDashboard() {
        setNavigating(true)
        router.push('/dashboard')
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const currentPassword = formData.get('currentPassword') as string
        const newPassword = formData.get('newPassword') as string
        const confirmPassword = formData.get('confirmPassword') as string

        const result = await updatePassword(currentPassword, newPassword, confirmPassword)

        if (result.success) {
            setSuccess(true)
            setTimeout(() => {
                setNavigating(true)
                router.push('/dashboard')
            }, 2000)
        } else {
            setError(result.error || result.message)
            setLoading(false)
        }
    }

    if (navigating) return <PageSpinner/>

    if (success) {
        return (
            <div>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                        Mot de passe modifié
                    </h2>
                </div>
                <div
                    className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-green-800 dark:text-green-200">
                        Votre mot de passe a été mis à jour avec succès.
                        Redirection vers le tableau de bord...
                    </p>
                </div>
                <Button variant="outline" className="w-full" onClick={goToDashboard}>
                    Retour au tableau de bord
                </Button>
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
                    <Label htmlFor="currentPassword" className="pb-1">Mot de passe actuel</Label>
                    <div className="relative">
                        <Input
                            id="currentPassword"
                            name="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            placeholder="••••••••"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </button>
                    </div>
                </div>

                {/* New Password */}
                <div>
                    <Label htmlFor="newPassword" className="pb-1">Nouveau mot de passe</Label>
                    <div className="relative">
                        <Input
                            id="newPassword"
                            name="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            placeholder="••••••••"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showNewPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </button>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Minimum 6 caractères
                    </p>
                </div>

                {/* Confirm Password */}
                <div>
                    <Label htmlFor="confirmPassword" className="pb-1">
                        Confirmer le nouveau mot de passe
                    </Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            placeholder="••••••••"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showNewPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {/* Submit */}
                <LoadingButton type="submit" className="w-full" isLoading={loading} loadingText="Mise à jour...">
                    Modifier le mot de passe
                </LoadingButton>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={goToDashboard}
                    className="text-sm text-blue-600 hover:text-blue-500"
                >
                    ← Retour au tableau de bord
                </button>
            </div>
        </div>
    )
}