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
    const { full_name, email, role, department_id, title, invited_by } = await req.json()

    if (!email.endsWith('@lighthouseegypt.com')) {
      return NextResponse.json({ error: 'Must use @lighthouseegypt.com email.' }, { status: 400 })
    }

    // Check not already a member
    const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).single()
    if (existing) return NextResponse.json({ error: 'This email already has an account.' }, { status: 400 })

    // Create invitation record
    const { data: invite, error: invErr } = await supabase.from('invitations').insert({
      full_name, email, role,
      department_id: department_id || null,
      title: title || null,
      invited_by: invited_by || null
    }).select().single()

    if (invErr) throw invErr

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const acceptUrl = `${appUrl}/invite/accept?token=${invite.token}`

    // Send invitation email
    await resend.emails.send({
      from: 'Lighthouse Construction OS <onboarding@resend.dev>',
      to: email,
      subject: `You've been invited to Lighthouse Construction OS`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f5f4f1; padding: 40px 20px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #E8E6E3;">
            <div style="background: #000; padding: 28px 32px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 36px; height: 36px; background: #FFCB1A; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; color: #000;">L</div>
                <div>
                  <div style="color: #fff; font-size: 16px; font-weight: 700; letter-spacing: 0.05em;">LIGHTHOUSE</div>
                  <div style="color: #505151; font-size: 11px; letter-spacing: 0.12em;">CONSTRUCTION OS</div>
                </div>
              </div>
            </div>
            <div style="padding: 32px;">
              <h1 style="font-size: 22px; font-weight: 700; color: #1A1A1A; margin: 0 0 8px;">Welcome, ${full_name}</h1>
              <p style="color: #505151; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
                You've been invited to join the Lighthouse Construction internal operating system.
                This is where the team tracks projects, tasks, and company announcements.
              </p>
              <a href="${acceptUrl}" style="display: block; background: #FFCB1A; color: #000; text-align: center; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; letter-spacing: 0.03em;">
                Activate My Account →
              </a>
              <p style="color: #B4B4B5; font-size: 12px; margin: 20px 0 0; text-align: center;">
                This link expires in 7 days. If you didn't expect this, ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send invitation.' }, { status: 500 })
  }
}
