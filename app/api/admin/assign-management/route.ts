import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get the Management department ID
  const { data: dept, error: deptErr } = await supabase
    .from('departments')
    .select('id, name')
    .eq('name', 'Management')
    .single()

  if (deptErr || !dept) {
    return NextResponse.json({ error: 'Management department not found', detail: deptErr?.message })
  }

  // Assign all 3 to Management department
  const emails = [
    'omar.elbanna@lighthouseegypt.com',
    'ahmed.elbanna@lighthouseegypt.com',
    'marco.malak@lighthouseegypt.com',
  ]

  const results = []
  for (const email of emails) {
    const { error } = await supabase
      .from('profiles')
      .update({ department_id: dept.id })
      .eq('email', email)
    results.push({ email, department: dept.name, error: error?.message || null })
  }

  return NextResponse.json({ success: true, department: dept, results })
}
