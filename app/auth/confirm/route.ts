import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash') || ''
  const type = (searchParams.get('type') as EmailOtpType | null)
  const _next = searchParams.get('next') || '/reset-password'
  const next = _next.startsWith('/') ? _next : '/'

  try {
    const supabase = await getSupabaseServerClient() as any
    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type })
      if (!error) {
        return NextResponse.redirect(new URL(next, request.url))
      }
      const q = new URLSearchParams({
        error: 'access_denied',
        error_code: 'otp_error',
        error_description: error?.message || 'Verification failed',
      })
      const target = next || '/reset-password'
      return NextResponse.redirect(new URL(`${target}?${q.toString()}`, request.url))
    }
    const code = searchParams.get('code') || ''
    if (code && typeof supabase.auth.exchangeCodeForSession === 'function') {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(new URL(next, request.url))
      }
      const q = new URLSearchParams({
        error: 'access_denied',
        error_code: 'code_error',
        error_description: error?.message || 'Code exchange failed',
      })
      const target = next || '/reset-password'
      return NextResponse.redirect(new URL(`${target}?${q.toString()}`, request.url))
    }
    return NextResponse.redirect(new URL('/', request.url))
  } catch (e: any) {
    const q = new URLSearchParams({
      error: 'access_denied',
      error_code: 'server_error',
      error_description: e?.message || 'Unexpected error',
    })
    const next = (searchParams.get('next') || '/reset-password')
    return NextResponse.redirect(new URL(`${next}?${q.toString()}`, request.url))
  }
}
