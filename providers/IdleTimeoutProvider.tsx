'use client'

import {useState, useCallback, useEffect, useRef} from 'react'
import {useRouter} from 'next/navigation'
import {signOut} from '@/lib/actions/auth'
import {useIdleTimeout} from '@/lib/hooks/useIdleTimeout'
import {IdleWarningModal} from '@/components/IdleWarningModal'

const IDLE_TIMEOUT = 20 * 60 * 1000   // 20 minutes
const WARNING_TIME = 2 * 60 * 1000    // Avertissement 2 min avant
const WARNING_DURATION = 120           // secondes affichées dans le countdown

interface IdleTimeoutProviderProps {
    children: React.ReactNode
    userRole?: string
    enabled?: boolean
}

export function IdleTimeoutProvider({
                                        children,
                                        userRole,
                                        enabled = true,
                                    }: IdleTimeoutProviderProps) {
    const [showWarning, setShowWarning] = useState(false)
    const [countdown, setCountdown] = useState(WARNING_DURATION)
    const countdownRef = useRef<NodeJS.Timeout | null>(null)
    const router = useRouter()

    // Activer seulement pour admin et gérant
    const isEnabled = enabled && ['admin', 'manager'].includes(userRole ?? '')

    const startCountdown = useCallback(() => {
        setCountdown(WARNING_DURATION)
        setShowWarning(true)

        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }, [])

    const handleTimeout = useCallback(async () => {
        setShowWarning(false)
        if (countdownRef.current) clearInterval(countdownRef.current)
        await signOut()
    }, [])

    const handleStayConnected = useCallback(() => {
        setShowWarning(false)
        setCountdown(WARNING_DURATION)
        if (countdownRef.current) clearInterval(countdownRef.current)
        reset() // Reset le timer d'inactivité
    }, [])

    const {reset} = useIdleTimeout({
        timeout: IDLE_TIMEOUT,
        warningTime: WARNING_TIME,
        onWarning: startCountdown,
        onTimeout: handleTimeout,
        enabled: isEnabled,
    })

    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current)
        }
    }, [])

    return (
        <>
            {children}
            {isEnabled && (
                <IdleWarningModal
                    isOpen={showWarning}
                    countdown={countdown}
                    onStayConnected={handleStayConnected}
                    onLogout={handleTimeout}
                />
            )}
        </>
    )
}