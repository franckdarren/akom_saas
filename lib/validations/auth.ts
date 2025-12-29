import { z } from 'zod'

// ============================================================
// Schéma de connexion
// ============================================================
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'L\'email est requis')
        .email('Email invalide'),
    password: z
        .string()
        .min(1, 'Le mot de passe est requis')
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})


// ============================================================
// Schéma d'inscription
// ============================================================
export const registerSchema = z.object({
    email: z
        .string()
        .min(1, 'L\'email est requis')
        .email('Email invalide'),
    password: z
        .string()
        .min(1, 'Le mot de passe est requis')
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z
        .string()
        .min(1, 'Veuillez confirmer votre mot de passe'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
})


// ============================================================
// Schéma de réinitialisation mot de passe
// ============================================================
export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'L\'email est requis')
        .email('Email invalide'),
})


// ============================================================
// Schéma de nouveau mot de passe
// ============================================================
export const resetPasswordSchema = z.object({
    password: z
        .string()
        .min(1, 'Le mot de passe est requis')
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z
        .string()
        .min(1, 'Veuillez confirmer votre mot de passe'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
})

// Types inférés
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>