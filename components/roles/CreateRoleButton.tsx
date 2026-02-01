// components/roles/CreateRoleButton.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RoleTemplateSelector } from './RoleTemplateSelector'
import { Plus } from 'lucide-react'

export function CreateRoleButton() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Créer un rôle
            </Button>

            <RoleTemplateSelector open={open} onOpenChange={setOpen} />
        </>
    )
}