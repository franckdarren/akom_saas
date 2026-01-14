// components/dashboard/CreateUserDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { createUser } from '@/lib/actions/user'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { UserPlus, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import type { UserRole } from '@/types/auth'

interface PasswordStrength {
    score: number
    label: string
    color: string
    feedback: string[]
}

export function CreateUserDialog() {
    const { currentRestaurant } = useRestaurant()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [role, setRole] = useState<UserRole>('kitchen')
    const [emailError, setEmailError] = useState('')

    // Validation email
    function validateEmail(email: string) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (email && !regex.test(email)) {
            setEmailError('Email invalide')
        } else {
            setEmailError('')
        }
    }

    // Calculer la force du mot de passe
    function calculatePasswordStrength(pwd: string): PasswordStrength {
        let score = 0
        const feedback: string[] = []

        if (pwd.length === 0) {
            return { score: 0, label: '', color: '', feedback: [] }
        }

        // Critères de validation
        const hasMinLength = pwd.length >= 8
        const hasUpperCase = /[A-Z]/.test(pwd)
        const hasLowerCase = /[a-z]/.test(pwd)
        const hasNumber = /[0-9]/.test(pwd)
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd)

        if (hasMinLength) score++
        else feedback.push('Au moins 8 caractères')

        if (hasUpperCase) score++
        else feedback.push('Une majuscule')

        if (hasLowerCase) score++
        else feedback.push('Une minuscule')

        if (hasNumber) score++
        else feedback.push('Un chiffre')

        if (hasSpecialChar) score++
        else feedback.push('Un caractère spécial (!@#$...)')

        // Déterminer le label et la couleur
        if (score <= 2) {
            return {
                score,
                label: 'Faible',
                color: 'bg-red-500',
                feedback,
            }
        } else if (score === 3) {
            return {
                score,
                label: 'Moyen',
                color: 'bg-orange-500',
                feedback,
            }
        } else if (score === 4) {
            return {
                score,
                label: 'Bon',
                color: 'bg-yellow-500',
                feedback,
            }
        } else {
            return {
                score,
                label: 'Très bon',
                color: 'bg-green-500',
                feedback: [],
            }
        }
    }

    const passwordStrength = calculatePasswordStrength(password)
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

    // Reset le formulaire quand la modale s'ouvre/ferme
    useEffect(() => {
        if (!open) {
            // Réinitialiser tous les champs quand on ferme
            setEmail('')
            setPassword('')
            setConfirmPassword('')
            setRole('kitchen')
            setShowPassword(false)
            setShowConfirmPassword(false)
        }
    }, [open])

    // Focus sur le champ email quand la modale s'ouvre
    useEffect(() => {
        if (open) {
            // Focus sur l'input email quand la modale s'ouvre
            setTimeout(() => {
                document.getElementById('email')?.focus()
            }, 100)
        }
    }, [open])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!currentRestaurant) {
            toast.error('Aucun restaurant sélectionné')
            return
        }

        // Validations
        if (!email.trim()) {
            toast.error('L\'email est requis')
            return
        }

        if (password.length < 8) {
            toast.error('Le mot de passe doit contenir au moins 8 caractères')
            return
        }

        if (password !== confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas')
            return
        }

        if (passwordStrength.score < 3) {
            toast.error('Le mot de passe est trop faible')
            return
        }

        setLoading(true)

        try {
            const result = await createUser({
                email: email.trim(),
                password,
                role,
                restaurantId: currentRestaurant.id,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.message)
                // Fermer la modale (le reset sera fait par useEffect)
                setOpen(false)
            }
        } catch (error) {
            toast.error('Erreur lors de la création')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus />
                    Créer un utilisateur
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Créer un utilisateur</DialogTitle>
                        <DialogDescription>
                            Créez un compte pour un nouveau membre de l'équipe
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="exemple@email.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    validateEmail(e.target.value)
                                }}
                                disabled={loading}
                                required
                            />
                            {/* Afficher l'erreur */}
                            {emailError && (
                                <p className="text-xs text-red-600">{emailError}</p>
                            )}
                        </div>

                        {/* Mot de passe */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>

                            </div>

                            {/* Indicateur de force */}
                            {password && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${passwordStrength.color}`}
                                                style={{
                                                    width: `${(passwordStrength.score / 5) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium">
                                            {passwordStrength.label}
                                        </span>
                                    </div>

                                    {passwordStrength.feedback.length > 0 && (
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p className="font-medium">Manquant :</p>
                                            <ul className="list-disc list-inside space-y-0.5">
                                                {passwordStrength.feedback.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Confirmation mot de passe */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                Confirmer le mot de passe
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                    onClick={() =>
                                        setShowConfirmPassword(!showConfirmPassword)
                                    }
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>

                            {/* Validation visuelle */}
                            {confirmPassword && (
                                <div className="flex items-center gap-2 text-sm">
                                    {passwordsMatch ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            <span className="text-green-600">
                                                Les mots de passe correspondent
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-4 w-4 text-red-600" />
                                            <span className="text-red-600">
                                                Les mots de passe ne correspondent pas
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Rôle */}
                        <div className="space-y-2">
                            <Label htmlFor="role">Rôle</Label>
                            <Select
                                value={role}
                                onValueChange={(value) =>
                                    setRole(value as UserRole)
                                }
                                disabled={loading}
                            >
                                <SelectTrigger id="role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kitchen">
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">
                                                Cuisine
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Gestion des commandes uniquement
                                            </span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="admin">
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">
                                                Administrateur
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Accès complet au restaurant
                                            </span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !passwordsMatch || passwordStrength.score < 3}
                        >
                            {loading && <Loader2 className="animate-spin" />}
                            Créer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}