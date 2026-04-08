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
    const { announcementId } = await req.json()

    // Fetch announcement with author
    const { data: ann, error: annErr } = await supabase
      .from('announcements')
      .select('*, author:profiles!author_id(full_name), department:departments(name)')
      .eq('id', announcementId).single()

    if (annErr || !ann) return NextResponse.json({ error: 'Announcement not found.' }, { status: 404 })

    // Get recipients
    let query = supabase.from('profiles').select('email, full_name').eq('is_active', true)
    if (ann.audience === 'department' && ann.department_id) {
      query = query.eq('department_id', ann.department_id)
    }
    const { data: recipients } = await query

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Send batch emails (Resend supports batch)
    const emails = recipients.map(r => ({
      from: 'Lighthouse Construction OS <noreply@lhc-eg.com>',
      to: r.email,
      subject: `📢 ${ann.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f5f4f1; padding: 40px 20px; margin: 0;">
          <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #E8E6E3;">
            <div style="background: #000; padding: 20px 28px; display: flex; align-items: center; gap: 12px;">
              <div style="width: 32px; height: 32px; background: #FFCB1A; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; color: #000; vertical-align: middle;">L</div>
              <span style="color: #fff; font-size: 14px; font-weight: 600; vertical-align: middle; margin-left: 8px;">Lighthouse Construction</span>
              ${ann.audience === 'department' ? `<span style="background: #185FA5; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-left: 8px;">${ann.department?.name}</span>` : ''}
            </div>

            <div style="padding: 28px 32px;">
              <div style="font-size: 12px; color: #B4B4B5; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.08em;">
                Company Announcement
              </div>
              <h1 style="font-size: 22px; font-weight: 700; color: #1A1A1A; margin: 0 0 16px; line-height: 1.3;">
                ${ann.title}
              </h1>
              <div style="font-size: 15px; color: #505151; line-height: 1.7; white-space: pre-wrap; margin-bottom: 24px;">
${ann.body}
              </div>
              <div style="border-top: 1px solid #E8E6E3; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div style="font-size: 12px; color: #B4B4B5;">
                  Posted by <strong style="color: #888;">${ann.author?.full_name}</strong>
                </div>
                <a href="${appUrl}/dashboard/announcements" style="font-size: 13px; color: #185FA5; text-decoration: none; font-weight: 500;">
                  View in LHC OS →
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }))

    // Send in batches of 50 (Resend limit)
    const batchSize = 50
    let sent = 0
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      await resend.batch.send(batch)
      sent += batch.length
    }

    return NextResponse.json({ success: true, sent })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send emails.' }, { status: 500 })
  }
}
