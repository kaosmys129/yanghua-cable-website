'use client';

import { useState, useEffect } from 'react';
import { Send, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { sendForm } from '@/lib/network/FormRequest';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface QuickInquiryProps {
  projectId: string;
  projectTitle: string;
  csrfToken?: string;
}

export default function QuickInquiry({ projectId, projectTitle, csrfToken }: QuickInquiryProps) {
  const t = useTranslations('inquiry');
  const locale = useLocale();

  useEffect(() => {
    let cancelled = false;
    async function ensureCsrfCookie() {
      try {
        if (!csrfToken) {
          await fetch('/api/csrf', { method: 'GET', credentials: 'include' });
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[QuickInquiry] Failed to initialize CSRF cookie:', err);
        }
      }
    }
    ensureCsrfCookie();
    return () => { cancelled = true; };
  }, [csrfToken]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [emailId, setEmailId] = useState<string>('');

  const validate = () => {
    const errors: Record<string, string> = {};
    const name = formData.name.trim();
    const email = formData.email.trim();
    const message = formData.message.trim();

    if (!name) errors.name = locale === 'en' ? 'Name is required.' : 'El nombre es obligatorio.';
    if (!email) {
      errors.email = locale === 'en' ? 'Email is required.' : 'El correo electrónico es obligatorio.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = locale === 'en' ? 'Invalid email format.' : 'Formato de correo inválido.';
      }
    }
    if (!message) errors.message = locale === 'en' ? 'Message is required.' : 'El mensaje es obligatorio.';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    if (!validate()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const requestBody = {
        ...formData,
        type: 'inquiry',
        projectId,
        projectTitle,
        locale,
      };

      const result = await sendForm('/api/email/send', requestBody, {
        csrfToken,
        locale,
        method: 'POST',
      });

      if (result.ok && result.data?.success) {
        setSubmitStatus('success');
        setEmailId(result.data.emailId);
        setFormData({ name: '', email: '', company: '', message: '' });
      } else {
        setSubmitStatus('error');
        const errorPayload = result.error;
        const payloadErrors = (errorPayload?.errors || []);
        if (Array.isArray(payloadErrors) && payloadErrors.length > 0) {
          const errors: Record<string, string> = {};
          payloadErrors.forEach((error: string) => {
            if (error.includes('Name')) errors.name = error;
            else if (error.includes('Email')) errors.email = error;
            else if (error.includes('Company')) errors.company = error;
            else if (error.includes('Message')) errors.message = error;
          });
          setValidationErrors(errors);
        } else {
          setErrorMessage(errorPayload?.message || t('errors.submitFailed'));
        }
        
        if (process.env.NODE_ENV === 'development' && errorPayload?.debug) {
          console.error('API debug info:', errorPayload.debug);
        }
      }
    } catch (error) {
      console.error('Quick inquiry submission error:', error);
      setSubmitStatus('error');
      setErrorMessage(t('errors.networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-[#fdb827] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Check className="h-7 w-7 text-[#212529]" />
        </div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{t('success.title')}</h4>
        <p className="text-sm text-gray-600 mb-3">{t('success.description')}</p>
        {emailId && (
          <p className="text-xs text-gray-500 mb-4">
            {locale === 'en' ? 'Reference ID:' : 'ID de Referencia:'} {emailId.slice(0, 8)}...
          </p>
        )}
        <Button
          onClick={() => setSubmitStatus('idle')}
          className="w-full bg-[#212529] text-white hover:bg-[#212529]/90 font-semibold"
          size="sm"
        >
          {t('buttons.sendAnother')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 全局错误消息 */}
      {submitStatus === 'error' && errorMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">{errorMessage}</p>
            <p className="text-xs mt-1 text-destructive/70">
              {locale === 'en' ? 'Please check your information and try again.' : 'Por favor verifique su información e inténtelo de nuevo.'}
            </p>
          </div>
        </div>
      )}

      {/* 姓名 */}
      <div className="space-y-1.5">
        <Label htmlFor="qi-name" className="sr-only">{t('form.name')}</Label>
        <Input
          type="text"
          id="qi-name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder={t('placeholders.name')}
          aria-describedby={validationErrors.name ? 'qi-name-error' : undefined}
          className={validationErrors.name ? 'border-destructive ring-destructive/20' : 'border-gray-300'}
        />
        {validationErrors.name && (
          <p id="qi-name-error" className="text-xs text-destructive">{validationErrors.name}</p>
        )}
      </div>

      {/* 邮箱 */}
      <div className="space-y-1.5">
        <Label htmlFor="qi-email" className="sr-only">{t('form.email')}</Label>
        <Input
          type="email"
          id="qi-email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder={t('placeholders.email')}
          aria-describedby={validationErrors.email ? 'qi-email-error' : undefined}
          className={validationErrors.email ? 'border-destructive ring-destructive/20' : 'border-gray-300'}
        />
        {validationErrors.email && (
          <p id="qi-email-error" className="text-xs text-destructive">{validationErrors.email}</p>
        )}
      </div>

      {/* 公司 */}
      <div className="space-y-1.5">
        <Label htmlFor="qi-company" className="sr-only">{t('form.company')}</Label>
        <Input
          type="text"
          id="qi-company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder={t('placeholders.company')}
          aria-describedby={validationErrors.company ? 'qi-company-error' : undefined}
          className={validationErrors.company ? 'border-destructive ring-destructive/20' : 'border-gray-300'}
        />
        {validationErrors.company && (
          <p id="qi-company-error" className="text-xs text-destructive">{validationErrors.company}</p>
        )}
      </div>

      {/* 消息 */}
      <div className="space-y-1.5">
        <Label htmlFor="qi-message" className="sr-only">{t('form.message')}</Label>
        <Textarea
          id="qi-message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={3}
          placeholder={t('placeholders.message')}
          aria-describedby={validationErrors.message ? 'qi-message-error' : undefined}
          className={`resize-none ${validationErrors.message ? 'border-destructive ring-destructive/20' : 'border-gray-300'}`}
        />
        {validationErrors.message && (
          <p id="qi-message-error" className="text-xs text-destructive">{validationErrors.message}</p>
        )}
      </div>

      {/* 提交按钮 */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#212529] text-white hover:bg-[#212529]/90 font-semibold transition-all duration-200"
        size="sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('buttons.sending')}
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            {t('buttons.submit')}
          </>
        )}
      </Button>
    </form>
  );
}
