// components/users/InviteUserDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { inviteUserToRestaurant } from '@/lib/actions/invitation'
import { getRestaurantRoles } from '@/lib/actions/roles'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Mail, Shield, Info } from 'lucide-react'

interface InviteUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface Role {
    id: string
    name: string
    description: string | null
    isSystem: boolean
}

export function InviteUserDialog({
    open,
    onOpenChange,
}: InviteUserDialogProps) {
    const { currentRestaurant } = useRestaurant()
    const [email, setEmail] = useState('')
    const [selectedRoleId, setSelectedRoleId] = useState<string>('')
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingRoles, setLoadingRoles] = useState(true)

    // Charger les rôles disponibles
    useEffect(() => {
        async function loadRoles() {
            if (!currentRestaurant) return

            setLoadingRoles(true)
            const result = await getRestaurantRoles(currentRestaurant.id)

            if (result.error) {
                toast.error(result.error)
            } else if (result.roles) {
                const activeRoles = result.roles.filter((r) => r.isActive)
                setRoles(activeRoles)

                // Sélectionner automatiquement le rôle "Cuisine" par défaut si disponible
                const defaultRole = activeRoles.find((r) => r.name === 'Cuisine')
                if (defaultRole) {
                    setSelectedRoleId(defaultRole.id)
                } else if (activeRoles.length > 0) {
                    setSelectedRoleId(activeRoles[0].id)
                }
            }

            setLoadingRoles(false)
        }

        if (open) {
            loadRoles()
        }
    }, [open, currentRestaurant])

    // Réinitialiser le formulaire à la fermeture
    useEffect(() => {
        if (!open) {
            setEmail('')
            setSelectedRoleId('')
        }
    }, [open])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!currentRestaurant) {
            toast.error('Aucun restaurant sélectionné')
            return
        }

        if (!email.trim()) {
            toast.error('L\'email est obligatoire')
            return
        }

        if (!selectedRoleId) {
            toast.error('Veuillez sélectionner un rôle')
            return
        }

        // Validation basique de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            toast.error('Format d\'email invalide')
            return
        }

        setLoading(true)

        const result = await inviteUserToRestaurant(
            currentRestaurant.id,
            email.trim().toLowerCase(),
            selectedRoleId
        )

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Invitation envoyée avec succès')
            onOpenChange(false)
        }

        setLoading(false)
    }

    const selectedRole = roles.find((r) => r.id === selectedRoleId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Inviter un membre</DialogTitle>
                    <DialogDescription>
                        Ajoutez un nouveau membre à votre équipe et assignez-lui un rôle
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">
                            Email <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="exemple@email.com"
                                className="pl-9"
                                required
                                disabled={loading}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            La personne recevra un email pour rejoindre votre restaurant
                        </p>
                    </div>

                    {/* Sélection du rôle */}
                    <div className="space-y-2">
                        <Label htmlFor="role">
                            Rôle <span className="text-destructive">*</span>
                        </Label>
                        {loadingRoles ? (
                            <div className="h-9 bg-muted animate-pulse rounded-md" />
                        ) : (
                            <Select
                                value={selectedRoleId}
                                onValueChange={setSelectedRoleId}
                                disabled={loading}
                            >
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-3 w-3" />
                                                <span>{role.name}</span>
                                                {role.isSystem && (
                                                    <Badge variant="outline" className="text-xs ml-1">
                                                        Défaut
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Aperçu du rôle sélectionné */}
                    {selectedRole && selectedRole.description && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                            <div className="text-sm text-blue-900 dark:text-blue-100">
                                <p className="font-medium mb-1">{selectedRole.name}</p>
                                <p className="text-blue-700 dark:text-blue-300">
                                    {selectedRole.description}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading || loadingRoles}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Invitation...
                                </>
                            ) : (
                                <>
                                    <Mail className="h-4 w-4" />
                                    Envoyer l'invitation
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}