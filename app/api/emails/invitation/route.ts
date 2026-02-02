import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { InvitationEmail } from '@/emails/invitation-email'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: Request) {
  try {
    const {
      to,
      restaurantName,
      roleName,
      inviterName,
      invitationLink,
      expiresAt,
    } = await req.json()

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject: `Invitation à rejoindre ${restaurantName} sur Akôm`,
      react: InvitationEmail({
        invitedUserEmail: to,
        restaurantName,
        roleName,
        inviterName,
        invitationLink,
        expiresAt,
      }),
    })

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: data?.id })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Email send failed' },
      { status: 500 }
    )
  }
}
