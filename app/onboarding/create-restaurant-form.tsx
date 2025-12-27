// app/onboarding/create-restaurant-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createRestaurant } from '@/lib/actions/restaurant'
import { Loader2 } from 'lucide-react'

export function CreateRestaurantForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('name') as string,
            phone: formData.get('phone') as string,
            address: formData.get('address') as string,
        }

        const result = await createRestaurant(data)

        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        }
        // Sinon, la redirection se fait automatiquement dans l'action
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Créer votre restaurant</CardTitle>
                <CardDescription>
                    Remplissez les informations de base. Vous pourrez les modifier plus tard.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nom du restaurant <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Chez Maman"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone (optionnel)</Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+241 01 23 45 67"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Adresse (optionnel)</Label>
                        <Input
                            id="address"
                            name="address"
                            placeholder="Libreville, Gabon"
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Création en cours...
                            </>
                        ) : (
                            'Créer mon restaurant'
                        )}
                    </Button>

                    <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                        En créant un restaurant, vous en devenez automatiquement l'administrateur.
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}