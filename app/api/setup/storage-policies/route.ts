import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'storage' } }
    )

    // Check existing policies
    const { data: policies } = await supabase
      .schema('pg_catalog' as any)
      .from('pg_policies' as any)
      .select('policyname, schemaname, tablename')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects')

    // Try inserting directly into storage.objects to test if RLS is already configured
    // Actually - use the storage admin API to list buckets as a test
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    return NextResponse.json({ 
      buckets,
      bucketsError: bucketsError?.message,
      policies,
      note: 'Storage bucket exists. Run SQL manually for policies.'
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
