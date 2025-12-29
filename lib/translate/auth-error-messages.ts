// ============================================================
// Traduction des messages d'erreurs de supabase
// ============================================================

export const authErrorMessages: Record<string, string> = {
    'Invalid login credentials': 'Email ou mot de passe incorrect',
    'Email not confirmed': 'Veuillez confirmer votre adresse email',
    'User not found': 'Aucun compte trouvé avec cet email',
    'Invalid email or password': 'Email ou mot de passe incorrect',
    'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
    'Too many requests':'Trop de tentatives. Veuillez réessayer plus tard', 
    'Email rate limit exceeded': 'Trop de demandes. Veuillez attendre quelques minutes',
}

export function translateAuthError(error?: string | null) {
    if (!error) return null

    return authErrorMessages[error] ||
        'Une erreur est survenue. Veuillez réessayer.'
}
