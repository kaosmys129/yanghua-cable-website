'use client';

import { useState } from 'react';
import { Send, Check, AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { sendForm } from '@/lib/network/FormRequest';

interface QuickInquiryProps {
  projectId: string;
  projectTitle: string;
  csrfToken?: string;
}

export default function QuickInquiry({ projectId, projectTitle, csrfToken }: QuickInquiryProps) {
  const t = useTranslations('inquiry');
  const locale = useLocale();

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // 清除对应字段的验证错误
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
    if (isSubmitting) return; // 防止重复提交

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    // 前端基础校验
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
        
        // 开发环境下输出调试信息
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
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-[#212529] rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-6 w-6 text-yellow-500" />
        </div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{t('success.title')}</h4>
        <p className="text-gray-800 mb-4">{t('success.description')}</p>
        {emailId && (
          <p className="text-sm text-gray-700 mb-4">
            {locale === 'en' ? 'Reference ID:' : 'ID de Referencia:'} {emailId.slice(0, 8)}...
          </p>
        )}
        <button onClick={() => setSubmitStatus('idle')} className="w-full bg-gray-900 text-white py-2 rounded-md font-semibold hover:bg-gray-800 transition-colors">
          {t('buttons.sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 全局错误消息 */}
      {submitStatus === 'error' && errorMessage && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
            <p className="text-red-600 text-xs mt-1">
              {locale === 'en' ? 'Please check your information and try again.' : 'Por favor verifique su información e inténtelo de nuevo.'}
            </p>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="qi-name" className="sr-only">{t('form.name')}</label>
        <input
          type="text"
          id="qi-name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white ${validationErrors.name ? 'border-red-500' : ''}`}
          placeholder={t('placeholders.name')}
          aria-describedby={validationErrors.name ? 'qi-name-error' : undefined}
        />
        {validationErrors.name && (
          <p id="qi-name-error" className="mt-1 text-xs text-red-700">{validationErrors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="qi-email" className="sr-only">{t('form.email')}</label>
        <input
          type="email"
          id="qi-email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white ${validationErrors.email ? 'border-red-500' : ''}`}
          placeholder={t('placeholders.email')}
          aria-describedby={validationErrors.email ? 'qi-email-error' : undefined}
        />
        {validationErrors.email && (
          <p id="qi-email-error" className="mt-1 text-xs text-red-700">{validationErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="qi-company" className="sr-only">{t('form.company')}</label>
        <input
          type="text"
          id="qi-company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white ${validationErrors.company ? 'border-red-500' : ''}`}
          placeholder={t('placeholders.company')}
          aria-describedby={validationErrors.company ? 'qi-company-error' : undefined}
        />
        {validationErrors.company && (
          <p id="qi-company-error" className="mt-1 text-xs text-red-700">{validationErrors.company}</p>
        )}
      </div>

      <div>
        <label htmlFor="qi-message" className="sr-only">{t('form.message')}</label>
        <textarea
          id="qi-message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={3}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white ${validationErrors.message ? 'border-red-500' : ''}`}
          placeholder={t('placeholders.message')}
          aria-describedby={validationErrors.message ? 'qi-message-error' : undefined}
        />
        {validationErrors.message && (
          <p id="qi-message-error" className="mt-1 text-xs text-red-700">{validationErrors.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gray-900 text-white py-2 rounded-md font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
            {t('buttons.sending')}
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4 inline-block" />
            {t('buttons.submit')}
          </>
        )}
      </button>

      <p className="text-sm text-gray-800 mt-2">{t('privacyNote')}</p>
    </form>
  );
}