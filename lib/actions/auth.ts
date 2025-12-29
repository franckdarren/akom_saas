'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    type LoginInput,
    type RegisterInput,
    type ForgotPasswordInput,
} from '@/lib/validations/auth'

// ============================================================
// TYPES DE RETOUR
// ============================================================

type ActionResult = {
    success: boolean
    message: string
    error?: string
}

// ============================================================
// INSCRIPTION
// ============================================================

export async function signUp(data: RegisterInput): Promise<ActionResult> {
    // Validation
    const parsed = registerSchema.safeParse(data)
    if (!parsed.success) {
        return {
            success: false,
            message: 'Données invalides',
            error: parsed.error.issues[0].message,
        }
    }

    const supabase = await createClient()

    // Créer l'utilisateur
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
        },
    })

    if (authError) {
        return {
            success: false,
            message: 'Erreur lors de l\'inscription',
            error: authError.message,
        }
    }

    if (!authData.user) {
        return {
            success: false,
            message: 'Erreur lors de la création du compte',
        }
    }

    // Rediriger vers le dashboard
    revalidatePath('/', 'layout')
    redirect('/dashboard')
}


// ============================================================
// CONNEXION
// ============================================================

export async function signIn(data: LoginInput): Promise<ActionResult> {
    // Validation
    const parsed = loginSchema.safeParse(data)
    if (!parsed.success) {
        return {
            success: false,
            message: 'Données invalides',
            error: parsed.error.issues[0].message,
        }
    }

    const supabase = await createClient()

    // Connexion
    const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
    })

    if (error) {
        return {
            success: false,
            message: 'Email ou mot de passe incorrect',
            error: error.message,
        }
    }

    // Rediriger vers le dashboard
    revalidatePath('/', 'layout')
    redirect('/dashboard')
}


// ============================================================
// DÉCONNEXION
// ============================================================

export async function signOut(): Promise<void> {
    const supabase = await createClient()

    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    redirect('/login')
}


// ============================================================
// MOT DE PASSE OUBLIÉ
// ============================================================

export async function forgotPassword(
    data: ForgotPasswordInput
): Promise<ActionResult> {
    // Validation
    const parsed = forgotPasswordSchema.safeParse(data)
    if (!parsed.success) {
        return {
            success: false,
            message: 'Email invalide',
            error: parsed.error.issues[0].message,
        }
    }

    const supabase = await createClient()

    // Envoyer l'email de réinitialisation
    const { error } = await supabase.auth.resetPasswordForEmail(
        parsed.data.email,
        {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/reset-password`,
        }
    )

    if (error) {
        return {
            success: false,
            message: 'Erreur lors de l\'envoi de l\'email',
            error: error.message,
        }
    }

    return {
        success: true,
        message: 'Email de réinitialisation envoyé',
    }
}


// ============================================================
// RÉINITIALISER LE MOT DE PASSE
// ============================================================

export async function resetPassword(
    password: string,
    confirmPassword: string
): Promise<ActionResult> {
    // Validation
    if (password !== confirmPassword) {
        return {
            success: false,
            message: 'Les mots de passe ne correspondent pas',
        }
    }

    if (password.length < 6) {
        return {
            success: false,
            message: 'Le mot de passe doit contenir au moins 6 caractères',
        }
    }

    const supabase = await createClient()

    // Mettre à jour le mot de passe
    const { error } = await supabase.auth.updateUser({
        password: password,
    })

    if (error) {
        return {
            success: false,
            message: 'Erreur lors de la mise à jour du mot de passe',
            error: error.message,
        }
    }

    // NE PAS rediriger ici - on laisse le composant gérer ça
    return {
        success: true,
        message: 'Mot de passe mis à jour avec succès',
    }
}


// ============================================================
// METTRE À JOUR LE MOT DE PASSE (depuis le profil)
// ============================================================

export async function updatePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
): Promise<ActionResult> {
    // Validation
    if (newPassword !== confirmPassword) {
        return {
            success: false,
            message: 'Les nouveaux mots de passe ne correspondent pas',
        }
    }

    if (newPassword.length < 6) {
        return {
            success: false,
            message: 'Le mot de passe doit contenir au moins 6 caractères',
        }
    }

    const supabase = await createClient()

    // Récupérer l'utilisateur
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return {
            success: false,
            message: 'Utilisateur non connecté',
        }
    }

    // Vérifier le mot de passe actuel en essayant de se connecter
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
    })

    if (signInError) {
        return {
            success: false,
            message: 'Mot de passe actuel incorrect',
        }
    }

    // Mettre à jour le mot de passe
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    })

    if (error) {
        return {
            success: false,
            message: 'Erreur lors de la mise à jour du mot de passe',
            error: error.message,
        }
    }

    return {
        success: true,
        message: 'Mot de passe mis à jour avec succès',
    }
}


// ============================================================
// RÉCUPÉRER L'UTILISATEUR CONNECTÉ (avec vérification SuperAdmin)
// ============================================================

export async function getUser() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    return user
}


// ============================================================
// RECUPERER LE ROLE DE L'UTILISATEUR
// ============================================================

export async function getUserRole(): Promise<"admin" | "kitchen" | "superadmin"> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Not authenticated")
    }

    // Vérifier si SuperAdmin
    const isSuperAdminUser = await isSuperAdmin()
    if (isSuperAdminUser) {
        return "superadmin"
    }

    // Récupérer le rôle dans restaurant_users
    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
        select: { role: true },
    })

    return restaurantUser?.role || "kitchen"
}


// ============================================================
// VÉRIFIER SI L'UTILISATEUR EST SUPERADMIN
// ============================================================

export async function isSuperAdmin(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    // Liste des emails SuperAdmin (à mettre dans .env en production)
    const superAdmins = process.env.SUPER_ADMIN_EMAILS?.split(',') || []

    return superAdmins.includes(user.email || '')
}