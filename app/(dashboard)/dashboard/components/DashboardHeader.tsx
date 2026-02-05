'use client'

import { ModeToggle } from '@/components/ui/mode-toggle'
import { RestaurantSelector } from '@/components/dashboard/RestaurantSelector'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'

interface DashboardHeaderProps {
    userEmail: string
}

export function DashboardHeader() {
    

    return (
        <header className="">
            <div className="">
                {/* Droite : Mode Toggle + User Menu */}
                <div className="flex items-center gap-2">
                    <ModeToggle />
                </div>
            </div>
        </header>
    )
}