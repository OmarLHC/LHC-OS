import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Add columns one at a time using raw SQL via pg
  const queries = [
    `ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_type text DEFAULT 'Other'`,
    `ALTER TABLE public.tasks ADD CONSTRAINT IF NOT EXISTS tasks_task_type_check CHECK (task_type IN ('BOQ','Contract','Drawing','Other','Photo','Site Report','Submittal','Tender Offer'))`,
    `ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachment_url text`,
    `ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachment_name text`,
  ]

  const results = []
  for (const q of queries) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: q })
      })
      results.push({ q: q.slice(0, 60), status: res.status })
    } catch (e: any) {
      results.push({ q: q.slice(0, 60), error: e.message })
    }
  }
  return NextResponse.json({ results })
}
// Note: also run this in Supabase SQL editor:
// ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS complete_on_upload boolean DEFAULT false;
