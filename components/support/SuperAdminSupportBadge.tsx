'use client'

import {useEffect, useState} from 'react'
import {Badge} from '@/components/ui/badge'
import {getUnreadTicketsCount} from '@/lib/actions/support'

export function SuperAdminSupportBadge() {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const loadCount = async () => {
            const result = await getUnreadTicketsCount()
            if (result.success) {
                setCount(result.count)
            }
        }

        loadCount()
        // Polling toutes les 30 secondes
        const interval = setInterval(loadCount, 30000)
        return () => clearInterval(interval)
    }, [])

    if (count === 0) return null

    return (
        <Badge className="ml-auto bg-red-500 text-white">
            {count}
        </Badge>
    )
}