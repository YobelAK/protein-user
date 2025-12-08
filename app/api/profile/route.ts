import { NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export async function GET(request: Request) {
  const urlObj = new URL(request.url)
  const userId = urlObj.searchParams.get('userId') || ''
  const email = urlObj.searchParams.get('email') || ''

  if (!userId && !email) {
    return NextResponse.json({ error: 'Missing user identifier' }, { status: 400 })
  }
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          userId ? { id: userId } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean) as any,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        dob: true,
        nationality: true,
        nationalId: true,
        currency: true,
        language: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName || '',
      avatarUrl: user.avatarUrl || '',
      dob: user.dob ? new Date(user.dob).toISOString().slice(0, 10) : '',
      nationality: user.nationality || '',
      nationalId: user.nationalId || '',
      currency: user.currency || 'USD',
      language: user.language || 'en',
    })
  } catch (e: any) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Unexpected error', detail: e?.message || String(e) }, { status: 500 })
    }
    const filter = userId ? `id=eq.${encodeURIComponent(userId)}` : `email=eq.${encodeURIComponent(email)}`
    const url = `${supabaseUrl}/rest/v1/users?select=*&&${filter}&limit=1`
    const res = await fetch(url, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Failed to fetch user', detail: text }, { status: 500 })
    }
    const data = await res.json()
    const u = Array.isArray(data) && data.length > 0 ? data[0] : null
    if (!u) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({
      id: u.id,
      email: u.email,
      fullName: u.full_name || '',
      avatarUrl: u.avatar_url || '',
      dob: u.date_of_birth ? String(u.date_of_birth).slice(0, 10) : '',
      nationality: u.nationality || '',
      nationalId: u.national_id || '',
      currency: u.currency || 'USD',
      language: u.language || 'en',
    })
  }
}

export async function PUT(request: Request) {
  const body = await request.json()
  const userId = String(body?.userId || '')
  const fullName = body?.fullName as string | undefined
  const dob = body?.dob as string | undefined
  const nationality = body?.nationality as string | undefined
  const nationalId = body?.nationalId as string | undefined
  const currency = body?.currency as string | undefined
  const language = body?.language as string | undefined

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const data: any = {}
  if (typeof fullName === 'string') data.fullName = fullName
  if (typeof nationality === 'string') data.nationality = nationality
  if (typeof nationalId === 'string') data.nationalId = nationalId
  if (typeof currency === 'string') data.currency = currency
  if (typeof language === 'string') data.language = language
  if (typeof dob === 'string' && dob) data.dob = new Date(dob)

  try {
    await prisma.user.update({ where: { id: userId }, data })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Unexpected error', detail: e?.message || String(e) }, { status: 500 })
    }
    const patch: any = {}
    if (typeof fullName === 'string') patch.full_name = fullName
    if (typeof nationality === 'string') patch.nationality = nationality
    if (typeof nationalId === 'string') patch.national_id = nationalId
    if (typeof currency === 'string') patch.currency = currency
    if (typeof language === 'string') patch.language = language
    if (typeof dob === 'string' && dob) patch.date_of_birth = dob

    const url = `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Failed to update user', detail: text }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }
}
