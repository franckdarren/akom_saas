'use client'

import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

interface RadioGroupProps {
    value: string
    onValueChange: (value: string) => void
    children: React.ReactNode
    className?: string
}

interface RadioGroupItemProps {
    value: string
    label: string
    disabled?: boolean
    className?: string
}

export const RadioGroup = ({ value, onValueChange, children, className }: RadioGroupProps) => {
    return (
        <RadioGroupPrimitive.Root
            value={value}
            onValueChange={onValueChange}
            className={`flex gap-2 ${className || ''}`}
        >
            {children}
        </RadioGroupPrimitive.Root>
    )
}

export const RadioGroupItem = ({ value, label, disabled, className }: RadioGroupItemProps) => {
    return (
        <RadioGroupPrimitive.Item
            value={value}
            disabled={disabled}
            className={`
        flex items-center justify-center gap-2 px-4 py-2 rounded-lg border
        focus:outline-none focus:ring-2 focus:ring-blue-500
        bg-white text-gray-700 border-gray-300
        hover:border-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className || ''}
      `}
        >
            <RadioGroupPrimitive.Indicator>
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
            </RadioGroupPrimitive.Indicator>
            {label}
        </RadioGroupPrimitive.Item>
    )
}
