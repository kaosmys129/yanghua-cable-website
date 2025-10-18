import { NextRequest, NextResponse } from 'next/server';
// 强制此 API 为动态，避免构建期尝试静态预渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { EmailService, createEmailService } from '@/lib/email/EmailService';
import { EmailStorage, defaultEmailStorage } from '@/lib/email/EmailStorage';
import { renderContactFormEmail, renderInquiryFormEmail } from '@/lib/email/EmailTemplates';
import { defaultEmailSecurity, getClientIP, createValidationSchemas } from '@/lib/email/EmailSecurity';
import { CSRFProtection } from '@/lib/security';

/**
 * 邮件发送API - POST /api/email/send
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let emailService: EmailService | null = null;
  let body: any = null;
  
  try {
    // CSRF 保护校验（仅接受来自本站页面或已获取 CSRF token 的客户端）
    if (!CSRFProtection.validateRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token', code: 'CSRF_VALIDATION_FAILED' },
        { status: 403 }
      );
    }
    body = await request.json();
    console.log("Received email request body:", JSON.stringify(body, null, 2));
    const clientIP = getClientIP(request);
    const locale = body.locale || 'en';
    
    // 获取表单类型
    const formType = body.type || 'contact'; // 'contact' 或 'inquiry'
    
    // 安全验证
    let validationResult;
    if (formType === 'contact') {
      validationResult = defaultEmailSecurity.validateContactForm(body, clientIP);
    } else if (formType === 'inquiry') {
      validationResult = defaultEmailSecurity.validateInquiryForm(body, clientIP);
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid form type',
          code: 'INVALID_FORM_TYPE'
        },
        { status: 400 }
      );
    }

    // 检查验证结果
    if (!validationResult.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          code: 'VALIDATION_FAILED'
        },
        { status: 400 }
      );
    }

    // 如果风险分数过高，需要人工审核
    if (validationResult.riskScore > 70) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Message requires manual review',
          code: 'MANUAL_REVIEW_REQUIRED'
        },
        { status: 429 }
      );
    }

    // 创建邮件服务
    emailService = createEmailService();
    console.log("EmailService created.");
    
    // 验证邮件服务连接
    console.log("Verifying email service connection...");
    const isConnected = await emailService.verifyConnection();
    console.log("Email service connection status:", isConnected);
    if (!isConnected) {
      throw new Error('Email service connection failed');
    }

    // 渲染邮件模板
    let emailContent;
    if (formType === 'contact') {
      emailContent = await renderContactFormEmail(body, locale);
    } else {
      emailContent = await renderInquiryFormEmail(body, locale);
    }

    // 准备邮件选项
    const emailOptions = {
      to: formType === 'contact' 
        ? (process.env.CONTACT_EMAIL || 'contact@yanghua.com')
        : (process.env.INQUIRY_EMAIL || 'inquiry@yanghua.com'),
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      replyTo: body.email,
      priority: formType === 'inquiry' ? 'high' as const : 'normal' as const,
    };

    // 保存邮件记录到数据库
    let emailRecordId: string | null = null;
    try {
      emailRecordId = await defaultEmailStorage.saveEmail({
        type: formType as 'contact' | 'inquiry',
        from: body.email,
        to: emailOptions.to,
        subject: emailOptions.subject,
        htmlContent: emailOptions.html,
        textContent: emailOptions.text,
        status: 'pending',
        locale,
        templateData: JSON.stringify(body),
        retryCount: 0,
        priority: emailOptions.priority,
        metadata: JSON.stringify({
          clientIP,
          userAgent: request.headers.get('user-agent'),
          riskScore: validationResult.riskScore,
          warnings: validationResult.warnings,
        }),
      });
    } catch (saveError) {
      console.warn('Failed to persist email record, continuing without DB:', (saveError as Error).message);
    }

    // 发送邮件
    console.log("Sending email with options:", JSON.stringify(emailOptions, null, 2));
    const sendResult = await emailService.sendEmail(emailOptions);
    console.log("Email send result:", JSON.stringify(sendResult, null, 2));

    // 更新邮件记录状态
    try {
      if (emailRecordId) {
        if (sendResult.success) {
          await defaultEmailStorage.updateEmail(emailRecordId, {
            status: 'sent',
            messageId: sendResult.messageId,
            sentAt: new Date(),
          });
        } else {
          await defaultEmailStorage.updateEmail(emailRecordId, {
            status: 'failed',
            errorMessage: sendResult.error,
          });
        }
      }
    } catch (updateError) {
      console.warn('Failed to update email record status:', (updateError as Error).message);
    }

    // 返回结果
    if (sendResult.success) {
      return NextResponse.json({
        success: true,
        message: locale === 'es' 
          ? 'Correo enviado exitosamente' 
          : 'Email sent successfully',
        emailId: emailRecordId,
        messageId: sendResult.messageId,
        processingTime: Date.now() - startTime,
      });
    } else {
      throw new Error(sendResult.error || 'Failed to send email');
    }

  } catch (error) {
    console.error('Email send API error:', error);
    
    // 详细错误日志
    console.error('Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name,
      body: body ? JSON.stringify(body, null, 2) : 'No body',
      timestamp: new Date().toISOString()
    });
    
    // 记录错误到数据库（如果可能）
    try {
      if (body && body.email) {
        await defaultEmailStorage.saveEmail({
          type: body.type || 'contact',
          from: body.email,
          to: 'error@yanghua.com',
          subject: 'Email Send Error',
          textContent: `Error: ${(error as Error).message}`,
          status: 'failed',
          locale: body.locale || 'en',
          templateData: JSON.stringify(body),
          errorMessage: (error as Error).message,
          retryCount: 0,
          priority: 'normal',
        });
      }
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
    }


    // 根据错误类型返回不同的响应
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof SyntaxError) {
      errorMessage = 'Invalid JSON format in request';
      statusCode = 400;
    } else if ((error as Error).message.includes('SMTP')) {
      errorMessage = 'Email service configuration error';
      statusCode = 503;
    } else if ((error as Error).message.includes('validation')) {
      errorMessage = 'Data validation error';
      statusCode = 400;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        code: 'INTERNAL_ERROR',
        processingTime: Date.now() - startTime,
        debug: process.env.NODE_ENV === 'development' ? {
          originalError: (error as Error).message,
          errorType: (error as Error).name
        } : undefined
      },
      { status: statusCode }
    );
  } finally {
    // 清理资源
    if (emailService) {
      await emailService.close();
    }
  }
}

/**
 * 获取邮件发送状态 - GET /api/email/send
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('id');

    if (!emailId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email ID is required',
          code: 'MISSING_EMAIL_ID'
        },
        { status: 400 }
      );
    }

    const emailRecord = await defaultEmailStorage.getEmail(emailId);
    
    if (!emailRecord) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email not found',
          code: 'EMAIL_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      email: {
        id: emailRecord.id,
        type: emailRecord.type,
        status: emailRecord.status,
        subject: emailRecord.subject,
        locale: emailRecord.locale,
        messageId: emailRecord.messageId,
        errorMessage: emailRecord.errorMessage,
        retryCount: emailRecord.retryCount,
        priority: emailRecord.priority,
        sentAt: emailRecord.sentAt,
        createdAt: emailRecord.createdAt,
      },
    });

  } catch (error) {
    console.error('Email status API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}