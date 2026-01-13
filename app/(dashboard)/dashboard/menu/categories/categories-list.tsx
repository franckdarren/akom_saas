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
import { Edit, Trash2, Power } from 'lucide-react'
import { toggleCategoryStatus, deleteCategory } from '@/lib/actions/category'
import { EditCategoryDialog } from './edit-category-dialog'
import { toast } from "sonner"

type Category = {
    id: string
    name: string
    description: string | null
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

    async function handleToggleStatus(id: string) {
        setLoading(id)
        await toggleCategoryStatus(id)
        setLoading(null)
        router.refresh()
        toast.success("Le statut a été mis à jour.")
    }

    function handleDelete(id: string, name: string) {
        setDeleteTarget({ id, name })
    }

    async function confirmDelete() {
        if (!deleteTarget) return

        setLoading(deleteTarget.id)
        const result = await deleteCategory(deleteTarget.id)
        setLoading(null)
        setDeleteTarget(null)

        if (result?.error) {
            alert(result.error)
        } else {
            router.refresh()
            toast.success("La catégorie a été supprimée avec succès.")
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
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                {categories.map((category) => (
                    <Card key={category.id} className='hover:shadow-md transition-shadow'>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle>{category.name}</CardTitle>
                                    {category.description && (
                                        <CardDescription>
                                            {category.description}
                                        </CardDescription>
                                    )}
                                </div>
                                <Badge
                                    variant={
                                        category.isActive
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {category.isActive
                                        ? 'Active'
                                        : 'Inactive'}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    {category._count.products} produit(s)
                                </p>

                                <div className="flex gap-2">
                                    <EditCategoryDialog category={category}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                loading === category.id
                                            }
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </EditCategoryDialog>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleToggleStatus(category.id)
                                        }
                                        disabled={
                                            loading === category.id
                                        }
                                    >
                                        <Power className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            handleDelete(
                                                category.id,
                                                category.name
                                            )
                                        }
                                        disabled={
                                            loading === category.id ||
                                            category._count.products > 0
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
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
                            Cette action est irréversible.
                            {/* {deleteTarget && (
                                <>
                                    <br />
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                        {deleteTarget.name}
                                    </span>
                                </>
                            )} */}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Annuler
                        </AlertDialogCancel>
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
