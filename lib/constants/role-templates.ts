// lib/constants/role-templates.ts

import type { PermissionResource, PermissionAction } from '@/app/generated/prisma/client'

export interface RoleTemplate {
    id: string
    name: string
    description: string
    icon: string
    permissions: {
        resource: PermissionResource
        action: PermissionAction
    }[]
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
    {
        id: 'kitchen-staff',
        name: 'Équipe Cuisine',
        description: 'Gère uniquement les commandes en cuisine. Peut voir les commandes, changer leur statut et consulter le menu.',
        icon: '👨‍🍳',
        permissions: [
            { resource: 'menu', action: 'read' },
            { resource: 'tables', action: 'read' },
            { resource: 'orders', action: 'read' },
            { resource: 'orders', action: 'update' },
        ],
    },
    {
        id: 'stock-manager',
        name: 'Gestionnaire de Stock',
        description: 'Responsable de la gestion des stocks. Peut ajuster les quantités, voir l\'historique et gérer la disponibilité des produits.',
        icon: '📦',
        permissions: [
            { resource: 'menu', action: 'read' },
            { resource: 'products', action: 'update' }, // Pour gérer la disponibilité
            { resource: 'stocks', action: 'read' },
            { resource: 'stocks', action: 'update' },
            { resource: 'stocks', action: 'manage' },
        ],
    },
    {
        id: 'accountant',
        name: 'Responsable Financier',
        description: 'Accès aux données financières et comptables. Peut consulter les paiements, les statistiques et les rapports.',
        icon: '💰',
        permissions: [
            { resource: 'menu', action: 'read' },
            { resource: 'orders', action: 'read' },
            { resource: 'payments', action: 'read' },
            { resource: 'payments', action: 'manage' },
            { resource: 'stats', action: 'read' },
        ],
    },
    {
        id: 'owner-readonly',
        name: 'Propriétaire (Lecture seule)',
        description: 'Peut tout voir mais rien modifier. Parfait pour un propriétaire qui veut suivre l\'activité sans risquer de modifications.',
        icon: '👁️',
        permissions: [
            { resource: 'restaurants', action: 'read' },
            { resource: 'users', action: 'read' },
            { resource: 'menu', action: 'read' },
            { resource: 'tables', action: 'read' },
            { resource: 'orders', action: 'read' },
            { resource: 'stocks', action: 'read' },
            { resource: 'payments', action: 'read' },
            { resource: 'stats', action: 'read' },
            { resource: 'roles', action: 'read' },
        ],
    },
    {
        id: 'waiter',
        name: 'Serveur / Personnel de Salle',
        description: 'Gère le service en salle. Peut consulter le menu, voir les commandes et marquer les commandes comme livrées.',
        icon: '🍽️',
        permissions: [
            { resource: 'menu', action: 'read' },
            { resource: 'tables', action: 'read' },
            { resource: 'orders', action: 'read' },
            { resource: 'orders', action: 'update' }, // Pour marquer comme livré
            { resource: 'payments', action: 'read' }, // Pour vérifier si une table a payé
        ],
    },
    {
        id: 'manager',
        name: 'Gérant de Restaurant',
        description: 'Gestion opérationnelle complète sauf finances et utilisateurs. Peut gérer le menu, les commandes, les stocks et les tables.',
        icon: '👔',
        permissions: [
            { resource: 'restaurants', action: 'read' },
            { resource: 'menu', action: 'read' },
            { resource: 'categories', action: 'create' },
            { resource: 'categories', action: 'update' },
            { resource: 'categories', action: 'delete' },
            { resource: 'products', action: 'create' },
            { resource: 'products', action: 'update' },
            { resource: 'products', action: 'delete' },
            { resource: 'tables', action: 'read' },
            { resource: 'tables', action: 'create' },
            { resource: 'tables', action: 'update' },
            { resource: 'tables', action: 'delete' },
            { resource: 'orders', action: 'read' },
            { resource: 'orders', action: 'update' },
            { resource: 'orders', action: 'delete' },
            { resource: 'stocks', action: 'read' },
            { resource: 'stocks', action: 'update' },
            { resource: 'stats', action: 'read' },
        ],
    },
]