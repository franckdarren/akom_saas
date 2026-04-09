'use client'

import {useRef, useState} from 'react'
import {ArrowLeft} from 'lucide-react'
import {SupportPanel} from '@/components/support/SupportPanel'
import {PageHeader} from '@/components/ui/page-header'
import {Button} from '@/components/ui/button'

export function SupportPageClient() {
    const [isInSubView, setIsInSubView] = useState(false)
    const backRef = useRef<(() => void) | null>(null)

    return (
        <div className="max-w-2xl w-full flex flex-col gap-4 flex-1 min-h-0">
            <PageHeader
                title="Support"
                description="Contactez notre équipe ou suivez vos tickets"
                action={
                    isInSubView ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => backRef.current?.()}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2"/>
                            Retour
                        </Button>
                    ) : undefined
                }
            />
            <SupportPanel
                showHeader={false}
                onViewChange={(view) => setIsInSubView(view !== 'list')}
                backRef={backRef}
            />
        </div>
    )
}
