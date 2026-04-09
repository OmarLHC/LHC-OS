import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

    // Use Supabase Management API to run SQL directly
    const queries = [
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'docs_upload' AND schemaname = 'storage' AND tablename = 'objects') THEN
          CREATE POLICY "docs_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lhc-documents');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'docs_read' AND schemaname = 'storage' AND tablename = 'objects') THEN
          CREATE POLICY "docs_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'lhc-documents');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'docs_delete' AND schemaname = 'storage' AND tablename = 'objects') THEN
          CREATE POLICY "docs_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'lhc-documents');
        END IF;
      END $$;`
    ]

    const results = []
    for (const query of queries) {
      const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      })
      const data = await res.text()
      results.push({ status: res.status, data: data.slice(0, 200) })
    }

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
