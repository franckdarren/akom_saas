'use client'

import {useRouter} from 'next/navigation'
import {Package} from 'lucide-react'
import {LoadingButton} from '@/components/ui/loading-button'
import {useNavigationLoading} from '@/lib/hooks/use-navigation-loading'

export function BackToWarehouseButton() {
    const router = useRouter()
    const {loading, startLoading} = useNavigationLoading()

    function handleClick() {
        startLoading()
        router.push('/dashboard/warehouse')
    }

    return (
        <LoadingButton onClick={handleClick} isLoading={loading} variant="outline" icon={<Package />}>
            Aller au magasin
        </LoadingButton>
    )
}
