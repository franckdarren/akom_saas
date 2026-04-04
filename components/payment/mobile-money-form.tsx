// components/payment/mobile-money-form.tsx
'use client'

import { useState } from 'react'
import { Phone, Smartphone } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils/format'

type Operator = 'airtel' | 'moov'

interface MobileMoneyFormProps {
  amount: number
  defaultPhone?: string
  isLoading: boolean
  onSubmit: (phoneNumber: string, operator: Operator) => void
}

const OPERATORS: { value: Operator; label: string; prefix: string }[] = [
  { value: 'airtel', label: 'Airtel Money', prefix: '074 / 077' },
  { value: 'moov', label: 'Moov Money', prefix: '062 / 066' },
]

export function MobileMoneyForm({
  amount,
  defaultPhone,
  isLoading,
  onSubmit,
}: MobileMoneyFormProps) {
  const [operator, setOperator] = useState<Operator | null>(null)
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone ?? '')

  const isValid = operator !== null && phoneNumber.replace(/\s/g, '').length >= 8

  function handleSubmit() {
    if (!isValid || !operator) return
    onSubmit(phoneNumber, operator)
  }

  return (
    <div className="layout-form">
      {/* Sélection opérateur */}
      <div className="layout-field">
        <Label className="type-label">Opérateur</Label>
        <div className="grid grid-cols-2 gap-3">
          {OPERATORS.map((op) => (
            <button
              key={op.value}
              type="button"
              onClick={() => setOperator(op.value)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-colors',
                operator === op.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30',
              )}
            >
              <Smartphone className="h-5 w-5" />
              <span className="text-sm font-semibold">{op.label}</span>
              <span className="type-caption text-muted-foreground">{op.prefix}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Numéro de téléphone */}
      <div className="layout-field">
        <Label htmlFor="mm-phone" className="type-label layout-inline">
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          Numéro de téléphone
        </Label>
        <Input
          id="mm-phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="07 XX XX XX"
        />
      </div>

      {/* Bouton payer */}
      <LoadingButton
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={!isValid}
        isLoading={isLoading}
        loadingText="Initiation du paiement..."
      >
        {`Payer ${formatPrice(amount)}`}
      </LoadingButton>
    </div>
  )
}
