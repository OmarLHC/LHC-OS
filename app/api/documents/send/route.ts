import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { documentId, clientEmail, message, downloadUrl, sentBy } = await req.json()

    const { data: doc } = await supabase.from('documents')
      .select('*, project:projects(name), uploader:profiles!uploaded_by(full_name)')
      .eq('id', documentId).single()

    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    await resend.emails.send({
      from: 'Lighthouse Construction <noreply@lhc-eg.com>',
      to: clientEmail,
      subject: `Document: ${doc.name} — ${doc.project?.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f5f4f1; padding: 40px 20px; margin: 0;">
          <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #E8E6E3;">
            <div style="background: #000; padding: 24px 32px;">
              <div style="display: inline-flex; align-items: center; gap: 12px;">
                <div style="width: 36px; height: 36px; background: #FFCB1A; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; color: #000;">L</div>
                <div style="display: inline-block; vertical-align: middle; margin-left: 8px;">
                  <div style="color: #fff; font-size: 15px; font-weight: 700; letter-spacing: 0.05em;">LIGHTHOUSE CONSTRUCTION</div>
                  <div style="color: #505151; font-size: 11px; letter-spacing: 0.1em;">DOCUMENT SUBMISSION</div>
                </div>
              </div>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #1A1A1A; margin: 0 0 8px;">${doc.name}</h2>
              <p style="color: #505151; font-size: 14px; margin: 0 0 24px;">Project: <strong>${doc.project?.name}</strong></p>
              ${message ? `<div style="background: #F5F4F1; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 14px; color: #505151; line-height: 1.6;">${message}</div>` : ''}
              <a href="${downloadUrl}" style="display: block; background: #FFCB1A; color: #000; text-align: center; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; margin-bottom: 24px;">
                ↓ Download Document
              </a>
              <div style="border-top: 1px solid #E8E6E3; padding-top: 16px; font-size: 12px; color: #B4B4B5;">
                Sent by ${doc.uploader?.full_name} · Lighthouse Construction · This download link expires in 24 hours.
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    })

    await supabase.from('documents').update({
      status: 'sent_to_client',
      sent_to_client_at: new Date().toISOString(),
      sent_to_client_by: sentBy,
      client_email: clientEmail
    }).eq('id', documentId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
