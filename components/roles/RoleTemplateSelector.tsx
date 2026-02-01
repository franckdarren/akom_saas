// components/roles/RoleTemplateSelector.tsx
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateRoleDialog } from './CreateRoleDialog'
import { Sparkles, ArrowRight } from 'lucide-react'

interface RoleTemplateSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RoleTemplateSelector({
    open,
    onOpenChange,
}: RoleTemplateSelectorProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplate | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)

    function handleTemplateSelect(template: RoleTemplate) {
        setSelectedTemplate(template)
        onOpenChange(false)
        setShowCreateDialog(true)
    }

    function handleCustomRole() {
        setSelectedTemplate(null)
        onOpenChange(false)
        setShowCreateDialog(true)
    }

    function handleCreateDialogClose() {
        setShowCreateDialog(false)
        setSelectedTemplate(null)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Créer un nouveau rôle</DialogTitle>
                        <DialogDescription>
                            Choisissez un modèle prédéfini ou créez un rôle personnalisé
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Templates prédéfinis */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">Modèles recommandés</h3>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {ROLE_TEMPLATES.map((template) => (
                                    <Card
                                        key={template.id}
                                        className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                                        onClick={() => handleTemplateSelect(template)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl">{template.icon}</span>
                                                    <div>
                                                        <CardTitle className="text-base">{template.name}</CardTitle>
                                                        <Badge variant="secondary" className="mt-1 text-xs">
                                                            {template.permissions.length} permissions
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription className="text-sm">
                                                {template.description}
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Option personnalisée */}
                        <div className="space-y-4">
                            <h3 className="font-semibold">Ou créez un rôle sur mesure</h3>

                            <Card
                                className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                                onClick={handleCustomRole}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base">Rôle personnalisé</CardTitle>
                                            <CardDescription className="mt-1">
                                                Définissez vous-même toutes les permissions
                                            </CardDescription>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog de création avec template pré-rempli ou vide */}
            <CreateRoleDialog
                open={showCreateDialog}
                onOpenChange={handleCreateDialogClose}
                template={selectedTemplate}
            />
        </>
    )
}