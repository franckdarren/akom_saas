// lib/validations/restaurant.ts
import { z } from 'zod'

// ============================================================
// Schéma de validation pour les paramètres du restaurant
// ============================================================

export const restaurantSettingsSchema = z.object({
    name: z
        .string()
        .min(2, 'Le nom doit contenir au moins 2 caractères')
        .max(100, 'Le nom ne peut pas dépasser 100 caractères'),

    phone: z
        .string()
        .optional()
        .refine(
            (val) => !val || /^[\d\s\+\-\(\)]+$/.test(val),
            'Numéro de téléphone invalide'
        ),

    address: z
        .string()
        .max(255, 'L\'adresse ne peut pas dépasser 255 caractères')
        .optional(),

    logoUrl: z
        .string()
        .url('URL invalide')
        .optional()
        .nullable(),

    coverImageUrl: z
        .string()
        .url('URL invalide')
        .optional()
        .nullable(),

    isActive: z
        .boolean()
        .default(true),
})

export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>