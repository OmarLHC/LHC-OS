import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const userSupabase = await createServerClient()
  const { data: { user }, error: authError } = await userSupabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { storagePath, expiresIn = 3600 } = await request.json()
  if (!storagePath) {
    return NextResponse.json({ error: 'Missing storagePath' }, { status: 400 })
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await adminSupabase.storage
    .from('lhc-documents')
    .createSignedUrl(storagePath, expiresIn)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message || 'Failed to generate URL' }, { status: 400 })
  }

  return NextResponse.json({ signedUrl: data.signedUrl })
}
