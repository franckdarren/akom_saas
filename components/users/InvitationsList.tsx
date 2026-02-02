// components/users/InvitationsList.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { revokeInvitation, resendInvitation } from '@/lib/actions/invitation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
    MoreVertical,
    Send,
    X,
    CheckCircle2,
    Clock,
    XCircle,
    Shield,
    UtensilsCrossed,
    Copy,
} from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

interface Invitation {
    id: string
    email: string
    role: string
    token: string
    status: string
    expiresAt: Date
    acceptedAt?: Date | null
    createdAt: Date
}

interface InvitationsListProps {
    invitations: Invitation[]
    compact?: boolean
}

export function InvitationsList({
    invitations,
    compact = false,
}: InvitationsListProps) {
    const router = useRouter()
    const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(
        null
    )
    const [showRevokeDialog, setShowRevokeDialog] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleResend(invitationId: string) {
        setIsLoading(true)

        try {
            const result = await resendInvitation(invitationId)

            if (result.success) {
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error('Erreur lors du renvoi de l\'invitation')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleRevoke() {
        if (!selectedInvitation) return

        setIsLoading(true)

        try {
            const result = await revokeInvitation(selectedInvitation.id)

            if (result.success) {
                toast.success(result.message)
                setShowRevokeDialog(false)
                setSelectedInvitation(null)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error('Erreur lors de la révocation')
        } finally {
            setIsLoading(false)
        }
    }

    function handleCopyLink(invitation: Invitation) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        const link = `${baseUrl}/invite/accept?token=${invitation.token}`

        navigator.clipboard.writeText(link)
        toast.success('Lien copié dans le presse-papier')
    }

    if (invitations.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Aucune invitation</p>
            </div>
        )
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        {!compact && <TableHead>Rôle</TableHead>}
                        <TableHead>Statut</TableHead>
                        {!compact && <TableHead>Expire le</TableHead>}
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                            <TableCell className="font-medium">
                                {invitation.email}
                            </TableCell>
                            {!compact && (
                                <TableCell>
                                    <RoleBadge role={invitation.role} />
                                </TableCell>
                            )}
                            <TableCell>
                                <StatusBadge status={invitation.status} />
                            </TableCell>
                            {!compact && (
                                <TableCell className="text-muted-foreground">
                                    {formatDate(invitation.expiresAt)}
                                </TableCell>
                            )}
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            disabled={isLoading}
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />

                                        {invitation.status === 'pending' && (
                                            <>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleCopyLink(invitation)
                                                    }
                                                >
                                                    <Copy className="h-4 w-4" />
                                                    Copier le lien
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleResend(invitation.id)
                                                    }
                                                >
                                                    <Send className="h-4 w-4" />
                                                    Renvoyer l'invitation
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() => {
                                                        setSelectedInvitation(invitation)
                                                        setShowRevokeDialog(true)
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                    Révoquer
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        {invitation.status === 'expired' && (
                                            <DropdownMenuItem
                                                onClick={() => handleResend(invitation.id)}
                                            >
                                                <Send className="h-4 w-4" />
                                                Renvoyer une nouvelle invitation
                                            </DropdownMenuItem>
                                        )}

                                        {invitation.status === 'accepted' && (
                                            <DropdownMenuItem disabled>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Invitation acceptée
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Dialog de confirmation de révocation */}
            <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Révoquer cette invitation ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Vous êtes sur le point de révoquer l'invitation envoyée à{' '}
                            <strong>{selectedInvitation?.email}</strong>. Le lien
                            d'invitation ne sera plus valide.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRevoke}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? 'Révocation...' : 'Révoquer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'pending':
            return (
                <Badge variant="default">
                    <Clock className="h-3 w-3 mr-1" />
                    En attente
                </Badge>
            )
        case 'accepted':
            return (
                <Badge variant="success">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Acceptée
                </Badge>
            )
        case 'expired':
            return (
                <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Expirée
                </Badge>
            )
        case 'revoked':
            return (
                <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    Révoquée
                </Badge>
            )
        default:
            return <Badge variant="outline">{status}</Badge>
    }
}

function RoleBadge({ role }: { role: string }) {
    if (role === 'admin') {
        return (
            <Badge variant="outline">
                <Shield className="h-3 w-3 mr-1" />
                Admin
            </Badge>
        )
    }

    return (
        <Badge variant="outline">
            <UtensilsCrossed className="h-3 w-3 mr-1" />
            Cuisine
        </Badge>
    )
}