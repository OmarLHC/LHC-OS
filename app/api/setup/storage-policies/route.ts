import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const sql = `
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'docs_upload' AND schemaname = 'storage' AND tablename = 'objects') THEN
          CREATE POLICY "docs_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lhc-documents');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'docs_read' AND schemaname = 'storage' AND tablename = 'objects') THEN
          CREATE POLICY "docs_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'lhc-documents');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'docs_delete' AND schemaname = 'storage' AND tablename = 'objects') THEN
          CREATE POLICY "docs_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'lhc-documents');
        END IF;
      END $$;
    `

    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql })
    })

    const text = await res.text()
    return NextResponse.json({ success: res.ok, status: res.status, response: text })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
