import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const prisma = db

export async function POST(request: Request) {
  const body = await request.json()
  const emailRaw = String(body?.email || '').trim().toLowerCase()
  const descriptionRaw = typeof body?.description === 'string' ? String(body.description).trim() : undefined
  if (!emailRaw || !emailRaw.includes('@')) {
    return NextResponse.json({ error: 'Email tidak valid' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && serviceKey) {
    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    } as any
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(emailRaw)}&select=id`, { headers, cache: 'no-store' })
    let exists = false
    let existingId: string | null = null
    if (checkRes.ok) {
      const arr = await checkRes.json()
      exists = Array.isArray(arr) && arr.length > 0
      existingId = exists ? String(arr[0]?.id ?? '') : null
    }
    if (exists) {
      const res = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(existingId || '')}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ full_name: 'SUBSCRIBER', isActive: false, updatedAt: new Date().toISOString(), description: descriptionRaw }),
      })
      if (!res.ok) {
        const text = await res.text()
        console.error('NEWSLETTER_SUPABASE_PATCH_FAILED', res.status, text)
        return NextResponse.json({ error: 'Gagal menyimpan', detail: text }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    } else {
      const insertBody = {
        id: crypto.randomUUID(),
        email: emailRaw,
        role: 'CUSTOMER',
        full_name: 'SUBSCRIBER',
        isActive: false,
        updatedAt: new Date().toISOString(),
        description: descriptionRaw,
      }
      const res = await fetch(`${supabaseUrl}/rest/v1/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(insertBody),
      })
      if (!res.ok) {
        const text = await res.text()
        console.error('NEWSLETTER_SUPABASE_POST_FAILED', res.status, text)
        return NextResponse.json({ error: 'Gagal menyimpan', detail: text }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }
  }
  try {
    await prisma.user.upsert({
      where: { email: emailRaw },
      update: { fullName: 'SUBSCRIBER', isActive: false },
      create: {
        id: crypto.randomUUID(),
        email: emailRaw,
        role: 'CUSTOMER' as any,
        fullName: 'SUBSCRIBER',
        isActive: false,
      },
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('NEWSLETTER_PRISMA_FAILED', e?.message || String(e))
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 })
  }
}

