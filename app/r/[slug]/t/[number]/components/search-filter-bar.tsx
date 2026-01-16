// app/r/[slug]/t/[number]/components/search-filter-bar.tsx
'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Category {
    id: string
    name: string
}

interface SearchFilterBarProps {
    categories: Category[]
    selectedCategory: string | null
    onCategorySelect: (categoryId: string | null) => void
    searchQuery: string
    onSearchChange: (query: string) => void
}

export function SearchFilterBar({
    categories,
    selectedCategory,
    onCategorySelect,
    searchQuery,
    onSearchChange,
}: SearchFilterBarProps) {
    return (
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 shadow-sm mt-5">
            <div className="max-w-3xl mx-auto px-4 py-3 space-y-3">
                {/* Barre de recherche */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        type="search"
                        placeholder="Rechercher un produit..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 pr-10"
                    />
                    {searchQuery && (
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => onSearchChange('')}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Filtres catégories - scroll horizontal */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <Badge
                        variant={selectedCategory === null ? 'default' : 'outline'}
                        className="cursor-pointer whitespace-nowrap"
                        onClick={() => onCategorySelect(null)}
                    >
                        Tout
                    </Badge>

                    {categories.map((category) => (
                        <Badge
                            key={category.id}
                            variant={
                                selectedCategory === category.id ? 'default' : 'outline'
                            }
                            className="cursor-pointer whitespace-nowrap"
                            onClick={() => onCategorySelect(category.id)}
                        >
                            {category.name}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    )
}