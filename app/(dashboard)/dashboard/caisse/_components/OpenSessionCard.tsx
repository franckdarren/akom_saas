'use client'

import {useState, useTransition} from 'react'
import {toast} from 'sonner'
import {CalendarDays, Wallet, History, ChevronRight} from 'lucide-react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {cn} from '@/lib/utils'
import {openCashSession} from '@/lib/actions/cash/open-session'
import type {SessionWithRelations} from '../_types'

interface OpenSessionCardProps {
    restaurantId: string
    onSessionCreated: (session: SessionWithRelations) => void
    prefillDate?: string
}

type Mode = 'today' | 'historical'

export function OpenSessionCard({
                                    restaurantId,
                                    onSessionCreated,
                                    prefillDate,
                                }: OpenSessionCardProps) {
    const today = new Date().toISOString().split('T')[0]
    const [mode, setMode] = useState<Mode>(prefillDate ? 'historical' : 'today')
    const [date, setDate] = useState(prefillDate ?? today)
    const [openingBalance, setOpeningBalance] = useState('')
    const [notes, setNotes] = useState('')
    const [isPending, startTransition] = useTransition()
    const isHistorical = date < today

    function handleSubmit() {
        const balanceValue = parseInt(openingBalance || '0', 10)
        if (isNaN(balanceValue) || balanceValue < 0) {
            toast.error('Le fond de caisse doit être un montant valide')
            return
        }

        startTransition(async () => {
            try {
                const result = await openCashSession({
                    sessionDate: date,
                    openingBalance: balanceValue,
                    notes: notes || undefined,
                })
                toast.success(
                    isHistorical
                        ? `Session du ${new Date(date).toLocaleDateString('fr-FR')} créée`
                        : 'Caisse ouverte avec succès'
                )
                onSessionCreated(result.session as SessionWithRelations)
            } catch (e: any) {
                if (e.message?.includes('P2002') || e.message?.includes('Unique')) {
                    toast.error('Une session existe déjà pour cette date')
                } else {
                    toast.error(e.message ?? 'Une erreur est survenue')
                }
            }
        })
    }

    return (
        <div className="max-w-lg mx-auto space-y-4 pt-8">
            {/* Sélecteur de mode */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => {
                        setMode('today')
                        setDate(today)
                    }}
                    className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        mode === 'today'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    )}
                >
                    <Wallet className="h-6 w-6"/>
                    <span className="text-sm font-medium">Ouvrir la caisse</span>
                    <span className="text-xs opacity-70">Journée d'aujourd'hui</span>
                </button>

                <button
                    onClick={() => setMode('historical')}
                    className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        mode === 'historical'
                            ? 'border-destructive bg-destructive/5 text-destructive'
                            : 'border-border bg-background text-muted-foreground hover:border-destructive/50'
                    )}
                >
                    <History className="h-6 w-6"/>
                    <span className="text-sm font-medium">Saisie antidatée</span>
                    <span className="text-xs opacity-70">Depuis un cahier</span>
                </button>
            </div>

            <Card className={cn('border-2 transition-colors', mode === 'historical' && 'border-destructive/10')}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        {mode === 'today' ? (
                            <>
                                <Wallet className="h-5 w-5 text-primary"/> Ouverture de caisse
                            </>
                        ) : (
                            <>
                                <CalendarDays className="h-5 w-5 text-destructive"/> Saisie historique
                            </>
                        )}
                    </CardTitle>
                    <CardDescription>
                        {mode === 'today'
                            ? 'Indiquez le montant présent dans votre tiroir-caisse.'
                            : 'Sélectionnez la date et saisissez les données de ce jour.'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    {/* Alerte mode historique */}
                    {mode === 'historical' && (
                        <div className={cn(
                            'flex gap-3 p-3 rounded-lg text-sm border',
                            'bg-destructive/5 border-destructive/10 text-destructive'
                        )}>
                            <History className="h-4 w-4 shrink-0 mt-0.5"/>
                            <p>
                                Vous saisissez des données pour une journée passée. Elles seront intégrées à votre
                                comptabilité et vos statistiques.
                            </p>
                        </div>
                    )}

                    {/* Date — visible uniquement en mode historique */}
                    {mode === 'historical' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="session-date">Date de la journée</Label>
                            <Input
                                id="session-date"
                                type="date"
                                value={date}
                                max={today}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Fond de caisse */}
                    <div className="space-y-1.5">
                        <Label htmlFor="opening-balance">Fond de caisse (FCFA)</Label>
                        <div className="relative">
                            <Input
                                id="opening-balance"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={openingBalance}
                                onChange={e => setOpeningBalance(e.target.value)}
                                placeholder="0"
                                min="0"
                                className="text-xl font-bold pr-20 h-14"
                            />
                            <span
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                FCFA
              </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Montant physique actuellement dans votre tiroir-caisse. Laissez à 0 si vous n'avez pas de
                            fond d'ouverture.
                        </p>
                    </div>

                    {/* Notes optionnelles */}
                    <div className="space-y-1.5">
                        <Label htmlFor="session-notes">
                            Notes <span className="text-muted-foreground font-normal">(optionnel)</span>
                        </Label>
                        <Textarea
                            id="session-notes"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Ex: Journée du marché, personnel réduit..."
                            rows={2}
                            className="resize-none"
                        />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                        variant="default"
                        className="w-full h-12 text-base font-semibold gap-2"
                    >
                        {isPending
                            ? 'Ouverture en cours...'
                            : mode === 'today'
                                ? 'Ouvrir la caisse'
                                : `Créer la session du ${new Date(date).toLocaleDateString('fr-FR')}`
                        }
                        {!isPending && <ChevronRight className="h-4 w-4"/>}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}