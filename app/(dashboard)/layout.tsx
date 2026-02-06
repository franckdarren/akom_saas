// app/(dashboard)/layout.tsx
import type { ReactNode } from 'react'
import { EmailVerifiedToast } from '@/components/email-verified-toast'

interface DashboardLayoutProps {
    children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <>
            <EmailVerifiedToast />
            {children}
        </>
    )
}
