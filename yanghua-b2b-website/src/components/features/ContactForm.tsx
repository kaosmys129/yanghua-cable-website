'use client';

import { useState, useEffect } from 'react';
import { Send, Check, AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { sendForm } from '@/lib/network/FormRequest';

export default function ContactForm({ csrfToken }: { csrfToken?: string }) {
  const t = useTranslations('inquiry');
  const locale = useLocale();
  
  // 若没有服务端传入的 CSRF token，则在挂载时请求 /api/csrf 以设置 HttpOnly cookie
  useEffect(() => {
    async function ensureCsrfCookie() {
      try {
        if (!csrfToken) {
          await fetch('/api/csrf', { method: 'GET', credentials: 'include' });
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[ContactForm] Failed to initialize CSRF cookie:', err);
        }
      }
    }
    ensureCsrfCookie();
  }, [csrfToken]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    country: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [emailId, setEmailId] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    setValidationErrors({});
    
    try {
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept-Language': locale,
      };
      // 若服务端提供了 CSRF 令牌，则一并发送（cookie 也会作为备用被浏览器自动附带）
      if (csrfToken) {
        requestHeaders['X-CSRF-Token'] = csrfToken;
      }

      const requestBody = {
        ...formData,
        type: 'contact',
        locale,
      };

      // 调试日志（开发环境）
      if (process.env.NODE_ENV === 'development') {
        console.log('Submitting contact with:', {
          url: '/api/email/send',
          method: 'POST',
          headers: requestHeaders,
          body: requestBody,
        });
      }

      const result = await sendForm('/api/email/send', requestBody, {
        csrfToken,
        locale,
        method: 'POST',
      });

      if (result.ok && result.data?.success) {
        setSubmitStatus('success');
        setEmailId(result.data.emailId);
        // 重置表单
        setFormData({
          name: '',
          email: '',
          company: '',
          country: '',
          phone: '',
          subject: '',
          message: '',
        });
      } else {
        setSubmitStatus('error');
        const errorPayload = result.error;
        const payloadErrors = (errorPayload?.errors || []);
        if (Array.isArray(payloadErrors) && payloadErrors.length > 0) {
          // 处理验证错误
          const errors: Record<string, string> = {};
          payloadErrors.forEach((error: string) => {
            // 简单的错误映射，实际项目中可能需要更复杂的逻辑
            if (error.includes('Name')) errors.name = error;
            else if (error.includes('Email')) errors.email = error;
            else if (error.includes('Company')) errors.company = error;
            else if (error.includes('Country')) errors.country = error;
            else if (error.includes('Subject')) errors.subject = error;
            else if (error.includes('Message')) errors.message = error;
          });
          setValidationErrors(errors);
        } else {
          setErrorMessage(errorPayload?.message || t('errors.submitFailed'));
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
      setErrorMessage(t('errors.networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // 清除对应字段的验证错误
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 成功状态显示
  if (submitStatus === 'success') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[#fdb827] rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8 text-[#212529]" />
        </div>
        <h3 className="text-2xl font-bold mb-4 text-[#212529]">
          {t('success.title')}
        </h3>
        <p className="text-gray-600 mb-4">
          {t('success.description')}
        </p>
        {emailId && (
          <p className="text-sm text-gray-500 mb-8">
            {locale === 'en' ? 'Reference ID:' : 'ID de Referencia:'} {emailId.slice(0, 8)}...
          </p>
        )}
        <button
          onClick={() => setSubmitStatus('idle')}
          className="btn-primary px-8 py-3"
        >
          {t('buttons.sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <div className={`${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 全局错误消息 */}
        {submitStatus === 'error' && errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-red-600 text-sm font-medium">{errorMessage}</p>
              <p className="text-red-500 text-xs mt-1">
                {locale === 'en' 
                  ? 'Please check your information and try again.'
                  : 'Por favor verifique su información e inténtelo de nuevo.'
                }
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 姓名字段 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#212529] mb-2">
              {t('form.name')} *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:border-[#fdb827] focus:outline-none transition-colors ${
                validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={t('placeholders.name')}
              aria-describedby={validationErrors.name ? 'name-error' : undefined}
            />
            {validationErrors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600">
                {validationErrors.name}
              </p>
            )}
          </div>

          {/* 邮箱字段 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#212529] mb-2">
              {t('form.email')} *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:border-[#fdb827] focus:outline-none transition-colors ${
                validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={t('placeholders.email')}
              aria-describedby={validationErrors.email ? 'email-error' : undefined}
            />
            {validationErrors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600">
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* 公司字段 */}
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-[#212529] mb-2">
              {t('form.company')} *
            </label>
            <input
              type="text"
              id="company"
              name="company"
              required
              value={formData.company}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:border-[#fdb827] focus:outline-none transition-colors ${
                validationErrors.company ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={t('placeholders.company')}
              aria-describedby={validationErrors.company ? 'company-error' : undefined}
            />
            {validationErrors.company && (
              <p id="company-error" className="mt-1 text-sm text-red-600">
                {validationErrors.company}
              </p>
            )}
          </div>

          {/* 国家字段 */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-[#212529] mb-2">
              {t('form.country')} *
            </label>
            <input
              type="text"
              id="country"
              name="country"
              required
              value={formData.country}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:border-[#fdb827] focus:outline-none transition-colors ${
                validationErrors.country ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={t('placeholders.country')}
              aria-describedby={validationErrors.country ? 'country-error' : undefined}
            />
            {validationErrors.country && (
              <p id="country-error" className="mt-1 text-sm text-red-600">
                {validationErrors.country}
              </p>
            )}
          </div>

          {/* 电话字段 */}
          <div className="md:col-span-2">
            <label htmlFor="phone" className="block text-sm font-medium text-[#212529] mb-2">
              {t('form.phone')}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#fdb827] focus:outline-none transition-colors"
              placeholder={t('placeholders.phone')}
            />
          </div>
        </div>

        {/* 主题字段 */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-[#212529] mb-2">
            {t('form.subject')} *
          </label>
          <select
            id="subject"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md focus:border-[#fdb827] focus:outline-none transition-colors ${
              validationErrors.subject ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            aria-describedby={validationErrors.subject ? 'subject-error' : undefined}
          >
            <option value="">{t('subjects.selectSubject')}</option>
            <option value="product-inquiry">{t('subjects.productInquiry')}</option>
            <option value="technical-support">{t('subjects.technicalSupport')}</option>
            <option value="partnership">{t('subjects.partnership')}</option>
            <option value="custom-solution">{t('subjects.customSolution')}</option>
            <option value="other">{t('subjects.other')}</option>
          </select>
          {validationErrors.subject && (
            <p id="subject-error" className="mt-1 text-sm text-red-600">
              {validationErrors.subject}
            </p>
          )}
        </div>

        {/* 消息字段 */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-[#212529] mb-2">
            {t('form.message')} *
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={formData.message}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md focus:border-[#fdb827] focus:outline-none transition-colors resize-vertical ${
              validationErrors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder={t('placeholders.message')}
            aria-describedby={validationErrors.message ? 'message-error' : undefined}
          />
          {validationErrors.message && (
            <p id="message-error" className="mt-1 text-sm text-red-600">
              {validationErrors.message}
            </p>
          )}
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary flex items-center justify-center py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#212529] mr-2"></div>
              {t('buttons.sending')}
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              {t('buttons.submit')}
            </>
          )}
        </button>

        {/* 隐私声明 */}
         <p className="text-xs text-gray-500 text-center">
           {t('privacyNote')}
         </p>
       </form>
     </div>
   );
 }