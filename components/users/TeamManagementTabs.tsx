// components/users/TeamManagementTabs.tsx
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsersList } from './UsersList'
import { RolesList } from '@/components/roles/RolesList'
import { InviteUserButton } from './InviteUserButton'
import { CreateRoleButton } from '@/components/roles/CreateRoleButton'
import { PermissionGuard } from '@/components/permissions/PermissionGuard'
import { Users, Shield } from 'lucide-react'
import type { ReactNode } from 'react'

interface TeamManagementTabsProps {
    /**
     * Slot server-side : la page passe <InvitationsSection /> ici.
     * Il est affiché sous UsersList dans le tab "Membres".
     */
    children?: ReactNode
}

export function TeamManagementTabs({ children }: TeamManagementTabsProps) {
    const [activeTab, setActiveTab] = useState('members')

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Navigation par onglets */}
            <div className="flex items-center justify-between">
                <TabsList>
                    <TabsTrigger value="members" className="gap-2">
                        <Users className="h-4 w-4" />
                        Membres de l'équipe
                    </TabsTrigger>
                    <PermissionGuard resource="roles" action="read">
                        <TabsTrigger value="roles" className="gap-2">
                            <Shield className="h-4 w-4" />
                            Rôles et permissions
                        </TabsTrigger>
                    </PermissionGuard>
                </TabsList>

                {/* Actions contextuelles selon l'onglet actif */}
                <div className="flex items-center gap-2">
                    {activeTab === 'members' && (
                        <PermissionGuard resource="users" action="create">
                            <InviteUserButton />
                        </PermissionGuard>
                    )}
                    {activeTab === 'roles' && (
                        <PermissionGuard resource="roles" action="create">
                            <CreateRoleButton />
                        </PermissionGuard>
                    )}
                </div>
            </div>

            {/* Contenu de l'onglet Membres */}
            <TabsContent value="members" className="space-y-4">
                {/* Liste des membres actifs */}
                <UsersList />

                {/* Liste des invitations — rendu server-side via children */}
                {children}
            </TabsContent>

            {/* Contenu de l'onglet Rôles */}
            <TabsContent value="roles" className="space-y-4">
                <PermissionGuard
                    resource="roles"
                    action="read"
                    fallback={
                        <div className="text-center p-8 text-muted-foreground">
                            Vous n'avez pas accès à la gestion des rôles
                        </div>
                    }
                >
                    <RolesList />
                </PermissionGuard>
            </TabsContent>
        </Tabs>
    )
}