// lib/hooks/use-navigation-loading.ts
"use client"

import {useEffect, useState} from "react"
import {usePathname} from "next/navigation"

export function useNavigationLoading() {
    const pathname = usePathname()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(false)
    }, [pathname])

    const startLoading = () => {
        setLoading(true)
    }

    return {loading, startLoading}
}
