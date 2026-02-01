// components/users/InviteUserButton.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InviteUserDialog } from './InviteUserDialog'
import { UserPlus } from 'lucide-react'

export function InviteUserButton() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Inviter un membre
            </Button>

            <InviteUserDialog open={open} onOpenChange={setOpen} />
        </>
    )
}