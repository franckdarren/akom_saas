'use client'

import {useState} from "react"
import {useRouter} from "next/navigation"
import {ChevronDown, Loader2, LogOut, User} from "lucide-react"
import {signOut} from "@/lib/actions/auth"
import {useDashboard} from "@/components/providers/dashboard-provider"
import {useNavigationLoading} from "@/lib/hooks/use-navigation-loading"
import {Avatar, AvatarFallback} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/** Menu profil de l'app bar : rôle, email, changement de mot de passe et déconnexion. */
export function UserMenu() {
    const {user, role} = useDashboard()
    const router = useRouter()
    const {startLoading} = useNavigationLoading()
    const [isSigningOut, setIsSigningOut] = useState(false)

    const initials = user.email.split("@")[0].substring(0, 2).toUpperCase()

    async function handleSignOut() {
        if (isSigningOut) return
        setIsSigningOut(true)
        try {
            await signOut()
        } catch {
            setIsSigningOut(false)
        }
    }

    return (
        <>
            {isSigningOut && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                        <p className="text-sm text-muted-foreground font-medium">Déconnexion en cours...</p>
                    </div>
                </div>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-accent transition"
                        disabled={isSigningOut}
                        data-tour="account"
                        aria-label="Mon compte"
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        <div className="hidden min-w-0 max-w-40 md:block">
                            <p className="text-sm font-bold truncate capitalize">{role}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>

                        <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block"/>
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        Mon compte
                        {/* Sur mobile le rôle et l'email ne sont pas visibles dans l'app bar */}
                        <p className="type-caption truncate font-normal md:hidden">{user.email}</p>
                    </DropdownMenuLabel>

                    <DropdownMenuItem onClick={() => {
                        startLoading()
                        router.push('/update-password')
                    }}>
                        <User className="mr-2 h-4 w-4"/>
                        Changer mot de passe
                    </DropdownMenuItem>

                    <DropdownMenuSeparator/>

                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={isSigningOut}
                        onSelect={(e) => {
                            e.preventDefault()
                            handleSignOut()
                        }}
                    >
                        {isSigningOut ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                Déconnexion...
                            </>
                        ) : (
                            <>
                                <LogOut className="mr-2 h-4 w-4"/>
                                Déconnexion
                            </>
                        )}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
