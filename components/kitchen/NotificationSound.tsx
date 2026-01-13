// components/kitchen/NotificationSound.tsx
'use client'

import { useEffect, useRef } from 'react'

interface NotificationSoundProps {
    shouldPlay: boolean // true si pendingCount > 0
}

export function NotificationSound({ shouldPlay }: NotificationSoundProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        // Créer l'élément audio une seule fois
        if (!audioRef.current) {
            audioRef.current = new Audio('/sounds/notification.mp3')
            audioRef.current.loop = true // Jouer en boucle
            audioRef.current.volume = 0.75 // Volume à 5%
        }

        const audio = audioRef.current

        if (shouldPlay) {
            // Jouer le son
            audio.play().catch((error) => {
                console.error('Erreur lecture audio:', error)
                // Note: Certains navigateurs bloquent l'autoplay audio
                // L'utilisateur devra interagir avec la page d'abord
            })
        } else {
            // Arrêter le son
            audio.pause()
            audio.currentTime = 0 // Remettre au début
        }

        // Nettoyage
        return () => {
            audio.pause()
        }
    }, [shouldPlay])

    return null // Ce composant ne rend rien visuellement
}