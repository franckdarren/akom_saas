'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Package, AlertTriangle, Eye, Edit, TrendingUp, MoreVertical } from 'lucide-react'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { formatPrice } from '@/lib/utils/format'
import { WarehouseProductWithStock } from '@/types/warehouse'

interface WarehouseProductsTableProps {
    products: WarehouseProductWithStock[]
}

export function WarehouseProductsTable({ products }: WarehouseProductsTableProps) {
    if (products.length === 0) {
        return (
            <EmptyState
                icon={Package}
                title="Aucun produit trouvé"
                description="Commencez par ajouter des produits à votre magasin de stockage pour gérer vos volumes."
                action={
                    <Button asChild className="mt-1">
                        <Link href="/dashboard/warehouse/products/new">Créer un produit</Link>
                    </Button>
                }
            />
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="hidden sm:table-cell">Image</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead className="hidden sm:table-cell">Unité</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="hidden lg:table-cell text-right">Valeur</TableHead>
                        <TableHead className="hidden lg:table-cell">Lien menu</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map(product => (
                        <TableRow key={product.id}>
                            {/* Image */}
                            <TableCell className="hidden sm:table-cell">
                                <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted">
                                    {product.imageUrl ? (
                                        <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Package className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            </TableCell>

                            {/* Nom et SKU */}
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <Link href={`/dashboard/warehouse/products/${product.id}`} className="font-medium hover:underline">
                                        {product.name}
                                    </Link>
                                    {product.sku && <span className="text-xs text-muted-foreground font-mono">SKU: {product.sku}</span>}
                                    {product.category && <Badge variant="outline" className="w-fit text-xs">{product.category}</Badge>}
                                </div>
                            </TableCell>

                            {/* Unité */}
                            <TableCell className="hidden sm:table-cell">
                                <div className="flex flex-col gap-1">
                                    {/* ✅ CORRECTION : Accéder à storageUnit depuis le produit, pas depuis le stock */}
                                    <span className="font-medium capitalize">{product.storageUnit}</span>
                                    {/* ✅ CORRECTION : Accéder à unitsPerStorage depuis le produit, pas depuis le stock */}
                                    <span className="text-xs text-muted-foreground">{product.unitsPerStorage} unités</span>
                                </div>
                            </TableCell>

                            {/* Stock */}
                            <TableCell className="text-right">
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-2">
                                        {product.isLowStock && <AlertTriangle className="h-4 w-4 text-warning" />}
                                        <span className={`font-semibold ${product.isLowStock ? 'text-warning' : ''}`}>
                                            {product.stock.quantity.toString()}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">Seuil: {product.stock.alertThreshold.toString()}</span>
                                </div>
                            </TableCell>

                            {/* Valeur */}
                            <TableCell className="hidden lg:table-cell text-right">
                                {product.stock.unitCost && product.stock.totalValue ? (
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="font-semibold">{formatPrice(product.stock.totalValue)}</span>
                                        <span className="text-xs text-muted-foreground">{formatPrice(product.stock.unitCost)} / unité</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-sm">—</span>
                                )}
                            </TableCell>

                            {/* Produit lié */}
                            <TableCell className="hidden lg:table-cell">
                                {product.linkedProduct ? (
                                    <Link href={`/dashboard/menu/products/${product.linkedProduct.id}`} className="hover:underline text-success">
                                        {product.linkedProduct.name} ×{product.conversionRatio}
                                    </Link>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Non lié</span>
                                )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon-sm"><MoreVertical className="h-4 w-4"/></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/warehouse/products/${product.id}`}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Voir
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/warehouse/products/${product.id}/edit`}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Modifier
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>
                                            <TrendingUp className="mr-2 h-4 w-4 text-info" />
                                            Entrée stock
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
