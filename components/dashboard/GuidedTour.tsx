'use client'

import {useEffect, useRef, useState} from "react"
import {createPortal} from "react-dom"
import {X} from "lucide-react"
import {Button} from "@/components/ui/button"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TourStep {
    /** Valeur de l'attribut `data-tour` de l'élément à mettre en avant. Absent ou introuvable → carte centrée. */
    target?: string
    title: string
    description: string
    /** Précision affichée sous la description (module désactivé, plan requis…). */
    note?: string
}

interface GuidedTourProps {
    steps: TourStep[]
    onClose: () => void
}

interface Layout {
    rect: { top: number; left: number; width: number; height: number } | null
    viewportWidth: number
    viewportHeight: number
    cardHeight: number
}

const CARD_WIDTH = 320
const GAP = 12
const SPOTLIGHT_PADDING = 4

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findTarget(target?: string): HTMLElement | null {
    if (!target) return null
    return document.querySelector<HTMLElement>(`[data-tour="${CSS.escape(target)}"]`)
}

function measure(el: HTMLElement | null, card: HTMLElement | null): Layout {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const cardHeight = card?.offsetHeight ?? 0

    if (!el) return {rect: null, viewportWidth, viewportHeight, cardHeight}

    const r = el.getBoundingClientRect()
    // Élément masqué (sidebar repliée, sheet mobile fermée…) → carte centrée
    const isVisible = r.width > 0 && r.height > 0 && r.right > 0 && r.left < viewportWidth
    return {
        rect: isVisible ? {top: r.top, left: r.left, width: r.width, height: r.height} : null,
        viewportWidth,
        viewportHeight,
        cardHeight,
    }
}

function isSameLayout(a: Layout | null, b: Layout): boolean {
    if (!a) return false
    if (a.viewportWidth !== b.viewportWidth || a.viewportHeight !== b.viewportHeight) return false
    if (a.cardHeight !== b.cardHeight) return false
    if (a.rect === null || b.rect === null) return a.rect === b.rect
    return a.rect.top === b.rect.top && a.rect.left === b.rect.left
        && a.rect.width === b.rect.width && a.rect.height === b.rect.height
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), Math.max(min, max))
}

/** Place la carte à droite de la cible, sinon à gauche, sinon en dessous / au-dessus. */
function computeCardPosition({rect, viewportWidth, viewportHeight, cardHeight}: Layout) {
    const width = Math.min(CARD_WIDTH, viewportWidth - GAP * 2)

    if (!rect) {
        return {
            width,
            left: (viewportWidth - width) / 2,
            top: Math.max(GAP, (viewportHeight - cardHeight) / 2),
        }
    }

    let left: number
    let top: number

    if (rect.left + rect.width + GAP + width <= viewportWidth - GAP) {
        left = rect.left + rect.width + GAP
        top = rect.top
    } else if (rect.left - GAP - width >= GAP) {
        left = rect.left - GAP - width
        top = rect.top
    } else {
        left = rect.left + rect.width / 2 - width / 2
        top = rect.top + rect.height + GAP
        if (top + cardHeight > viewportHeight - GAP) top = rect.top - GAP - cardHeight
    }

    return {
        width,
        left: clamp(left, GAP, viewportWidth - width - GAP),
        top: clamp(top, GAP, viewportHeight - cardHeight - GAP),
    }
}

// ─── Composant ────────────────────────────────────────────────────────────────

/**
 * Visite guidée : met en avant, étape par étape, les éléments marqués `data-tour`.
 * À monter uniquement quand la visite est active (l'étape repart de 0 à chaque montage).
 */
export function GuidedTour({steps, onClose}: GuidedTourProps) {
    const [index, setIndex] = useState(0)
    const [layout, setLayout] = useState<Layout | null>(null)
    const cardRef = useRef<HTMLDivElement>(null)

    const step = steps[index]
    const isFirst = index === 0
    const isLast = index === steps.length - 1

    function goNext() {
        if (isLast) onClose()
        else setIndex(i => i + 1)
    }

    function goPrevious() {
        setIndex(i => Math.max(0, i - 1))
    }

    // Suivi de la position de la cible : boucle rAF pour absorber le scroll,
    // le redimensionnement et les transitions (ouverture de la sidebar).
    useEffect(() => {
        const el = findTarget(step?.target)
        el?.scrollIntoView({block: "nearest"})

        let frame = 0
        let previous: Layout | null = null
        const tick = () => {
            const next = measure(el, cardRef.current)
            if (!isSameLayout(previous, next)) {
                previous = next
                setLayout(next)
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [step?.target])

    // Focus sur la carte à chaque étape (lecteurs d'écran + navigation clavier)
    useEffect(() => {
        cardRef.current?.focus()
    }, [index])

    // Raccourcis clavier : ←/→ pour naviguer, Échap pour quitter
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose()
            else if (e.key === "ArrowRight") {
                if (index === steps.length - 1) onClose()
                else setIndex(i => i + 1)
            } else if (e.key === "ArrowLeft") setIndex(i => Math.max(0, i - 1))
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [index, steps.length, onClose])

    if (!step) return null

    const position = layout ? computeCardPosition(layout) : null
    const progress = (index + 1) / steps.length

    return createPortal(
        <>
            {/* Bloque les interactions avec l'application pendant la visite */}
            <div className="fixed inset-0 z-50" aria-hidden="true"/>

            {layout?.rect ? (
                <div
                    aria-hidden="true"
                    className="pointer-events-none fixed left-0 top-0 z-50 rounded-md ring-2 ring-primary shadow-[0_0_0_9999px_rgb(0_0_0/0.5)] transition-[transform,width,height] duration-300 motion-reduce:transition-none"
                    style={{
                        width: layout.rect.width + SPOTLIGHT_PADDING * 2,
                        height: layout.rect.height + SPOTLIGHT_PADDING * 2,
                        transform: `translate(${layout.rect.left - SPOTLIGHT_PADDING}px, ${layout.rect.top - SPOTLIGHT_PADDING}px)`,
                    }}
                />
            ) : (
                <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 bg-black/50"/>
            )}

            <div
                ref={cardRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="guided-tour-title"
                aria-describedby="guided-tour-description"
                tabIndex={-1}
                className="fixed left-0 top-0 z-50 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg outline-none transition-transform duration-300 motion-reduce:transition-none"
                style={{
                    width: position?.width ?? CARD_WIDTH,
                    transform: position ? `translate(${position.left}px, ${position.top}px)` : undefined,
                    visibility: position ? "visible" : "hidden",
                }}
            >
                <div className="flex items-start justify-between gap-2">
                    <p className="type-label-meta">Étape {index + 1} / {steps.length}</p>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="-mr-2 -mt-2"
                        onClick={onClose}
                        aria-label="Quitter la visite guidée"
                    >
                        <X className="h-4 w-4"/>
                    </Button>
                </div>

                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full origin-left rounded-full bg-primary transition-transform duration-300 motion-reduce:transition-none"
                        style={{transform: `scaleX(${progress})`}}
                    />
                </div>

                <h2 id="guided-tour-title" className="type-dialog-title mt-3">{step.title}</h2>
                <p id="guided-tour-description" className="type-body-muted mt-1">{step.description}</p>

                {step.note && (
                    <p className="type-caption mt-3 rounded-md bg-info-subtle px-3 py-2 text-foreground">
                        {step.note}
                    </p>
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                    {isLast ? <span/> : (
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            Passer
                        </Button>
                    )}
                    <div className="layout-inline">
                        {!isFirst && (
                            <Button variant="outline" size="sm" onClick={goPrevious}>
                                Précédent
                            </Button>
                        )}
                        <Button size="sm" onClick={goNext}>
                            {isLast ? "Terminer" : "Suivant"}
                        </Button>
                    </div>
                </div>
            </div>
        </>,
        document.body,
    )
}
