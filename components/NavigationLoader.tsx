// components/NavigationLoader.tsx
"use client"

export function NavigationLoader({loading}: { loading: boolean }) {
    if (!loading) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden bg-primary/20">
            <div className="h-full w-1/2 bg-primary rounded-full animate-nav-progress"/>
        </div>
    )
}
