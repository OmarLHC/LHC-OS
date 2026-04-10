import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const name = (formData.get('name') as string) || 'screenshot.jpg'
    if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 })
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(`/tmp/${name}`, buffer)
    return NextResponse.json({ success: true, name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
