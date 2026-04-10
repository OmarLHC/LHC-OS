import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Create "Board" department if it doesn't exist
  const { data: existing } = await supabase
    .from('departments')
    .select('id')
    .eq('name', 'Board')
    .single()

  let deptId = existing?.id

  if (!deptId) {
    const { data: newDept, error: deptErr } = await supabase
      .from('departments')
      .insert({ name: 'Board' })
      .select('id')
      .single()
    if (deptErr) return NextResponse.json({ error: deptErr.message }, { status: 500 })
    deptId = newDept.id
  }

  // 2. Assign all three to Board department
  const emails = [
    'omar.elbanna@lighthouseegypt.com',
    'ahmed.elbanna@lighthouseegypt.com',
    'marco.malak@lighthouseegypt.com',
  ]

  const results = []
  for (const email of emails) {
    const { error } = await supabase
      .from('profiles')
      .update({ department_id: deptId })
      .eq('email', email)
    results.push({ email, error: error?.message || null })
  }

  return NextResponse.json({ success: true, deptId, results })
}
