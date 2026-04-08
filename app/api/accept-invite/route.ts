import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    // Validate invitation
    const { data: invite, error: invErr } = await supabase
      .from('invitations').select('*').eq('token', token).single()

    if (invErr || !invite) return NextResponse.json({ error: 'Invalid invitation.' }, { status: 400 })
    if (invite.accepted_at) return NextResponse.json({ error: 'Invitation already used.' }, { status: 400 })
    if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Invitation expired.' }, { status: 400 })

    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: invite.full_name }
    })

    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

    // Create profile
    const { error: profileErr } = await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: invite.full_name,
      email: invite.email,
      role: invite.role,
      department_id: invite.department_id,
      title: invite.title,
    })

    if (profileErr) {
      // Rollback auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileErr.message }, { status: 500 })
    }

    // Mark invitation as accepted
    await supabase.from('invitations').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to activate account.' }, { status: 500 })
  }
}
