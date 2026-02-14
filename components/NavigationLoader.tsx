// components/NavigationLoader.tsx
"use client"

export function NavigationLoader({loading}: { loading: boolean }) {
    if (!loading) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"/>
        </div>
    )
}
