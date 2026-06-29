import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { applySecurityHeaders, CSRFProtection } from '../../../lib/yanghua/server/security';
import { defaultEmailSecurity, getClientIP } from '../../../lib/yanghua/server/email/EmailSecurity';
import { createEmailService } from '../../../lib/yanghua/server/email/EmailService';
import { renderContactFormEmail, renderInquiryFormEmail } from '../../../lib/yanghua/server/email/EmailTemplates';

export const prerender = false;

type EmailStatus = 'pending' | 'sent' | 'failed';

type EmailRecord = {
  id: string;
  status: EmailStatus;
  messageId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

const emailStore = new Map<string, EmailRecord>();

function json(payload: any, init?: ResponseInit) {
  const response = new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(init?.headers || {}),
    },
  });
  return applySecurityHeaders(response);
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  if (!id) {
    return json({ success: false, error: 'Missing id', code: 'MISSING_ID' }, { status: 400 });
  }

  const record = emailStore.get(id);
  if (!record) {
    return json({ success: false, error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  return json({ success: true, data: record }, { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const startTime = Date.now();

  const cookieToken = cookies.get(CSRFProtection.COOKIE_NAME)?.value || null;
  if (!CSRFProtection.validateRequest(request, cookieToken)) {
    return json({ success: false, error: 'Invalid CSRF token', code: 'CSRF_VALIDATION_FAILED' }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON format in request', code: 'INVALID_JSON' }, { status: 400 });
  }

  const type = body?.type === 'inquiry' ? 'inquiry' : 'contact';
  const locale = body?.locale === 'es' ? 'es' : 'en';
  const clientIP = getClientIP(request);

  const emailId = crypto.randomUUID();
  const now = new Date().toISOString();
  emailStore.set(emailId, { id: emailId, status: 'pending', createdAt: now, updatedAt: now });

  try {
    if (type === 'contact') {
      const payload = {
        name: toStr(body?.name),
        email: toStr(body?.email),
        company: toStr(body?.company),
        country: toStr(body?.country),
        phone: toStr(body?.phone),
        subject: toStr(body?.subject),
        message: toStr(body?.message),
      };

      const validation = defaultEmailSecurity.validateContactForm(payload, clientIP);
      if (!validation.isValid) {
        return json(
          { success: false, error: 'Validation failed', errors: validation.errors, warnings: validation.warnings, code: 'VALIDATION_FAILED' },
          { status: 400 }
        );
      }
      if (validation.riskScore > 70) {
        return json({ success: false, error: 'Message requires manual review', code: 'MANUAL_REVIEW_REQUIRED' }, { status: 429 });
      }

      const to = process.env.CONTACT_EMAIL || 'contact@yanghua.com';
      const emailContent = await renderContactFormEmail({ ...payload, clientIP }, locale);

      const service = createEmailService();
      const isConnected = await service.verifyConnection();
      if (!isConnected) throw new Error('Email service connection failed');

      const result = await service.sendEmail({
        to,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        replyTo: payload.email,
        priority: 'normal',
      });

      if (!result.success) throw new Error(result.error || 'Failed to send email');

      emailStore.set(emailId, { id: emailId, status: 'sent', messageId: result.messageId, createdAt: now, updatedAt: new Date().toISOString() });

      return json(
        {
          success: true,
          message: locale === 'es' ? 'Correo enviado exitosamente' : 'Email sent successfully',
          emailId,
          messageId: result.messageId,
          processingTime: Date.now() - startTime,
        },
        { status: 200 }
      );
    }

    const payload = {
      name: toStr(body?.name),
      email: toStr(body?.email),
      company: toStr(body?.company),
      productInterest: toStr(body?.productInterest),
      message: toStr(body?.message),
    };

    const validation = defaultEmailSecurity.validateInquiryForm(payload, clientIP);
    if (!validation.isValid) {
      return json(
        { success: false, error: 'Validation failed', errors: validation.errors, warnings: validation.warnings, code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }
    if (validation.riskScore > 70) {
      return json({ success: false, error: 'Message requires manual review', code: 'MANUAL_REVIEW_REQUIRED' }, { status: 429 });
    }

    const to = process.env.INQUIRY_EMAIL || 'inquiry@yanghua.com';
    const emailContent = await renderInquiryFormEmail({ ...payload, clientIP }, locale);

    const service = createEmailService();
    const isConnected = await service.verifyConnection();
    if (!isConnected) throw new Error('Email service connection failed');

    const result = await service.sendEmail({
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      replyTo: payload.email,
      priority: 'high',
    });

    if (!result.success) throw new Error(result.error || 'Failed to send email');

    emailStore.set(emailId, { id: emailId, status: 'sent', messageId: result.messageId, createdAt: now, updatedAt: new Date().toISOString() });

    return json(
      {
        success: true,
        message: locale === 'es' ? 'Correo enviado exitosamente' : 'Email sent successfully',
        emailId,
        messageId: result.messageId,
        processingTime: Date.now() - startTime,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const rawMessage = String(error?.message || '');
    const errMsg = rawMessage.toLowerCase();
    const errCode = String(error?.code || (error?.cause && error.cause.code) || '');

    let statusCode = 500;
    let responseCode = 'INTERNAL_ERROR';
    let errorMessage = 'Internal server error';

    if (
      errMsg.includes('email service connection failed') ||
      (errMsg.includes('connection') && (errMsg.includes('failed') || errMsg.includes('refused') || errMsg.includes('timeout'))) ||
      ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ESOCKET'].includes(errCode)
    ) {
      errorMessage = 'Email service connection failed';
      statusCode = 503;
      responseCode = 'SMTP_CONNECTION_FAILED';
    } else if (errMsg.includes('auth') || errMsg.includes('authentication') || errMsg.includes('invalid login')) {
      errorMessage = 'Email service authentication failed';
      statusCode = 503;
      responseCode = 'SMTP_AUTH_FAILED';
    } else if (errMsg.includes('smtp')) {
      errorMessage = 'Email service configuration error';
      statusCode = 503;
      responseCode = 'SMTP_CONFIG_ERROR';
    }

    emailStore.set(emailId, { id: emailId, status: 'failed', error: rawMessage, createdAt: now, updatedAt: new Date().toISOString() });

    return json(
      {
        success: false,
        error: errorMessage,
        message: errorMessage,
        code: responseCode,
        processingTime: Date.now() - startTime,
        debug: import.meta.env.DEV ? { originalError: rawMessage } : undefined,
      },
      { status: statusCode }
    );
  }
};
