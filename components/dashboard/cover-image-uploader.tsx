// components/dashboard/cover-image-uploader.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, X, ImageIcon } from 'lucide-react'

interface CoverImageUploaderProps {
    value?: string | null
    onUploadComplete: (url: string) => void
    onRemove?: () => void
    disabled?: boolean
}

export function CoverImageUploader({
    value,
    onUploadComplete,
    onRemove,
    disabled = false,
}: CoverImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [preview, setPreview] = useState<string | null>(value || null)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Validation
        if (!file.type.startsWith('image/')) {
            setError('Le fichier doit être une image')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('L\'image ne doit pas dépasser 5MB')
            return
        }

        setError(null)
        setIsUploading(true)

        try {
            // Nom de fichier unique
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`

            // Upload vers Supabase Storage
            const supabase = createClient()
            const { data, error: uploadError } = await supabase.storage
                .from('restaurant-covers')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                })

            if (uploadError) {
                throw uploadError
            }

            // Récupérer l'URL publique
            const {
                data: { publicUrl },
            } = supabase.storage.from('restaurant-covers').getPublicUrl(data.path)

            setPreview(publicUrl)
            onUploadComplete(publicUrl)
        } catch (err) {
            console.error('Erreur upload:', err)
            setError('Erreur lors de l\'upload de l\'image')
        } finally {
            setIsUploading(false)
        }
    }

    function handleRemove() {
        setPreview(null)
        setError(null)
        onRemove?.()
    }

    return (
        <div className="space-y-2">
            <Label>Image de couverture du restaurant</Label>
            <p className="text-sm text-muted-foreground">
                Cette image s'affichera en haut du menu public (format paysage recommandé)
            </p>

            {preview ? (
                <div className="relative w-full h-48 md:h-64 bg-muted rounded-lg overflow-hidden">
                    <Image
                        src={preview}
                        alt="Aperçu"
                        fill
                        className="object-cover"
                    />
                    {!disabled && (
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={handleRemove}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-center w-full h-48 md:h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 transition-colors">
                    <label
                        htmlFor="cover-upload"
                        className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                    >
                        {isUploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
                                <span className="text-sm font-medium text-muted-foreground mb-1">
                                    Cliquez pour choisir une image
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    PNG, JPG, JPEG (max 5MB)
                                </span>
                                <span className="text-xs text-muted-foreground mt-2">
                                    Format paysage recommandé : 1200x400px
                                </span>
                            </>
                        )}
                        <input
                            id="cover-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={disabled || isUploading}
                            className="hidden"
                        />
                    </label>
                </div>
            )}

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    )
}