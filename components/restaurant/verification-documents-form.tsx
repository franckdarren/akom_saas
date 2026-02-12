// components/restaurant/verification-documents-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
    CheckCircle2,
    XCircle,
    Clock,
    Upload,
    FileText,
    User,
    AlertTriangle,
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { submitVerificationDocuments, resubmitVerificationDocuments } from '@/lib/actions/restaurant-verification'
import type { RestaurantVerificationDocument } from '@prisma/client'
import type { IdentityDocumentType } from '@/types/restaurant-verification'
import {
    VERIFICATION_STATUS_LABELS,
    IDENTITY_DOCUMENT_TYPE_LABELS,
    getVerificationBadgeVariant
} from '@/types/restaurant-verification'

// ============================================================
// PROPS
// ============================================================

interface VerificationDocumentsFormProps {
    restaurantId: string
    verificationDocument: RestaurantVerificationDocument | null
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export function VerificationDocumentsForm({
    restaurantId,
    verificationDocument,
}: VerificationDocumentsFormProps) {
    const router = useRouter()

    // États
    const [isLoading, setIsLoading] = useState(false)
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(
        verificationDocument?.profilePhotoUrl || null
    )
    const [identityDocumentUrl, setIdentityDocumentUrl] = useState<string | null>(
        verificationDocument?.identityDocumentUrl || null
    )
    const [identityDocumentType, setIdentityDocumentType] = useState<IdentityDocumentType | null>(
        (verificationDocument?.identityDocumentType as IdentityDocumentType) || null
    )

    const status = verificationDocument?.verificationStatus || 'pending_documents'
    const isRejected = status === 'documents_rejected'
    const isVerified = status === 'verified'
    const isPending = status === 'pending_documents'
    const isSubmitted = status === 'documents_submitted'

    // ============================================================
    // UPLOAD DE FICHIERS (placeholder - à remplacer par votre solution)
    // ============================================================

    async function handleProfilePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // TODO: Implémenter l'upload vers Supabase Storage
        // Pour l'instant, simulation
        setIsLoading(true)

        try {
            // Simuler upload
            await new Promise(resolve => setTimeout(resolve, 1000))

            // TODO: Remplacer par le vrai URL après upload
            const fakeUrl = `https://storage.akom.com/profiles/${file.name}`
            setProfilePhotoUrl(fakeUrl)

            toast.success('Photo de profil uploadée')
        } catch (error) {
            toast.error('Erreur lors de l\'upload')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleIdentityDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!identityDocumentType) {
            toast.error('Veuillez d\'abord sélectionner le type de document')
            return
        }

        setIsLoading(true)

        try {
            // Simuler upload
            await new Promise(resolve => setTimeout(resolve, 1000))

            // TODO: Remplacer par le vrai URL après upload
            const fakeUrl = `https://storage.akom.com/identity/${file.name}`
            setIdentityDocumentUrl(fakeUrl)

            toast.success('Pièce d\'identité uploadée')
        } catch (error) {
            toast.error('Erreur lors de l\'upload')
        } finally {
            setIsLoading(false)
        }
    }

    // ============================================================
    // SOUMISSION
    // ============================================================

    async function handleSubmit() {
        if (!profilePhotoUrl || !identityDocumentUrl || !identityDocumentType) {
            toast.error('Veuillez uploader tous les documents requis')
            return
        }

        setIsLoading(true)

        const action = isRejected ? resubmitVerificationDocuments : submitVerificationDocuments

        const result = await action(restaurantId, {
            profilePhotoUrl,
            identityDocumentUrl,
            identityDocumentType,
        })

        setIsLoading(false)

        if (result.success) {
            toast.success('Documents soumis avec succès !')
            router.refresh()
        } else {
            toast.error(result.error || 'Une erreur est survenue')
        }
    }

    // ============================================================
    // RENDU
    // ============================================================

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Vérification du restaurant</CardTitle>
                        <CardDescription className="mt-2">
                            Soumettez vos documents pour activer votre compte
                        </CardDescription>
                    </div>

                    <Badge variant={getVerificationBadgeVariant(status)}>
                        {VERIFICATION_STATUS_LABELS[status]}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">

                {/* Statut vérifié */}
                {isVerified && (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            Votre restaurant a été vérifié et approuvé ! Vous pouvez maintenant utiliser toutes les fonctionnalités.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Statut rejeté */}
                {isRejected && verificationDocument?.rejectionReason && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Documents rejetés :</strong> {verificationDocument.rejectionReason}
                            <br />
                            <span className="text-sm">Veuillez corriger et re-soumettre vos documents.</span>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Statut en attente de validation */}
                {isSubmitted && (
                    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                        <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                            Vos documents ont été soumis et sont en cours de vérification par notre équipe.
                            Nous vous contacterons sous 24 à 48h.
                        </AlertDescription>
                        </div>
                    </Alert>
                )}

                {/* Formulaire */}
                {!isVerified && !isSubmitted && (
                    <>
                        {/* Photo de profil */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <Label className="text-base">
                                    Photo de profil <span className="text-red-500">*</span>
                                </Label>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Une photo récente de vous ou du gérant principal du restaurant
                            </p>

                            <div className="flex items-center gap-4">
                                {profilePhotoUrl && (
                                    <div className="relative h-24 w-24 rounded-lg overflow-hidden border">
                                        <img
                                            src={profilePhotoUrl}
                                            alt="Aperçu"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}

                                <div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isLoading}
                                        onClick={() => document.getElementById('profile-photo-input')?.click()}
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        {profilePhotoUrl ? 'Changer la photo' : 'Uploader la photo'}
                                    </Button>
                                    <input
                                        id="profile-photo-input"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleProfilePhotoUpload}
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Format: JPG, PNG - Max 5MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pièce d'identité */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <Label className="text-base">
                                    Pièce d'identité <span className="text-red-500">*</span>
                                </Label>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Document d'identité valide du gérant principal
                            </p>

                            {/* Type de document */}
                            <div className="space-y-2">
                                <Label htmlFor="document-type">Type de document</Label>
                                <Select
                                    value={identityDocumentType || undefined}
                                    onValueChange={(value) => setIdentityDocumentType(value as IdentityDocumentType)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez le type de document" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(IDENTITY_DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Upload */}
                            <div className="flex items-center gap-4">
                                {identityDocumentUrl && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                                        <FileText className="h-4 w-4 text-green-600" />
                                        <span className="text-sm">Document uploadé</span>
                                    </div>
                                )}

                                <div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isLoading || !identityDocumentType}
                                        onClick={() => document.getElementById('identity-document-input')?.click()}
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        {identityDocumentUrl ? 'Changer le document' : 'Uploader le document'}
                                    </Button>
                                    <input
                                        id="identity-document-input"
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={handleIdentityDocumentUpload}
                                        disabled={isLoading || !identityDocumentType}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Format: JPG, PNG, PDF - Max 10MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Avertissement sécurité */}
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                                <strong>Sécurité de vos données :</strong> Vos documents sont stockés de manière sécurisée
                                et ne sont accessibles qu'à notre équipe de vérification. Ils ne seront jamais partagés
                                avec des tiers.
                            </AlertDescription>
                        </Alert>

                        {/* Bouton de soumission */}
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading || !profilePhotoUrl || !identityDocumentUrl || !identityDocumentType}
                                size="lg"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        {isRejected ? 'Re-soumettre les documents' : 'Soumettre les documents'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}