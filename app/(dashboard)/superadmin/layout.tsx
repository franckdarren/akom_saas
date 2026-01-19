import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/SignOutButton'
import {
    LayoutDashboard,
    Building2,
    Users,
    BarChart3,
    ArrowLeft,
    MessageSquare,
    FileText,
} from 'lucide-react'

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
            {/* Header */}
            <header className="border-b bg-white dark:bg-zinc-950">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold">
                                Akôm
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                Super Admin
                            </span>
                            <SignOutButton variant="outline" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="border-b bg-white dark:bg-zinc-950">
                <div className="container mx-auto px-4">
                    <div className="flex gap-2 overflow-x-auto">
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href="/superadmin"
                                className="flex items-center gap-2"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href="/superadmin/restaurants"
                                className="flex items-center gap-2"
                            >
                                <Building2 className="h-4 w-4" />
                                Restaurants
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href="/superadmin/users"
                                className="flex items-center gap-2"
                            >
                                <Users className="h-4 w-4" />
                                Utilisateurs
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href="/superadmin/stats"
                                className="flex items-center gap-2"
                            >
                                <BarChart3 className="h-4 w-4" />
                                Stats avancées
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href="/superadmin/support"
                                className="flex items-center gap-2"
                            >
                                <MessageSquare className="h-4 w-4" />
                                Support
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href="/superadmin/logs"
                                className="flex items-center gap-2"
                            >
                                <FileText className="h-4 w-4" />
                                Logs
                            </Link>
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="container mx-auto px-4 py-8">{children}</main>
        </div>
    )
}