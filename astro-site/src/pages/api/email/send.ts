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

function json(payload: unknown, status = 200): Response {
  const response = new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
  return applySecurityHeaders(response);
}

function toStringValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

async function readPayload(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid JSON format in request');
    return body as Record<string, unknown>;
  }

  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

function setRecord(id: string, record: Omit<EmailRecord, 'id'>): void {
  emailStore.set(id, { id, ...record });
}

function smtpConfigurationError(): Error | null {
  return process.env.SMTP_HOST?.trim() ? null : new Error('SMTP_HOST is not configured');
}

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id') || '';
  if (!id) return json({ success: false, error: 'Missing id', code: 'MISSING_ID' }, 400);

  const record = emailStore.get(id);
  if (!record) return json({ success: false, error: 'Not found', code: 'NOT_FOUND' }, 404);

  return json({ success: true, data: record });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const startedAt = Date.now();
  const cookieToken = cookies.get(CSRFProtection.COOKIE_NAME)?.value || null;

  if (!CSRFProtection.validateRequest(request, cookieToken)) {
    return json({ success: false, error: 'Invalid CSRF token', code: 'CSRF_VALIDATION_FAILED' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await readPayload(request);
  } catch (error) {
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid request body',
        code: 'INVALID_JSON',
      },
      400,
    );
  }

  const type = body.type === 'inquiry' ? 'inquiry' : 'contact';
  const locale = body.locale === 'es' ? 'es' : 'en';
  const clientIP = getClientIP(request);
  const emailId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  setRecord(emailId, { status: 'pending', createdAt, updatedAt: createdAt });

  try {
    let recipient: string;
    let subject: string;
    let html: string;
    let text: string;
    let replyTo: string;
    let priority: 'high' | 'normal';

    if (type === 'contact') {
      const payload = {
        name: toStringValue(body.name),
        email: toStringValue(body.email),
        company: toStringValue(body.company),
        country: toStringValue(body.country),
        phone: toStringValue(body.phone),
        subject: toStringValue(body.subject),
        message: toStringValue(body.message),
      };
      const validation = defaultEmailSecurity.validateContactForm(payload, clientIP);

      if (!validation.isValid) {
        setRecord(emailId, { status: 'failed', error: 'Validation failed', createdAt, updatedAt: new Date().toISOString() });
        return json({ success: false, error: 'Validation failed', errors: validation.errors, warnings: validation.warnings, code: 'VALIDATION_FAILED' }, 400);
      }
      if (validation.riskScore > 70) {
        setRecord(emailId, { status: 'failed', error: 'Message requires manual review', createdAt, updatedAt: new Date().toISOString() });
        return json({ success: false, error: 'Message requires manual review', code: 'MANUAL_REVIEW_REQUIRED' }, 429);
      }

      const content = await renderContactFormEmail({ ...payload, clientIP }, locale);
      recipient = process.env.CONTACT_EMAIL || 'info@yhflexiblebusbar.com';
      ({ subject, html, text } = content);
      replyTo = payload.email;
      priority = 'normal';
    } else {
      const payload = {
        name: toStringValue(body.name),
        email: toStringValue(body.email),
        company: toStringValue(body.company),
        productInterest: toStringValue(body.productInterest),
        message: toStringValue(body.message),
      };
      const validation = defaultEmailSecurity.validateInquiryForm(payload, clientIP);

      if (!validation.isValid) {
        setRecord(emailId, { status: 'failed', error: 'Validation failed', createdAt, updatedAt: new Date().toISOString() });
        return json({ success: false, error: 'Validation failed', errors: validation.errors, warnings: validation.warnings, code: 'VALIDATION_FAILED' }, 400);
      }
      if (validation.riskScore > 70) {
        setRecord(emailId, { status: 'failed', error: 'Message requires manual review', createdAt, updatedAt: new Date().toISOString() });
        return json({ success: false, error: 'Message requires manual review', code: 'MANUAL_REVIEW_REQUIRED' }, 429);
      }

      const content = await renderInquiryFormEmail({ ...payload, clientIP }, locale);
      recipient = process.env.INQUIRY_EMAIL || 'sales@yhflexiblebusbar.com';
      ({ subject, html, text } = content);
      replyTo = payload.email;
      priority = 'high';
    }

    const smtpError = smtpConfigurationError();
    if (smtpError) throw smtpError;

    const service = createEmailService();
    if (!(await service.verifyConnection())) throw new Error('Email service connection failed');
    const result = await service.sendEmail({ to: recipient, subject, html, text, replyTo, priority });
    if (!result.success) throw new Error(result.error || 'Failed to send email');

    setRecord(emailId, {
      status: 'sent',
      messageId: result.messageId,
      createdAt,
      updatedAt: new Date().toISOString(),
    });

    return json({
      success: true,
      message: locale === 'es' ? 'Correo enviado exitosamente' : 'Email sent successfully',
      emailId,
      messageId: result.messageId,
      processingTime: Date.now() - startedAt,
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const lowerMessage = rawMessage.toLowerCase();
    const errorCode = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
    let responseCode = 'INTERNAL_ERROR';
    let message = 'Internal server error';

    if (rawMessage === 'SMTP_HOST is not configured' || lowerMessage.includes('smtp')) {
      responseCode = 'SMTP_CONFIG_ERROR';
      message = 'Email service configuration error';
    } else if (lowerMessage.includes('auth') || lowerMessage.includes('invalid login')) {
      responseCode = 'SMTP_AUTH_FAILED';
      message = 'Email service authentication failed';
    } else if (
      lowerMessage.includes('connection') ||
      lowerMessage.includes('refused') ||
      lowerMessage.includes('timeout') ||
      ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ESOCKET'].includes(errorCode)
    ) {
      responseCode = 'SMTP_CONNECTION_FAILED';
      message = 'Email service connection failed';
    }

    setRecord(emailId, { status: 'failed', error: rawMessage, createdAt, updatedAt: new Date().toISOString() });
    return json(
      {
        success: false,
        error: message,
        message,
        code: responseCode,
        processingTime: Date.now() - startedAt,
        debug: import.meta.env.DEV ? { originalError: rawMessage } : undefined,
      },
      responseCode.startsWith('SMTP_') ? 503 : 500,
    );
  }
};
