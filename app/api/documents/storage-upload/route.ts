import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // Verify user is authenticated
  const userSupabase = await createServerClient()
  const { data: { user }, error: authError } = await userSupabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const path = formData.get('path') as string

  if (!file || !path) {
    return NextResponse.json({ error: 'Missing file or path' }, { status: 400 })
  }

  // Use service role key for storage upload — bypasses RLS
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { data, error } = await adminSupabase.storage
    .from('lhc-documents')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const { data: { publicUrl } } = adminSupabase.storage
    .from('lhc-documents')
    .getPublicUrl(path)

  return NextResponse.json({ path: data.path, publicUrl })
}
