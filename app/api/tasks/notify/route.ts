import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { taskId } = await req.json()
  if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })

  // Get full task details
  const { data: task } = await supabase
    .from('tasks')
    .select('*, project:projects(name), assignee:profiles!assignee_id(full_name, email), creator:profiles!created_by(full_name, email)')
    .eq('id', taskId)
    .single()

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  // Get management emails to notify
  const { data: managers } = await supabase
    .from('profiles')
    .select('email, full_name')
    .in('role', ['admin', 'manager'])
    .eq('is_active', true)

  const recipients = (managers || []).map(m => m.email).filter(Boolean)
  if (recipients.length === 0) return NextResponse.json({ ok: true, skipped: true })

  const assigneeName = task.assignee?.full_name || 'Unassigned'
  const projectName = task.project?.name || 'Unknown Project'

  await resend.emails.send({
    from: 'Lighthouse Construction OS <noreply@lhc-eg.com>',
    to: recipients,
    subject: `✓ Task Complete: ${task.title} — ${projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f5f4f1; padding: 40px 20px; margin: 0;">
        <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #E8E6E3;">
          <div style="background: #000; padding: 24px 32px; display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; background: #FFCB1A; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; color: #000;">L</div>
            <div style="display: inline-block; vertical-align: middle; margin-left: 8px;">
              <div style="color: #fff; font-size: 15px; font-weight: 700; letter-spacing: 0.05em;">LIGHTHOUSE CONSTRUCTION</div>
              <div style="color: #888; font-size: 11px; letter-spacing: 0.1em;">OPERATING SYSTEM</div>
            </div>
          </div>
          <div style="padding: 32px;">
            <div style="display: inline-block; background: #E1F5EE; color: #0F6E56; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">✓ Task Completed</div>
            <h2 style="font-size: 20px; font-weight: 700; color: #1A1A1A; margin: 0 0 6px;">${task.title}</h2>
            <p style="color: #888; font-size: 14px; margin: 0 0 24px;">Project: <strong style="color: #1A1A1A;">${projectName}</strong></p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr style="border-bottom: 1px solid #F5F3EF;">
                <td style="padding: 10px 0; font-size: 13px; color: #888; width: 40%;">Completed by</td>
                <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #1A1A1A;">${assigneeName}</td>
              </tr>
              ${task.task_type && task.task_type !== 'Other' ? `
              <tr style="border-bottom: 1px solid #F5F3EF;">
                <td style="padding: 10px 0; font-size: 13px; color: #888;">Task type</td>
                <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #1A1A1A;">${task.task_type}</td>
              </tr>` : ''}
              ${task.deadline ? `
              <tr>
                <td style="padding: 10px 0; font-size: 13px; color: #888;">Deadline</td>
                <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #1A1A1A;">${new Date(task.deadline).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}</td>
              </tr>` : ''}
            </table>
            <a href="https://os.lhc-eg.com/dashboard/projects/${task.project_id}"
              style="display: block; background: #FFCB1A; color: #000; text-align: center; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px;">
              View in LHC OS →
            </a>
          </div>
          <div style="padding: 16px 32px; background: #FAFAF9; border-top: 1px solid #E8E6E3; font-size: 11px; color: #B4B4B5; text-align: center;">
            Lighthouse Construction · Internal Operating System · os.lhc-eg.com
          </div>
        </div>
      </body>
      </html>
    `
  })

  return NextResponse.json({ ok: true, notified: recipients.length })
}
