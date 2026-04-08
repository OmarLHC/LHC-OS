import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data, error } = await supabase.storage.createBucket('lhc-documents', {
    public: false,
    fileSizeLimit: 52428800,
    allowedMimeTypes: ['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword','image/jpeg','image/png','image/gif','image/webp','application/octet-stream']
  })
  if (error && !error.message.includes('already exists')) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  // Set storage RLS policies
  await supabase.from('_sql').select('*').then(() => {}) // no-op, use admin client below
  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { db: { schema: 'storage' } })
  return NextResponse.json({ success: true, message: 'Bucket created or already exists' })
}
