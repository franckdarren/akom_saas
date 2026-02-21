'use client'

import {useEffect, useRef, useCallback} from 'react'

interface UseIdleTimeoutOptions {
    timeout: number        // ms avant déconnexion (ex: 20 * 60 * 1000)
    warningTime: number    // ms avant déconnexion pour afficher l'avertissement (ex: 2 * 60 * 1000)
    onWarning: () => void
    onTimeout: () => void
    enabled?: boolean
}

export function useIdleTimeout({
                                   timeout,
                                   warningTime,
                                   onWarning,
                                   onTimeout,
                                   enabled = true,
                               }: UseIdleTimeoutOptions) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const warningRef = useRef<NodeJS.Timeout | null>(null)
    const warnedRef = useRef(false)

    const reset = useCallback(() => {
        if (!enabled) return

        // Clear les timers
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (warningRef.current) clearTimeout(warningRef.current)
        warnedRef.current = false

        // Programmer l'avertissement
        warningRef.current = setTimeout(() => {
            warnedRef.current = true
            onWarning()
        }, timeout - warningTime)

        // Programmer la déconnexion
        timeoutRef.current = setTimeout(() => {
            onTimeout()
        }, timeout)
    }, [enabled, timeout, warningTime, onWarning, onTimeout])

    useEffect(() => {
        if (!enabled) return

        const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click']

        const handleActivity = () => {
            // Ne pas reset si l'avertissement est déjà affiché
            if (!warnedRef.current) reset()
        }

        events.forEach(e => window.addEventListener(e, handleActivity, {passive: true}))
        reset() // Démarrer le timer au montage

        return () => {
            events.forEach(e => window.removeEventListener(e, handleActivity))
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            if (warningRef.current) clearTimeout(warningRef.current)
        }
    }, [enabled, reset])

    return {reset}
}