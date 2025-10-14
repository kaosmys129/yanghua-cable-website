'use client';

import { useState } from 'react';
import { Send, Check, AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { sendForm } from '@/lib/network/FormRequest';

export default function InquiryForm({ csrfToken }: { csrfToken: string }) {
  const t = useTranslations('inquiry');
  const locale = useLocale();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    productInterest: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [emailId, setEmailId] = useState<string>('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
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
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    setValidationErrors({});

    try {
      const requestBody = {
        ...formData,
        type: 'inquiry',
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
        setFormData({
          name: '',
          email: '',
          company: '',
          productInterest: '',
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
            if (error.includes('Name')) errors.name = error;
            else if (error.includes('Email')) errors.email = error;
            else if (error.includes('Company')) errors.company = error;
            else if (error.includes('Message')) errors.message = error;
          });
          setValidationErrors(errors);
        } else {
          // 如果后端返回了调试信息，开发模式下记录出来
          if (process.env.NODE_ENV === 'development' && errorPayload?.debug) {
            console.error('API debug info:', errorPayload.debug);
          }
          setErrorMessage(errorPayload?.message || t('errors.submitFailed'));
        }
      }
    } catch (error) {
      console.error('Inquiry form submission error:', error);
      setSubmitStatus('error');
      
      // 更详细的错误处理
      let errorMsg = locale === 'en' 
        ? 'Network error. Please check your connection and try again.'
        : 'Error de red. Por favor verifique su conexión e inténtelo de nuevo.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMsg = locale === 'en'
          ? 'Unable to connect to server. Please check your internet connection.'
          : 'No se puede conectar al servidor. Por favor verifique su conexión a internet.';
      } else if (error instanceof SyntaxError) {
        errorMsg = locale === 'en'
          ? 'Server response error. Please try again or contact support.'
          : 'Error de respuesta del servidor. Por favor inténtelo de nuevo o contacte soporte.';
        
        // 在开发环境下显示更多信息
        if (process.env.NODE_ENV === 'development') {
          console.error('SyntaxError details:', {
            message: error.message,
            stack: error.stack,
            formData: formData
          });
        }
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-[#212529] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('title')}
            </h2>
            <p className="text-xl text-gray-300">
              {t('subtitle')}
            </p>
          </div>

          <div className="bg-[#2c3034] rounded-lg p-8 md:p-12">
            {submitStatus === 'success' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#fdb827] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-8 w-8 text-[#212529]" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{t('success.title')}</h3>
                <p className="text-gray-300 mb-4">
                  {t('success.description')}
                </p>
                {emailId && (
                  <p className="text-sm text-gray-400 mb-8">
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
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 全局错误消息 */}
                {submitStatus === 'error' && errorMessage && (
                  <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-300 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-red-300 text-sm font-medium">{errorMessage}</p>
                      <p className="text-red-400 text-xs mt-1">
                        {locale === 'en' 
                          ? 'Please check your information and try again.'
                          : 'Por favor verifique su información e inténtelo de nuevo.'
                        }
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      {t('form.name')} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 bg-[#343a40] border rounded-lg focus:ring-2 focus:ring-[#fdb827] focus:border-[#fdb827] outline-none transition ${
                        validationErrors.name ? 'border-red-500 bg-red-900/20' : 'border-[#495057]'
                      }`}
                      placeholder={t('placeholders.name')}
                      aria-describedby={validationErrors.name ? 'name-error' : undefined}
                    />
                    {validationErrors.name && (
                      <p id="name-error" className="mt-1 text-sm text-red-400">
                        {validationErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      {t('form.email')} *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 bg-[#343a40] border rounded-lg focus:ring-2 focus:ring-[#fdb827] focus:border-[#fdb827] outline-none transition ${
                        validationErrors.email ? 'border-red-500 bg-red-900/20' : 'border-[#495057]'
                      }`}
                      placeholder={t('placeholders.email')}
                      aria-describedby={validationErrors.email ? 'email-error' : undefined}
                    />
                    {validationErrors.email && (
                      <p id="email-error" className="mt-1 text-sm text-red-400">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium mb-2">
                      {t('form.company')} *
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 bg-[#343a40] border rounded-lg focus:ring-2 focus:ring-[#fdb827] focus:border-[#fdb827] outline-none transition ${
                        validationErrors.company ? 'border-red-500 bg-red-900/20' : 'border-[#495057]'
                      }`}
                      placeholder={t('placeholders.company')}
                      aria-describedby={validationErrors.company ? 'company-error' : undefined}
                    />
                    {validationErrors.company && (
                      <p id="company-error" className="mt-1 text-sm text-red-400">
                        {validationErrors.company}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="productInterest" className="block text-sm font-medium mb-2">
                      {t('form.productInterest')}
                    </label>
                    <select
                      id="productInterest"
                      name="productInterest"
                      value={formData.productInterest}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#343a40] border border-[#495057] rounded-lg focus:ring-2 focus:ring-[#fdb827] focus:border-[#fdb827] outline-none transition"
                    >
                      <option value="">{t('placeholders.selectCategory')}</option>
                      <option value="Flexible Busbar">{t('options.flexibleBusbar')}</option>
                      <option value="Busbar Connector">{t('options.busbarConnector')}</option>
                      <option value="Custom Solutions">{t('options.customSolutions')}</option>
                      <option value="Other">{t('options.other')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    {t('form.message')} *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className={`w-full px-4 py-3 bg-[#343a40] border rounded-lg focus:ring-2 focus:ring-[#fdb827] focus:border-[#fdb827] outline-none transition resize-vertical ${
                      validationErrors.message ? 'border-red-500 bg-red-900/20' : 'border-[#495057]'
                    }`}
                    placeholder={t('placeholders.message')}
                    aria-describedby={validationErrors.message ? 'message-error' : undefined}
                  ></textarea>
                  {validationErrors.message && (
                    <p id="message-error" className="mt-1 text-sm text-red-400">
                      {validationErrors.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#212529] mr-2 inline-block"></div>
                        {t('buttons.submitting')}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5 inline-block" />
                        {t('buttons.submit')}
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-sm text-gray-400 mt-4">
                  {t('privacyNote')}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}