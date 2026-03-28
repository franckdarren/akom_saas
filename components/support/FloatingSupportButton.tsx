'use client'

import {useState} from 'react'
import {MessageSquare} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {SupportPanel} from './SupportPanel'

export function FloatingSupportButton() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="hidden md:block">
            {/* Bouton flottant */}
            <Button
                onClick={() => setIsOpen(true)}
                size="icon"
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:opacity-90 z-50"
            >
                <MessageSquare className="h-6 w-6"/>
            </Button>

            {/* Panel */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-1.5rem)] h-[80vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
                >
                    <SupportPanel showHeader={true} onClose={() => setIsOpen(false)}/>
                </div>
            )}
        </div>
    )
}
