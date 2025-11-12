import { NextRequest, NextResponse } from 'next/server'
import { monitoring } from '@/lib/monitoring'
import { applySecurityHeaders } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const lastMsParam = url.searchParams.get('lastMs')
  const lastMs = lastMsParam ? Number(lastMsParam) : 24 * 60 * 60 * 1000
  const summary = monitoring.crawl.getSummary(isFinite(lastMs) ? lastMs : undefined as any)
  const res = NextResponse.json({ success: true, data: summary })
  return applySecurityHeaders(res)
}

