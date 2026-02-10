// app/(dashboard)/dashboard/menu/categories/[id]/families/families-list.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import { ArrowUp, ArrowDown, MoreVertical, Edit, Trash2, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import { deleteFamily, toggleFamilyStatus, moveFamilyUp, moveFamilyDown } from '@/lib/actions/family'
import { EditFamilyDialog } from './edit-family-dialog'

/**
 * Type représentant une famille avec son compteur de produits
 * Ce type correspond exactement à ce qui est retourné par Prisma
 * quand on inclut le _count dans la requête
 */
type Family = {
    id: string
    name: string
    description: string | null
    categoryId: string | null
    position: number
    isActive: boolean
    _count: {
        products: number
    }
}

interface FamiliesListProps {
    families: Family[]
    categoryName: string
}

/**
 * Composant qui affiche la liste des familles sous forme de grille
 * 
 * Chaque famille est affichée dans une carte avec :
 * - Le nom et la description
 * - Un badge indiquant le statut (actif/inactif)
 * - Le nombre de produits qui utilisent cette famille
 * - Des boutons pour réorganiser (↑ ↓)
 * - Un menu d'actions (modifier, activer/désactiver, supprimer)
 */
export function FamiliesList({ families, categoryName }: FamiliesListProps) {
    const router = useRouter()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [familyToDelete, setFamilyToDelete] = useState<Family | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    /**
     * Gère la suppression d'une famille
     * Affiche d'abord un dialog de confirmation avant de supprimer
     */
    async function handleDelete(family: Family) {
        // Vérifier si la famille a des produits liés
        if (family._count.products > 0) {
            toast.error(
                `Impossible de supprimer cette famille car ${family._count.products} produit(s) l'utilisent`,
                {
                    description: 'Retirez d\'abord tous les produits de cette famille'
                }
            )
            return
        }

        // Ouvrir le dialog de confirmation
        setFamilyToDelete(family)
        setDeleteDialogOpen(true)
    }

    /**
     * Confirme et exécute la suppression après validation du dialog
     */
    async function confirmDelete() {
        if (!familyToDelete) return

        setIsDeleting(true)

        const result = await deleteFamily(familyToDelete.id)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Famille supprimée avec succès')
            router.refresh()
        }

        setIsDeleting(false)
        setDeleteDialogOpen(false)
        setFamilyToDelete(null)
    }

    /**
     * Active ou désactive une famille
     * Une famille désactivée reste liée aux produits existants
     * mais n'apparaît plus dans le menu client
     */
    async function handleToggleStatus(family: Family) {
        const result = await toggleFamilyStatus(family.id)

        if (result.error) {
            toast.error(result.error)
        } else {
            const newStatus = family.isActive ? 'désactivée' : 'activée'
            toast.success(`Famille ${newStatus} avec succès`)
            router.refresh()
        }
    }

    /**
     * Déplace une famille vers le haut dans l'ordre d'affichage
     */
    async function handleMoveUp(familyId: string) {
        const result = await moveFamilyUp(familyId)

        if (result.error) {
            toast.error(result.error)
        } else {
            router.refresh()
        }
    }

    /**
     * Déplace une famille vers le bas dans l'ordre d'affichage
     */
    async function handleMoveDown(familyId: string) {
        const result = await moveFamilyDown(familyId)

        if (result.error) {
            toast.error(result.error)
        } else {
            router.refresh()
        }
    }

    return (
        <>
            {/* Grille responsive : 1 colonne sur mobile, 2 sur tablette, 3 sur desktop */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {families.map((family, index) => (
                    <Card key={family.id} className={!family.isActive ? 'opacity-60' : ''}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CardTitle className="text-lg">{family.name}</CardTitle>
                                        {/* Badge de statut */}
                                        {!family.isActive && (
                                            <Badge variant="secondary" className="text-xs">
                                                Inactif
                                            </Badge>
                                        )}
                                    </div>
                                    {family.description && (
                                        <CardDescription className="line-clamp-2">
                                            {family.description}
                                        </CardDescription>
                                    )}
                                </div>

                                {/* Menu d'actions (3 points verticaux) */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <EditFamilyDialog family={family} categoryName={categoryName}>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Modifier
                                            </DropdownMenuItem>
                                        </EditFamilyDialog>

                                        <DropdownMenuItem onClick={() => handleToggleStatus(family)}>
                                            {family.isActive ? (
                                                <>
                                                    <PowerOff className="mr-2 h-4 w-4" />
                                                    Désactiver
                                                </>
                                            ) : (
                                                <>
                                                    <Power className="mr-2 h-4 w-4" />
                                                    Activer
                                                </>
                                            )}
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            onClick={() => handleDelete(family)}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="flex items-center justify-between">
                                {/* Compteur de produits */}
                                <span className="text-sm text-muted-foreground">
                                    {family._count.products === 0
                                        ? 'Aucun produit'
                                        : family._count.products === 1
                                        ? '1 produit'
                                        : `${family._count.products} produits`}
                                </span>

                                {/* Boutons de réorganisation */}
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleMoveUp(family.id)}
                                        disabled={index === 0}
                                        title="Monter"
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleMoveDown(family.id)}
                                        disabled={index === families.length - 1}
                                        title="Descendre"
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Dialog de confirmation de suppression */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la famille &quot;{familyToDelete?.name}&quot; ?
                            Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Suppression...' : 'Supprimer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}