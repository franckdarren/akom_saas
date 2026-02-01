'use client'

import { useState } from 'react'
import { ROLE_TEMPLATES, type RoleTemplate } from '@/lib/constants/role-templates'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateRoleDialog } from './CreateRoleDialog'

interface RoleTemplateSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RoleTemplateSelector({ open, onOpenChange }: RoleTemplateSelectorProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplate | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)

    function select(template: RoleTemplate | null) {
        setSelectedTemplate(template)
        onOpenChange(false)
        setShowCreateDialog(true)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-xl max-h-[80vh] p-0">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>Créer un rôle</DialogTitle>
                        <DialogDescription>
                            Choisissez un modèle ou partez d’un rôle vide.
                        </DialogDescription>
                    </DialogHeader>

                    {/* CONTENU SCROLLABLE */}
                    <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-120px)] space-y-2">
                        {ROLE_TEMPLATES.map((template) => (
                            <Card
                                key={template.id}
                                onClick={() => select(template)}
                                className="cursor-pointer hover:border-primary"
                            >
                                <CardHeader className="flex flex-row items-center gap-3 p-4">
                                    <div className="text-2xl">{template.icon}</div>
                                    <div className="flex-1">
                                        <CardTitle className="text-sm">{template.name}</CardTitle>
                                        <CardDescription className="text-xs">
                                            {template.description}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary">{template.permissions.length}</Badge>
                                </CardHeader>
                            </Card>
                        ))}

                        <div className="pt-4">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => select(null)}
                            >
                                Créer un rôle personnalisé
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>


            <CreateRoleDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                template={selectedTemplate}
            />
        </>
    )
}
