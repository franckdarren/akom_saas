'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {createManualPayment} from '@/lib/actions/subscription'
import {uploadPaymentProof} from '@/lib/utils/upload'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Input} from '@/components/ui/input'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {Upload, CheckCircle2, Loader2, AlertCircle, Users} from 'lucide-react'
import {Alert, AlertDescription} from '@/components/ui/alert'
import Image from 'next/image'
import {toast} from 'sonner'
import type {SubscriptionPlan, BillingCycle} from '@/lib/config/subscription'
import {
    formatPrice,
    calculateMonthlyPrice,
} from '@/lib/config/subscription'

interface PaymentFormProps {
    restaurantId: string
    plan: SubscriptionPlan
    billingCycle: BillingCycle
    userCount: number
    amount: number
}

export function PaymentForm({
                                restaurantId,
                                plan,
                                billingCycle,
                                userCount,
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

        if (!selectedFile.type.startsWith('image/')) {
            setError('Le fichier doit être une image (PNG, JPG, JPEG)')
            return
        }

        const maxSize = 5 * 1024 * 1024
        if (selectedFile.size > maxSize) {
            setError("L'image ne doit pas dépasser 5MB")
            return
        }

        setFile(selectedFile)
        setError(null)

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
            setUploading(true)

            const {url, error: uploadError} = await uploadPaymentProof(
                file,
                restaurantId
            )

            setUploading(false)

            if (uploadError || !url) {
                throw new Error(uploadError || "Erreur lors de l'upload")
            }

            const result = await createManualPayment({
                restaurantId,
                plan,
                billingCycle,
                userCount,
                proofUrl: url,
                notes: notes.trim() || undefined,
            })

            if (!result.success) {
                throw new Error(result.error)
            }

            toast.success('Paiement soumis avec succès', {
                description: 'Validation sous 24h',
            })

            router.push('/dashboard/subscription')
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Erreur lors de la soumission'
            )
        } finally {
            setSubmitting(false)
            setUploading(false)
        }
    }

    const monthlyPrice = calculateMonthlyPrice(plan, userCount)

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

                    {/* Récapitulatif abonnement */}
                    <Alert>
                        <Users className="h-4 w-4"/>
                        <AlertDescription>
              <span className="font-medium">
                Abonnement pour {userCount} utilisateur
                  {userCount > 1 ? 's' : ''}
              </span>
                            <br/>
                            Plan {plan} — {formatPrice(monthlyPrice)}/mois
                        </AlertDescription>
                    </Alert>

                    {/* Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="proof">Preuve de paiement *</Label>
                        <p className="text-xs text-muted-foreground">
                            PNG, JPG, JPEG (max 5MB)
                        </p>

                        {!preview ? (
                            <div className="relative">
                                <Input
                                    id="proof"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative h-64 w-full rounded-md border bg-muted overflow-hidden">
                                    <Image
                                        src={preview}
                                        alt="Aperçu preuve paiement"
                                        fill
                                        className="object-contain"
                                    />
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setFile(null)
                                        setPreview(null)
                                    }}
                                    className="w-full"
                                >
                                    Changer l'image
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optionnel)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Numéro de transaction, date..."
                            rows={4}
                        />
                    </div>

                    {/* Erreur */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4"/>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={!file || submitting || uploading}
                        className="w-full"
                        size="lg"
                    >
                        {uploading || submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                Traitement...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4"/>
                                Soumettre {formatPrice(amount)}
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                        Validation sous 24h ouvrées. Notification envoyée par email.
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}