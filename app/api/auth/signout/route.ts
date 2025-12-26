import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST() {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }

    revalidatePath('/', 'layout')

    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!))
}