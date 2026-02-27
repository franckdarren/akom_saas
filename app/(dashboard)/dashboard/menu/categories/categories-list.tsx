// app/(dashboard)/dashboard/menu/categories/categories-list.tsx
'use client'

import {useState} from 'react'
import Link from 'next/link'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import {
    ArrowUp,
    ArrowDown,
    MoreVertical,
    FolderTree,
    Package,
} from 'lucide-react'
import {
    toggleCategoryStatus,
    deleteCategory,
    moveCategoryUp,
    moveCategoryDown,
} from '@/lib/actions/category'
import {EditCategoryDialog} from './edit-category-dialog'
import {toast} from 'sonner'

// ============================================================
// TYPES
// ============================================================

type Category = {
    id: string
    name: string
    description: string | null
    isActive: boolean
    position: number
    _count: {
        products: number
        families: number // ← AJOUT : compteur de familles
    }
}

interface CategoriesListProps {
    categories: Category[]
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export function CategoriesList({categories}: CategoriesListProps) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

    // ============================================================
    // HANDLERS
    // ============================================================

    async function handleToggleStatus(id: string) {
        const result = await toggleCategoryStatus(id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Statut mis à jour')
        }
    }

    async function handleDelete(category: Category) {
        setIsDeleting(category.id)
        const result = await deleteCategory(category.id)
        setIsDeleting(null)
        setCategoryToDelete(null)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Catégorie supprimée')
        }
    }

    async function handleMoveUp(id: string) {
        const result = await moveCategoryUp(id)
        if (result.error) {
            toast.error(result.error)
        }
    }

    async function handleMoveDown(id: string) {
        const result = await moveCategoryDown(id)
        if (result.error) {
            toast.error(result.error)
        }
    }

    // ============================================================
    // RENDU VIDE
    // ============================================================

    if (categories.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                    <Package className="h-12 w-12 text-muted-foreground mb-4"/>
                    <p className="text-muted-foreground text-center">
                        Aucune catégorie pour le moment.
                        <br/>
                        Créez votre première catégorie pour organiser votre menu.
                    </p>
                </CardContent>
            </Card>
        )
    }

    // ============================================================
    // RENDU PRINCIPAL
    // ============================================================

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category, index) => (
                    <Card key={category.id}
                          className={!category.isActive ? 'opacity-60 hover:border-primary/50 hover:shadow-md' : 'hover:border-primary/50 hover:shadow-md'}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="flex items-center gap-2">
                                        {category.name}
                                        {!category.isActive && (
                                            <Badge variant="secondary" className="text-xs">
                                                Inactif
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    {category.description && (
                                        <CardDescription className="mt-1.5">
                                            {category.description}
                                        </CardDescription>
                                    )}
                                </div>

                                {/* Menu actions */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <EditCategoryDialog category={category}>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                Modifier
                                            </DropdownMenuItem>
                                        </EditCategoryDialog>

                                        <DropdownMenuItem onClick={() => handleToggleStatus(category.id)}>
                                            {category.isActive ? 'Désactiver' : 'Activer'}
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => setCategoryToDelete(category)}
                                        >
                                            Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {/* Stats produits et familles */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-1">
                                    <Package className="h-4 w-4"/>
                                    <span>{category._count.products} produit{category._count.products !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FolderTree className="h-4 w-4"/>
                                    <span>{category._count.families} famille{category._count.families !== 1 ? 's' : ''}</span>
                                </div>
                            </div>

                            {/* Actions principales */}
                            <div className="flex flex-col gap-2">
                                {/* ✅ NOUVEAU : Bouton pour gérer les familles */}
                                <Link href={`/dashboard/menu/categories/${category.id}/families`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start"
                                    >
                                        <FolderTree className="mr-2 h-4 w-4"/>
                                        Gérer les familles
                                        {category._count.families > 0 && (
                                            <Badge variant="secondary" className="ml-auto">
                                                {category._count.families}
                                            </Badge>
                                        )}
                                    </Button>
                                </Link>

                                {/* Boutons de réorganisation */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleMoveUp(category.id)}
                                        disabled={index === 0}
                                        className="flex-1"
                                    >
                                        <ArrowUp className="h-4 w-4"/>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleMoveDown(category.id)}
                                        disabled={index === categories.length - 1}
                                        className="flex-1"
                                    >
                                        <ArrowDown className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Dialog de confirmation de suppression */}
            <AlertDialog
                open={!!categoryToDelete}
                onOpenChange={(open) => !open && setCategoryToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {categoryToDelete?._count.products === 0 ? (
                                <>
                                    Êtes-vous sûr de vouloir supprimer{' '}
                                    <strong>{categoryToDelete?.name}</strong> ?
                                    Cette action est irréversible.
                                </>
                            ) : (
                                <>
                                    Impossible de supprimer <strong>{categoryToDelete?.name}</strong>.
                                    <br/>
                                    Cette catégorie contient{' '}
                                    <strong>{categoryToDelete?._count.products} produit(s)</strong>.
                                    Veuillez d'abord supprimer ou déplacer ces produits.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        {categoryToDelete?._count.products === 0 && (
                            <AlertDialogAction
                                onClick={() => categoryToDelete && handleDelete(categoryToDelete)}
                                disabled={!!isDeleting}
                                className="bg-destructive text-white hover:bg-destructive/90"
                            >
                                {isDeleting ? 'Suppression...' : 'Supprimer'}
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}