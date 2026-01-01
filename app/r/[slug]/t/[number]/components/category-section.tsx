// app/r/[slug]/t/[number]/components/category-section.tsx
'use client'

import { MenuItem } from './menu-item'

interface Product {
    id: string
    name: string
    description: string | null
    price: number
    imageUrl: string | null
    stock: { quantity: number } | null
}

interface CategorySectionProps {
    categoryName: string
    products: Product[]
}

export function CategorySection({ categoryName, products }: CategorySectionProps) {
    if (products.length === 0) {
        return null
    }

    return (
        <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold px-4">
                {categoryName}
            </h2>

            <div className="space-y-3 px-4">
                {products.map((product) => (
                    <MenuItem key={product.id} product={product} />
                ))}
            </div>
        </section>
    )
}