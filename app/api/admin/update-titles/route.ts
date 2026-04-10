import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const updates = [
    { email: 'omar.elbanna@lighthouseegypt.com', title: 'CBDO' },
    { email: 'ahmed.elbanna@lighthouseegypt.com', title: 'CEO' },
    { email: 'marco.malak@lighthouseegypt.com', title: 'COO' },
  ]

  const results = []
  for (const { email, title } of updates) {
    const { error } = await supabase
      .from('profiles')
      .update({ title })
      .eq('email', email)
    results.push({ email, title, error: error?.message || null })
  }

  return NextResponse.json({ success: true, results })
}
