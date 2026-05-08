'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {
    MODULE_CATALOG,
    getDefaultModulesForActivity,
    type ModuleKey,
} from '@/lib/config/modules'
import type { ActivityType } from '@/lib/config/activity-labels'

// ─── Récupérer les modules actifs d'une structure ──────────────────────────────
// Retourne null si aucun module n'est encore hydraté (première fois).

export async function getActiveModules(restaurantId: string): Promise<ModuleKey[] | null> {
    const rows = await prisma.restaurantModule.findMany({
        where: { restaurantId },
        select: { moduleKey: true, isEnabled: true },
    })

    if (rows.length === 0) return null // signal : pas encore hydraté

    return rows
        .filter(r => r.isEnabled)
        .map(r => r.moduleKey as ModuleKey)
}

// ─── Hydrater les modules par défaut selon l'activité ──────────────────────────
// Appelé une seule fois (lors de la création ou du premier accès).

export async function hydrateDefaultModules(
    restaurantId: string,
    activityType: ActivityType,
    userId: string,
): Promise<ModuleKey[]> {
    const enabled = getDefaultModulesForActivity(activityType)
    const allKeys = Object.keys(MODULE_CATALOG) as ModuleKey[]

    await prisma.restaurantModule.createMany({
        data: allKeys.map(key => ({
            restaurantId,
            moduleKey: key,
            isEnabled: enabled.includes(key),
            enabledBy: userId,
        })),
        skipDuplicates: true,
    })

    return enabled
}

// ─── Activer / désactiver un module ────────────────────────────────────────────

export async function toggleModule(
    restaurantId: string,
    moduleKey: ModuleKey,
    enabled: boolean,
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non authentifié' }

    const def = MODULE_CATALOG[moduleKey]
    if (!def) return { success: false, error: 'Module inconnu' }
    if (def.isCore) return { success: false, error: 'Ce module est obligatoire et ne peut pas être désactivé' }

    await prisma.restaurantModule.upsert({
        where: { restaurantId_moduleKey: { restaurantId, moduleKey } },
        create: { restaurantId, moduleKey, isEnabled: enabled, enabledBy: user.id },
        update: { isEnabled: enabled, enabledBy: user.id },
    })

    revalidatePath('/dashboard', 'layout')
    return { success: true }
}

// ─── Initialiser les modules depuis une sélection manuelle (onboarding) ────────
// Permet à l'admin de choisir ses modules dès la création de la structure.

export async function initModulesFromSelection(
    restaurantId: string,
    selectedKeys: ModuleKey[],
    userId: string,
): Promise<{ success: boolean; error?: string }> {
    const allKeys = Object.keys(MODULE_CATALOG) as ModuleKey[]

    await prisma.restaurantModule.createMany({
        data: allKeys.map(key => ({
            restaurantId,
            moduleKey: key,
            isEnabled: MODULE_CATALOG[key].isCore || selectedKeys.includes(key),
            enabledBy: userId,
        })),
        skipDuplicates: true,
    })

    revalidatePath('/dashboard', 'layout')
    return { success: true }
}

// ─── Réinitialiser aux valeurs par défaut de l'activité ────────────────────────

export async function resetModulesToDefaults(
    restaurantId: string,
    activityType: ActivityType,
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non authentifié' }

    const defaults = getDefaultModulesForActivity(activityType)
    const allKeys = Object.keys(MODULE_CATALOG) as ModuleKey[]

    await Promise.all(
        allKeys
            .filter(k => !MODULE_CATALOG[k].isCore)
            .map(key =>
                prisma.restaurantModule.upsert({
                    where: { restaurantId_moduleKey: { restaurantId, moduleKey: key } },
                    create: { restaurantId, moduleKey: key, isEnabled: defaults.includes(key), enabledBy: user.id },
                    update: { isEnabled: defaults.includes(key), enabledBy: user.id },
                })
            )
    )

    revalidatePath('/dashboard', 'layout')
    return { success: true }
}
