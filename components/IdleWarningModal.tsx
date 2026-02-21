'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Clock, ShieldAlert} from 'lucide-react'

interface IdleWarningModalProps {
    isOpen: boolean
    countdown: number
    onStayConnected: () => void
    onLogout: () => void
}

export function IdleWarningModal({
                                     isOpen,
                                     countdown,
                                     onStayConnected,
                                     onLogout,
                                 }: IdleWarningModalProps) {
    const minutes = Math.floor(countdown / 60)
    const seconds = countdown % 60

    const formattedTime =
        minutes > 0
            ? `${minutes}:${String(seconds).padStart(2, '0')}`
            : `${seconds}s`

    return (
        <Dialog open={isOpen}>
            <DialogContent
                className="sm:max-w-md"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <ShieldAlert className="h-5 w-5 text-destructive"/>
                        </div>
                        <DialogTitle>Session inactive</DialogTitle>
                    </div>

                    <DialogDescription>
                        Vous êtes inactif depuis un moment. Pour protéger votre compte,
                        vous serez déconnecté dans :
                    </DialogDescription>
                </DialogHeader>

                {/* Countdown */}
                <div className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-2 rounded-xl border bg-muted px-6 py-4">
                        <Clock className="h-5 w-5 text-muted-foreground"/>
                        <span className="text-3xl font-bold tabular-nums">
              {formattedTime}
            </span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                        onClick={onStayConnected}
                        className="flex-1"
                    >
                        Rester connecté
                    </Button>

                    <Button
                        onClick={onLogout}
                        variant="outline"
                        className="flex-1"
                    >
                        Se déconnecter
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}