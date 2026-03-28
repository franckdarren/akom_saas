'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'

interface LoadingButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  asChild?: boolean
}

export function LoadingButton({
  isLoading = false,
  loadingText,
  icon,
  children,
  disabled,
  size,
  ...props
}: LoadingButtonProps) {
  const isIconOnly = size === 'icon' || size === 'icon-sm' || size === 'icon-lg'

  return (
    <Button
      disabled={disabled || isLoading}
      size={size}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" />
          {!isIconOnly && (loadingText ?? children)}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </Button>
  )
}
