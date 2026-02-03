// lib/utils/upload.ts
import { createClient } from '@/lib/supabase/client'

export async function uploadPaymentProof(
    file: File,
    restaurantId: string
): Promise<{ url?: string; error?: string }> {
    try {
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
            return { error: 'Le fichier doit être une image' }
        }

        // Vérifier la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return { error: 'L\'image ne doit pas dépasser 5MB' }
        }

        const supabase = createClient()

        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop()
        const fileName = `${restaurantId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

        // Upload vers Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            })

        if (uploadError) {
            console.error('Erreur upload:', uploadError)
            return { error: 'Erreur lors de l\'upload du fichier' }
        }

        // Récupérer l'URL publique
        const {
            data: { publicUrl },
        } = supabase.storage.from('payment-proofs').getPublicUrl(data.path)

        return { url: publicUrl }
    } catch (error) {
        console.error('Erreur upload:', error)
        return { error: 'Erreur lors de l\'upload du fichier' }
    }
}