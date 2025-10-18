import { NextResponse } from 'next/server';
import { CSRFProtection, applySecurityHeaders } from '@/lib/security';

// 确保此接口始终动态处理
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 简易 CSRF 获取接口
 * GET /api/csrf
 * 返回一个 JSON，并同时在响应中设置 csrf-token Cookie。
 */
export async function GET() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'CSRF token has been set in cookie.',
    });

    // 在响应中附加 CSRF cookie
    const withToken = CSRFProtection.addTokenToResponse(response);

    // 应用安全头
    return applySecurityHeaders(withToken);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate CSRF token',
        debug: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}