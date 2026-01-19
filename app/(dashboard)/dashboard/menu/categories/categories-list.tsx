// app/(dashboard)/dashboard/menu/categories/categories-list.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    Edit,
    Trash2,
    Power,
    ArrowUp,
    ArrowDown,
    Loader2
} from 'lucide-react'
import {
    toggleCategoryStatus,
    deleteCategory,
    moveCategoryUp,
    moveCategoryDown
} from '@/lib/actions/category'
import { EditCategoryDialog } from './edit-category-dialog'
import { toast } from "sonner"

type Category = {
    id: string
    name: string
    description: string | null
    position: number
    isActive: boolean
    _count: {
        products: number
    }
}

export function CategoriesList({ categories }: { categories: Category[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<{
        id: string
        name: string
    } | null>(null)

    // Fonctions de réorganisation
    async function handleMoveUp(categoryId: string, index: number) {
        if (index === 0) return // Déjà en première position

        setLoading(`up-${categoryId}`)
        const result = await moveCategoryUp(categoryId)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Catégorie déplacée vers le haut')
            router.refresh()
        }
        setLoading(null)
    }

    async function handleMoveDown(categoryId: string, index: number) {
        if (index === categories.length - 1) return // Déjà en dernière position

        setLoading(`down-${categoryId}`)
        const result = await moveCategoryDown(categoryId)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Catégorie déplacée vers le bas')
            router.refresh()
        }
        setLoading(null)
    }

    async function handleToggleStatus(id: string) {
        setLoading(`toggle-${id}`)
        const result = await toggleCategoryStatus(id)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Le statut a été mis à jour.")
            router.refresh()
        }
        setLoading(null)
    }

    function handleDelete(id: string, name: string) {
        setDeleteTarget({ id, name })
    }

    async function confirmDelete() {
        if (!deleteTarget) return

        setLoading(`delete-${deleteTarget.id}`)
        const result = await deleteCategory(deleteTarget.id)
        setLoading(null)
        setDeleteTarget(null)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("La catégorie a été supprimée avec succès.")
            router.refresh()
        }
    }

    if (categories.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-center">
                        Aucune catégorie pour le moment.
                        <br />
                        Créez votre première catégorie pour organiser votre menu.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-center">
                {categories.map((category, index) => (
                    <Card key={category.id} className='hover:shadow-md transition-shadow'>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                                {/* Numéro de position */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg shrink-0">
                                    {category.position}
                                </div>

                                <div className="flex-1 space-y-1 min-w-0">
                                    <CardTitle className="truncate">{category.name}</CardTitle>
                                </div>
                                <Badge
                                    variant={
                                        category.isActive
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="shrink-0"
                                >
                                    {category.isActive
                                        ? 'Active'
                                        : 'Inactive'}
                                </Badge>
                            </div>
                            <div>{category.description && (
                                <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
                                    {category.description}
                                </CardDescription>
                            )}</div>
                        </CardHeader>

                        <CardContent className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                                {category._count.products} produit(s)
                            </p>

                            {/* Boutons de réorganisation */}
                            <div className="flex gap-2">
                                <div className="flex gap-1 items-center">
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        onClick={() => handleMoveUp(category.id, index)}
                                        disabled={index === 0 || loading !== null}
                                        title="Déplacer vers le haut"
                                    >
                                        {loading === `up-${category.id}` ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ArrowUp className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        onClick={() => handleMoveDown(category.id, index)}
                                        disabled={index === categories.length - 1 || loading !== null}
                                        title="Déplacer vers le bas"
                                    >
                                        {loading === `down-${category.id}` ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ArrowDown className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>

                                {/* Autres actions */}
                                <div className="flex gap-2 ml-auto">
                                    <EditCategoryDialog category={category}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={loading !== null}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </EditCategoryDialog>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleStatus(category.id)}
                                        disabled={loading !== null}
                                        title={category.isActive ? 'Désactiver' : 'Activer'}
                                    >
                                        {loading === `toggle-${category.id}` ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Power className="h-4 w-4" />
                                        )}
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(category.id, category.name)}
                                        disabled={
                                            loading !== null ||
                                            category._count.products > 0
                                        }
                                        title={
                                            category._count.products > 0
                                                ? 'Impossible de supprimer : des produits sont liés'
                                                : 'Supprimer'
                                        }
                                    >
                                        {loading === `delete-${category.id}` ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* AlertDialog suppression */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Supprimer la catégorie {deleteTarget?.name} ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. La catégorie sera définitivement supprimée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}