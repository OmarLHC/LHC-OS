import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Use Supabase's pg REST endpoint directly with service role
  const queries = [
    `ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='documents' AND policyname='doc_insert') THEN CREATE POLICY doc_insert ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL); END IF; END $$;`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='documents' AND policyname='doc_select') THEN CREATE POLICY doc_select ON public.documents FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL); END IF; END $$;`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='documents' AND policyname='doc_update') THEN CREATE POLICY doc_update ON public.documents FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL); END IF; END $$;`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='documents' AND policyname='doc_delete') THEN CREATE POLICY doc_delete ON public.documents FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL); END IF; END $$;`,
  ]

  const results = []
  for (const query of queries) {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: query })
    })
    const text = await res.text()
    results.push({ q: query.slice(0, 50), status: res.status, result: text.slice(0, 100) })
  }

  // Verify by checking policies
  const checkRes = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
  })

  return NextResponse.json({ results })
}
