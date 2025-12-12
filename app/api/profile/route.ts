import { NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
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

    if (user) {
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
    }

    // Fallback: Supabase REST when Prisma didn't find a user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const filter = userId ? `id=eq.${encodeURIComponent(userId)}` : `email=eq.${encodeURIComponent(email)}`
    const url = `${supabaseUrl}/rest/v1/users?select=*&${filter}&limit=1`
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
  } catch (e: any) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Unexpected error', detail: e?.message || String(e) }, { status: 500 })
    }
    const filter = userId ? `id=eq.${encodeURIComponent(userId)}` : `email=eq.${encodeURIComponent(email)}`
    const url = `${supabaseUrl}/rest/v1/users?select=*&${filter}&limit=1`
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
  const email = body?.email as string | undefined
  const role = (body?.role as string | undefined)?.toUpperCase()
  const fullName = body?.fullName as string | undefined
  const dob = body?.dob as string | undefined
  const nationality = body?.nationality as string | undefined
  const nationalId = body?.nationalId as string | undefined
  const currency = body?.currency as string | undefined
  const language = body?.language as string | undefined
  const avatarUrl = body?.avatarUrl as string | undefined

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
  if (typeof avatarUrl === 'string') data.avatarUrl = avatarUrl

  try {
    await prisma.user.upsert({
      where: { id: userId },
      update: data,
      create: {
        id: userId,
        email: typeof email === 'string' ? email : '',
        role: role === 'CUSTOMER' ? ('CUSTOMER' as any) : ('CUSTOMER' as any),
        ...data,
      },
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Unexpected error', detail: e?.message || String(e) }, { status: 500 })
    }
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' } as any

    // Check if exists by id
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=id`, { headers, cache: 'no-store' })
    let exists = false
    if (checkRes.ok) {
      const arr = await checkRes.json()
      exists = Array.isArray(arr) && arr.length > 0
    }

    const bodyCommon: any = {}
    if (typeof email === 'string') bodyCommon.email = email
    if (typeof fullName === 'string') bodyCommon.full_name = fullName
    if (typeof nationality === 'string') bodyCommon.nationality = nationality
    if (typeof nationalId === 'string') bodyCommon.national_id = nationalId
    if (typeof currency === 'string') bodyCommon.currency = currency
    if (typeof language === 'string') bodyCommon.language = language
    if (typeof dob === 'string' && dob) bodyCommon.date_of_birth = dob
    if (typeof avatarUrl === 'string') bodyCommon.avatar_url = avatarUrl
    bodyCommon.updatedAt = new Date().toISOString()

    if (exists) {
      const res = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(bodyCommon),
      })
      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json({ error: 'Failed to update user', detail: text }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    } else {
      const insertBody = { id: userId, role: 'CUSTOMER', createdAt: new Date().toISOString(), ...bodyCommon }
      const res = await fetch(`${supabaseUrl}/rest/v1/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(insertBody),
      })
      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json({ error: 'Failed to create user', detail: text }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }
  }
}
