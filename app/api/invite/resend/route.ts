import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { inviteId } = await req.json()
    const { data: invite, error } = await supabase.from('invitations').select('*').eq('id', inviteId).single()
    if (error || !invite) return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 })

    // Extend expiry
    await supabase.from('invitations').update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }).eq('id', inviteId)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const acceptUrl = `${appUrl}/invite/accept?token=${invite.token}`

    await resend.emails.send({
      from: 'Lighthouse Construction OS <noreply@lhc-eg.com>',
      to: invite.email,
      subject: `Reminder: Your Lighthouse Construction OS invitation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 12px;">
          <h2 style="color: #1A1A1A;">Reminder: You've been invited</h2>
          <p style="color: #505151;">Hi ${invite.full_name}, your invitation to Lighthouse Construction OS is still waiting.</p>
          <a href="${acceptUrl}" style="display: inline-block; background: #FFCB1A; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; margin: 16px 0;">
            Activate My Account →
          </a>
          <p style="color: #B4B4B5; font-size: 12px;">Link expires in 7 days.</p>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
