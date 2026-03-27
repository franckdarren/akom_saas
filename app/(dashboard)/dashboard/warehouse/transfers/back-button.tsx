'use client'

import {useRouter} from 'next/navigation'
import {Package, Loader2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {useNavigationLoading} from '@/lib/hooks/use-navigation-loading'

export function BackToWarehouseButton() {
    const router = useRouter()
    const {loading, startLoading} = useNavigationLoading()

    function handleClick() {
        startLoading()
        router.push('/dashboard/warehouse')
    }

    return (
        <Button onClick={handleClick} disabled={loading} variant="outline">
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
            ) : (
                <Package className="mr-2 h-4 w-4"/>
            )}
            Aller au magasin
        </Button>
    )
}
