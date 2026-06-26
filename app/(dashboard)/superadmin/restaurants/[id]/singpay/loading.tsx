import { Skeleton } from '@/components/ui/skeleton'

export default function SingpayConfigLoading() {
    return (
        <>
            {/* Header avec bouton retour */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Skeleton className="h-7 w-7 rounded-sm" />
                <div className="h-4 w-px bg-border mx-1" />
                <Skeleton className="h-8 w-24 rounded-md" />
            </header>

            <div className="layout-page">
                {/* Titre */}
                <div className="space-y-1.5">
                    <Skeleton className="h-9 w-72 max-w-full" />
                    <Skeleton className="h-4 w-96 max-w-full" />
                </div>

                {/* Formulaire de config SingPay */}
                <div className="rounded-xl border bg-card p-6 space-y-6 max-w-2xl">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                    ))}
                    <Skeleton className="h-10 w-40 rounded-md" />
                </div>
            </div>
        </>
    )
}
