import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // Verify user is authenticated first
  const userSupabase = await createServerClient()
  const { data: { user }, error: authError } = await userSupabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as any

  // Use service role to bypass RLS for the insert
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await adminSupabase.from('documents').insert({
    ...body,
    uploaded_by: user.id,
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Auto-complete linked task if complete_on_upload is set
  if (body.task_id) {
    const { data: task } = await adminSupabase
      .from('tasks')
      .select('id, status, complete_on_upload')
      .eq('id', body.task_id)
      .single()

    if (task?.complete_on_upload && task.status !== 'done') {
      await adminSupabase.from('tasks').update({ status: 'done' }).eq('id', task.id)
      // Fire completion notification
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', 'vercel.app') || 'https://os.lhc-eg.com'}/api/tasks/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id })
      }).catch(() => {})
    }
  }

  return NextResponse.json({ data })
}
