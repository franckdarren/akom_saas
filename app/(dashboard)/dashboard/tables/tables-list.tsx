// app/(dashboard)/dashboard/tables/tables-list.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Power, Trash2, QrCode } from 'lucide-react'
import { toggleTableStatus, deleteTable } from '@/lib/actions/table'
import { QRCodeDialog } from './qrcode-dialog'

type Table = {
    id: string
    number: number
    isActive: boolean
    _count: {
        orders: number
    }
}

export function TablesList({ tables }: { tables: Table[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)
    const [showQRCode, setShowQRCode] = useState(false)

    async function handleToggleStatus(id: string) {
        setLoading(id)
        await toggleTableStatus(id)
        setLoading(null)
        router.refresh()
    }

    async function handleDelete(id: string, number: number) {
        if (!confirm(`Voulez-vous vraiment supprimer la table ${number} ?`)) {
            return
        }

        setLoading(id)
        const result = await deleteTable(id)
        setLoading(null)

        if (result.error) {
            alert(result.error)
        } else {
            router.refresh()
        }
    }

    if (tables.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-center">
                        Aucune table pour le moment.
                        <br />
                        Créez votre première table pour générer son QR code.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {tables.map((table) => (
                    <Card key={table.id} className='hover:shadow-md transition-shadow'>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Table {table.number}</CardTitle>
                                <Badge variant={table.isActive ? 'default' : 'secondary'}>
                                    {table.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {table._count.orders > 0 && (
                                <div className="text-sm">
                                    <span className="text-orange-500 font-medium">
                                        {table._count.orders} commande(s) en cours
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                        setSelectedTable(table)
                                        setShowQRCode(true)
                                    }}
                                    disabled={loading === table.id}
                                >
                                    <QrCode className="h-4 w-4 mr-2" />
                                    QR Code
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleStatus(table.id)}
                                    disabled={loading === table.id}
                                >
                                    <Power className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(table.id, table.number)}
                                    disabled={loading === table.id || table._count.orders > 0}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
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
        </>
    )
}