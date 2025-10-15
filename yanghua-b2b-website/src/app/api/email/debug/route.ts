import { NextRequest, NextResponse } from 'next/server';
// 强制此 API 为动态，避免构建期尝试静态预渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { EmailServiceDebugger } from '@/lib/email/EmailServiceDebug';

/**
 * 邮件服务调试API - GET /api/email/debug
 */
export async function GET(request: NextRequest) {
  try {
    // 只在开发环境允许访问
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Debug endpoint only available in development mode',
          code: 'NOT_ALLOWED'
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'diagnose';
    const testEmail = searchParams.get('email');

    switch (action) {
      case 'diagnose':
        const diagnosis = await EmailServiceDebugger.diagnose();
        return NextResponse.json({
          success: true,
          data: diagnosis,
        });

      case 'test':
        if (!testEmail) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Test email address is required',
              code: 'MISSING_EMAIL'
            },
            { status: 400 }
          );
        }

        const testResult = await EmailServiceDebugger.testEmailSend(testEmail);
        return NextResponse.json({
          success: true,
          data: testResult,
        });

      case 'report':
        const report = await EmailServiceDebugger.generateReport();
        return new Response(report, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Available actions: diagnose, test, report',
            code: 'INVALID_ACTION'
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Email debug API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug operation failed',
        code: 'DEBUG_ERROR',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}