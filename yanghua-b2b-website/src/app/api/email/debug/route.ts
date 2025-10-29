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
    // 安全检查：开发环境直接允许，生产环境需要授权token
    const authHeader = request.headers.get('authorization');
    const debugToken = process.env.EMAIL_DEBUG_TOKEN;
    
    if (process.env.NODE_ENV === 'production') {
      if (!debugToken || !authHeader || authHeader !== `Bearer ${debugToken}`) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unauthorized access to debug endpoint',
            code: 'UNAUTHORIZED'
          },
          { status: 401 }
        );
      }
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

/**
 * 邮件连接测试端点 - POST /api/email/debug
 */
export async function POST(request: NextRequest) {
  try {
    // 安全检查
    const authHeader = request.headers.get('authorization');
    const debugToken = process.env.EMAIL_DEBUG_TOKEN;
    
    if (process.env.NODE_ENV === 'production') {
      if (!debugToken || !authHeader || authHeader !== `Bearer ${debugToken}`) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unauthorized access to debug endpoint',
            code: 'UNAUTHORIZED'
          },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { test_email, test_type = 'connection' } = body;

    if (test_type === 'send' && test_email) {
      // 发送测试邮件
      const testResult = await EmailServiceDebugger.testEmailSend(test_email);
      
      return NextResponse.json({
        success: true,
        test_type: 'send',
        data: testResult,
        timestamp: new Date().toISOString()
      });
    } else {
      // 仅测试连接
      const diagnosis = await EmailServiceDebugger.diagnose();
      
      return NextResponse.json({
        success: true,
        test_type: 'connection',
        data: diagnosis,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Email debug test error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug test failed',
        code: 'DEBUG_ERROR',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}