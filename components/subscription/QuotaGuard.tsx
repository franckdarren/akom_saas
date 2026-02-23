// components/subscription/QuotaGuard.tsx

import {ReactNode} from "react"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Lock, TrendingUp} from "lucide-react"
import Link from "next/link"
import {QuotaStatus} from "@/lib/services/subscription-checker"
import {cn} from "@/lib/utils"

interface QuotaGuardProps {
    status: QuotaStatus
    quotaName: string
    children?: ReactNode
    disableWhenAtLimit?: boolean
    showProgress?: boolean
    className?: string
}

export function QuotaGuard({
                               status,
                               quotaName,
                               children,
                               disableWhenAtLimit = true,
                               showProgress = true,
                               className,
                           }: QuotaGuardProps) {
    const {used, limit, percentage, isNearLimit, isAtLimit} = status

    const limitText = limit === "unlimited" ? "illimité" : `${limit}`

    const badgeVariant = isAtLimit
        ? "destructive"
        : isNearLimit
            ? "secondary"
            : "outline"

    return (
        <div className={cn("space-y-4", className)}>
            {/* ================= MINI STATUS (OPTIONNEL) ================= */}
            {showProgress && limit !== "unlimited" && (
                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            {used} / {limitText} {quotaName}
                        </div>

                        <Badge variant={badgeVariant}>
                            {Math.round(percentage)}%
                        </Badge>
                    </div>

                    {/* Progress bar custom moderne */}
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-500",
                                isAtLimit
                                    ? "bg-destructive"
                                    : isNearLimit
                                        ? "bg-amber-500"
                                        : "bg-primary"
                            )}
                            style={{width: `${percentage}%`}}
                        />
                    </div>

                    {/* Upgrade CTA discret */}
                    {(isNearLimit || isAtLimit) && (
                        <div className="pt-1">
                            <Button asChild size="sm" variant="outline">
                                <Link href="/dashboard/subscription/choose-plan">
                                    <TrendingUp className="mr-2 h-3 w-3"/>
                                    Passer à un plan supérieur
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* ================= CONTENU PROTÉGÉ ================= */}
            {children && (
                <div
                    className={cn(
                        disableWhenAtLimit &&
                        isAtLimit &&
                        "pointer-events-none opacity-50"
                    )}
                >
                    {children}

                    {/* Overlay lock si limite atteinte */}
                    {disableWhenAtLimit && isAtLimit && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
                            <Lock className="h-4 w-4"/>
                            Limite atteinte
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}