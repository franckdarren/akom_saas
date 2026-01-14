// components/dashboard/UsersList.tsx
'use client'

import { useState } from 'react'
import { changeUserRole, removeTeamMember } from '@/lib/actions/user'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/format'
import { getRoleBadge } from '@/lib/utils/permissions'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, UserCog, UserMinus } from 'lucide-react'
import type { UserRole } from '@/types/auth'

interface TeamMember {
    id: string
    userId: string
    email: string
    role: UserRole
    createdAt: Date
}

interface UsersListProps {
    members: TeamMember[]
    currentUserId: string
    restaurantId: string
}

export function UsersList({
    members,
    currentUserId,
    restaurantId,
}: UsersListProps) {
    const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(
        null
    )

    async function handleChangeRole(userId: string, newRole: UserRole) {
        try {
            const result = await changeUserRole(restaurantId, userId, newRole)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Rôle modifié')
            }
        } catch (error) {
            toast.error('Erreur lors du changement de rôle')
        }
    }

    async function handleRemove() {
        if (!memberToRemove) return

        try {
            const result = await removeTeamMember(
                restaurantId,
                memberToRemove.userId
            )

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Membre retiré de l\'équipe')
                setMemberToRemove(null)
            }
        } catch (error) {
            toast.error('Erreur lors du retrait')
        }
    }

    if (members.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Aucun membre</p>
            </div>
        )
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Ajouté le</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map((member) => {
                        const isCurrentUser = member.userId === currentUserId
                        const roleBadge = getRoleBadge(member.role)

                        return (
                            <TableRow key={member.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {member.email}
                                        {isCurrentUser && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                Vous
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={roleBadge.color}>
                                        {roleBadge.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDate(member.createdAt)}
                                </TableCell>
                                <TableCell>
                                    {!isCurrentUser && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                >
                                                    <MoreHorizontal />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>
                                                    Actions
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleChangeRole(
                                                            member.userId,
                                                            member.role ===
                                                                'admin'
                                                                ? 'kitchen'
                                                                : 'admin'
                                                        )
                                                    }
                                                >
                                                    <UserCog />
                                                    {member.role === 'admin'
                                                        ? 'Rétrograder en Cuisine'
                                                        : 'Promouvoir Admin'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setMemberToRemove(
                                                            member
                                                        )
                                                    }
                                                >
                                                    <UserMinus />
                                                    Retirer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {/* Dialog de confirmation de suppression */}
            <AlertDialog
                open={!!memberToRemove}
                onOpenChange={(open) => !open && setMemberToRemove(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {memberToRemove?.email} n'aura plus accès à ce
                            restaurant. Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemove}>
                            Retirer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}