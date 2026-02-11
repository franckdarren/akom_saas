// components/restaurant/circuit-sheet-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    CheckCircle2,
    Clock,
    Upload,
    FileText,
    AlertTriangle,
    AlertCircle,
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { submitCircuitSheet } from '@/lib/actions/restaurant-verification'
import type { RestaurantCircuitSheet } from '@prisma/client'
import {
    getDaysRemaining,
    isDeadlineOverdue,
    getDeadlineMessage,
} from '@/types/restaurant-verification'

// ============================================================
// PROPS
// ============================================================

interface CircuitSheetFormProps {
    restaurantId: string
    circuitSheet: RestaurantCircuitSheet | null
    plan: string
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export function CircuitSheetForm({
    restaurantId,
    circuitSheet,
    plan,
}: CircuitSheetFormProps) {
    const router = useRouter()

    // États
    const [isLoading, setIsLoading] = useState(false)
    const [circuitSheetUrl, setCircuitSheetUrl] = useState<string | null>(
        circuitSheet?.circuitSheetUrl || null
    )

    // Pas de fiche circuit requise si pas Business/Premium
    if (plan !== 'business' && plan !== 'premium') {
        return null
    }

    // Pas encore de fiche circuit créée (ne devrait pas arriver)
    if (!circuitSheet) {
        return null
    }

    const isSubmitted = circuitSheet.isSubmitted
    const isValidated = circuitSheet.isValidated
    const deadlineAt = new Date(circuitSheet.deadlineAt)
    const daysRemaining = getDaysRemaining(deadlineAt)
    const isOverdue = isDeadlineOverdue(deadlineAt)
    const deadlineMessage = getDeadlineMessage(deadlineAt)

    // Calcul du pourcentage pour la progress bar
    const totalDays = 90 // 3 mois
    const elapsedDays = totalDays - daysRemaining
    const progressPercentage = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100)

    // ============================================================
    // UPLOAD DE FICHIER
    // ============================================================

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Vérifier le format
        const validFormats = ['application/pdf', 'image/jpeg', 'image/png']
        if (!validFormats.includes(file.type)) {
            toast.error('Format de fichier non accepté. Utilisez PDF, JPG ou PNG.')
            return
        }

        // Vérifier la taille (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Fichier trop volumineux. Maximum 10MB.')
            return
        }

        setIsLoading(true)

        try {
            // TODO: Implémenter l'upload vers Supabase Storage (bucket circuit-sheets)
            // Pour l'instant, simulation
            await new Promise(resolve => setTimeout(resolve, 1000))

            // TODO: Remplacer par le vrai URL après upload
            const fakeUrl = `https://storage.akom.com/circuit-sheets/${file.name}`
            setCircuitSheetUrl(fakeUrl)

            toast.success('Fiche circuit uploadée')
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
        if (!circuitSheetUrl) {
            toast.error('Veuillez uploader la fiche circuit')
            return
        }

        setIsLoading(true)

        const result = await submitCircuitSheet(restaurantId, {
            circuitSheetUrl,
        })

        setIsLoading(false)

        if (result.success) {
            toast.success('Fiche circuit soumise avec succès !')
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
                        <CardTitle>Fiche circuit</CardTitle>
                        <CardDescription className="mt-2">
                            Document obligatoire pour l'offre Business
                        </CardDescription>
                    </div>

                    {isValidated && (
                        <Badge variant="success">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Validée
                        </Badge>
                    )}

                    {isSubmitted && !isValidated && (
                        <Badge variant="default">
                            <Clock className="mr-1 h-3 w-3" />
                            En cours de validation
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">

                {/* Statut validé */}
                {isValidated && (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            Votre fiche circuit a été validée par notre équipe. Merci !
                        </AlertDescription>
                    </Alert>
                )}

                {/* Statut soumis */}
                {isSubmitted && !isValidated && (
                    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                            Votre fiche circuit est en cours de validation par notre équipe.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Alerte deadline */}
                {!isSubmitted && (
                    <>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Échéance</span>
                                <Badge variant={deadlineMessage.variant}>
                                    {isOverdue ? (
                                        <AlertCircle className="mr-1 h-3 w-3" />
                                    ) : (
                                        <Clock className="mr-1 h-3 w-3" />
                                    )}
                                    {deadlineMessage.message}
                                </Badge>
                            </div>

                            <Progress value={progressPercentage} />

                            <p className="text-xs text-muted-foreground">
                                Date limite: {deadlineAt.toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>

                        {isOverdue && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Attention :</strong> La date limite est dépassée.
                                    Votre compte pourrait être suspendu. Veuillez soumettre votre fiche circuit
                                    dès que possible.
                                </AlertDescription>
                            </Alert>
                        )}

                        {!isOverdue && daysRemaining <= 7 && (
                            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                <AlertDescription className="text-orange-800 dark:text-orange-200">
                                    <strong>Rappel :</strong> Il ne vous reste que {daysRemaining} jour(s)
                                    pour soumettre votre fiche circuit.
                                </AlertDescription>
                            </Alert>
                        )}
                    </>
                )}

                {/* Informations sur la fiche circuit */}
                {!isValidated && (
                    <div className="space-y-4">
                        <div className="rounded-lg bg-muted p-4 space-y-2">
                            <h4 className="font-semibold text-sm">Qu'est-ce que la fiche circuit ?</h4>
                            <p className="text-sm text-muted-foreground">
                                La fiche circuit est un document qui décrit l'organisation et les processus
                                de votre restaurant. Elle nous permet de mieux comprendre vos besoins et de
                                vous accompagner efficacement dans votre utilisation d'Akôm.
                            </p>

                            <div className="pt-2">
                                <h5 className="text-sm font-medium mb-2">Le document doit inclure :</h5>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>L'organigramme de votre équipe</li>
                                    <li>Le circuit des commandes (de la prise à la livraison)</li>
                                    <li>La gestion des stocks et approvisionnements</li>
                                    <li>Les horaires et rotations du personnel</li>
                                </ul>
                            </div>
                        </div>

                        {/* Upload */}
                        {!isSubmitted && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    {circuitSheetUrl && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                                            <FileText className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-green-800 dark:text-green-200">
                                                Document prêt à être soumis
                                            </span>
                                        </div>
                                    )}

                                    <div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={isLoading}
                                            onClick={() => document.getElementById('circuit-sheet-input')?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            {circuitSheetUrl ? 'Changer le document' : 'Uploader la fiche circuit'}
                                        </Button>
                                        <input
                                            id="circuit-sheet-input"
                                            type="file"
                                            accept="application/pdf,image/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            disabled={isLoading}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Format: PDF, JPG, PNG - Max 10MB
                                        </p>
                                    </div>
                                </div>

                                {/* Bouton de soumission */}
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isLoading || !circuitSheetUrl}
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
                                                Soumettre la fiche circuit
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}