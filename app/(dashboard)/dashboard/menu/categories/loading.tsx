import { Skeleton } from '@/components/ui/skeleton'

export default function CategoriesLoading() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({length: 6}).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>
        </div>
    )
}
