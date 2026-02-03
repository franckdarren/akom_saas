// app/dashboard/subscription/payment/PaymentForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createManualPayment } from '@/lib/actions/subscription'
import { uploadPaymentProof } from '@/lib/utils/upload'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Image from 'next/image'
import { toast } from 'sonner'
import type { SubscriptionPlan, BillingCycle } from '@/lib/subscription/config'

interface PaymentFormProps {
    restaurantId: string
    plan: SubscriptionPlan
    billingCycle: BillingCycle
    amount: number
}

export function PaymentForm({
    restaurantId,
    plan,
    billingCycle,
    amount,
}: PaymentFormProps) {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [notes, setNotes] = useState('')
    const [uploading, setUploading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        // Vérifier le type
        if (!selectedFile.type.startsWith('image/')) {
            setError('Le fichier doit être une image')
            return
        }

        // Vérifier la taille (max 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('L\'image ne doit pas dépasser 5MB')
            return
        }

        setFile(selectedFile)
        setError(null)

        // Créer un aperçu
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result as string)
        }
        reader.readAsDataURL(selectedFile)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!file) {
            setError('Veuillez ajouter une preuve de paiement')
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            // 1. Upload de la preuve
            setUploading(true)
            const { url, error: uploadError } = await uploadPaymentProof(
                file,
                restaurantId
            )
            setUploading(false)

            if (uploadError || !url) {
                throw new Error(uploadError || 'Erreur lors de l\'upload')
            }

            // 2. Créer le paiement
            const result = await createManualPayment({
                restaurantId,
                plan,
                billingCycle,
                proofUrl: url,
                notes: notes.trim() || undefined,
            })

            if (!result.success) {
                throw new Error(result.error || 'Erreur lors de la création du paiement')
            }

            // 3. Succès
            toast.success('Paiement soumis avec succès', {
                description: 'Paiement en cours de validation (max 24h)',
            })

            // Rediriger vers la page abonnement
            router.push('/dashboard/subscription')
        } catch (err) {
            console.error('Erreur soumission paiement:', err)
            setError(
                err instanceof Error ? err.message : 'Erreur lors de la soumission'
            )
        } finally {
            setSubmitting(false)
            setUploading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Soumettre votre paiement</CardTitle>
                <CardDescription>
                    Uploadez la preuve de votre paiement pour validation
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Upload de la preuve */}
                    <div>
                        <Label>Preuve de paiement *</Label>
                        <p className="text-xs text-gray-600 mb-3">
                            Capture d'écran de la confirmation Mobile Money ou du reçu de
                            virement
                        </p>

                        {!preview ? (
                            <label
                                htmlFor="proof-upload"
                                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">
                                    Cliquez pour choisir une image
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    PNG, JPG, JPEG (max 5MB)
                                </span>
                                <input
                                    id="proof-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        ) : (
                            <div className="relative">
                                <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                                    <Image
                                        src={preview}
                                        alt="Aperçu"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setFile(null)
                                        setPreview(null)
                                    }}
                                    className="mt-2 w-full"
                                >
                                    Changer l'image
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Notes optionnelles */}
                    <div>
                        <Label htmlFor="notes" className="mb-1">Notes (optionnel)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ajoutez des informations complémentaires si nécessaire (numéro de transaction, date du virement, etc.)"
                            rows={4}
                        />
                    </div>

                    {/* Erreur */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Bouton submit */}
                    <Button
                        type="submit"
                        disabled={!file || submitting || uploading}
                        className="w-full"
                        size="lg"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Upload en cours...
                            </>
                        ) : submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Soumission...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Soumettre le paiement
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                        En soumettant ce paiement, vous acceptez nos conditions générales
                        de vente. Notre équipe validera votre paiement sous 24h.
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}