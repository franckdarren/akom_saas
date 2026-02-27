// app/(dashboard)/dashboard/tables/tables-list.tsx
'use client'

import {useState} from 'react'
import {toast} from "sonner"
import {useRouter} from 'next/navigation'
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Power, Trash2, QrCode} from 'lucide-react'
import {toggleTableStatus, deleteTable} from '@/lib/actions/table'
import {QRCodeDialog} from './qrcode-dialog'
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

type Table = {
    id: string
    number: number
    isActive: boolean
    _count: {
        orders: number
    }
}

export function TablesList({tables}: { tables: Table[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)
    const [showQRCode, setShowQRCode] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{
        id: string
        number: number
    } | null>(null)

    async function handleToggleStatus(id: string) {
        setLoading(id)
        await toggleTableStatus(id)
        setLoading(null)
        toast.success("Le statut de la table a été mis à jour avec succès.")
        router.refresh()
    }

    async function handleDelete(id: string, number: number) {
        setDeleteTarget({id, number})
    }

    async function confirmDelete() {
        if (!deleteTarget) return
        setIsLoading(true)
        setLoading(deleteTarget.id)
        const result = await deleteTable(deleteTarget.id)
        setLoading(null)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
            return
        }

        toast.success("Le table a été supprimée avec succès.")
        router.refresh()
        setDeleteTarget(null)
    }

    if (tables.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-center">
                        Aucune table pour le moment.
                        <br/>
                        Créez votre première table pour générer son QR code.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                {tables.map((table) => (
                    <Card key={table.id}
                          className={!table.isActive ? "opacity-60 hover:border-primary/50 hover:shadow-md" : "hover:shadow-md transition-shadow h-full flex flex-col hover:border-primary/50"}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Table {table.number}</CardTitle>
                                <Badge variant={table.isActive ? 'default' : 'secondary'}>
                                    {table.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 flex-1">
                            {table._count.orders > 0 && (
                                <div className="text-sm">
        <span className="text-orange-500 font-medium">
          {table._count.orders} commande(s) en cours
        </span>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="mt-auto">
                            <div className="flex gap-2 w-full">
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                        setSelectedTable(table)
                                        setShowQRCode(true)
                                    }}
                                    disabled={loading === table.id}
                                >
                                    <QrCode className="h-4 w-4 mr-2"/>
                                    QR Code
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleStatus(table.id)}
                                    disabled={loading === table.id}
                                >
                                    <Power className="h-4 w-4"/>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(table.id, table.number)}
                                    disabled={loading === table.id || table._count.orders > 0}
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>

                ))}
            </div>

            {selectedTable && (
                <QRCodeDialog
                    table={selectedTable}
                    open={showQRCode}
                    onOpenChange={setShowQRCode}
                />
            )}

            {/* AlertDialog suppression */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Supprimer le produit {deleteTarget?.number} ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible.
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