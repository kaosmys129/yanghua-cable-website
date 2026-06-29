'use client';

import { useState } from 'react';
import { Send, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { sendForm } from '@/lib/network/FormRequest';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const clearFieldError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
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
          const errors: Record<string, string> = {};
          payloadErrors.forEach((error: string) => {
            if (error.includes('Name')) errors.name = error;
            else if (error.includes('Email')) errors.email = error;
            else if (error.includes('Company')) errors.company = error;
            else if (error.includes('Message')) errors.message = error;
          });
          setValidationErrors(errors);
        } else {
          if (process.env.NODE_ENV === 'development' && errorPayload?.debug) {
            console.error('API debug info:', errorPayload.debug);
          }
          setErrorMessage(errorPayload?.message || t('errors.submitFailed'));
        }
      }
    } catch (error) {
      console.error('Inquiry form submission error:', error);
      setSubmitStatus('error');
      
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
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('title')}
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          <Card className="bg-[#2c3034] border-[#495057] shadow-xl">
            {submitStatus === 'success' ? (
              <CardContent className="text-center py-16">
                <div className="w-16 h-16 bg-[#fdb827] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#fdb827]/20">
                  <Check className="h-8 w-8 text-[#212529]" />
                </div>
                <CardTitle className="text-2xl mb-2 text-white">{t('success.title')}</CardTitle>
                <CardDescription className="text-base text-gray-300 mb-4">
                  {t('success.description')}
                </CardDescription>
                {emailId && (
                  <p className="text-sm text-gray-400 mb-8">
                    {locale === 'en' ? 'Reference ID:' : 'ID de Referencia:'} {emailId.slice(0, 8)}...
                  </p>
                )}
                <Button
                  onClick={() => setSubmitStatus('idle')}
                  className="bg-[#fdb827] text-[#212529] hover:bg-[#fdb827]/90 px-8 py-3 font-semibold shadow-md"
                  size="lg"
                >
                  {t('buttons.sendAnother')}
                </Button>
              </CardContent>
            ) : (
              <>
                <CardContent className="p-8 md:p-12">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 全局错误消息 */}
                    {submitStatus === 'error' && errorMessage && (
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-red-950/50 border border-red-800 text-red-300">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{errorMessage}</p>
                          <p className="text-xs mt-1 text-red-400">
                            {locale === 'en' 
                              ? 'Please check your information and try again.'
                              : 'Por favor verifique su información e inténtelo de nuevo.'
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* 姓名字段 */}
                      <div className="space-y-2">
                        <Label htmlFor="inquiry-name" className="text-gray-200">
                          {t('form.name')} <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          type="text"
                          id="inquiry-name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder={t('placeholders.name')}
                          aria-describedby={validationErrors.name ? 'inquiry-name-error' : undefined}
                          className={`bg-[#343a40] border-[#495057] text-white placeholder:text-gray-500 focus-visible:ring-[#fdb827] focus-visible:border-[#fdb827] ${validationErrors.name ? 'border-red-500 ring-red-500/20' : ''}`}
                        />
                        {validationErrors.name && (
                          <p id="inquiry-name-error" className="text-sm text-red-400">
                            {validationErrors.name}
                          </p>
                        )}
                      </div>

                      {/* 邮箱字段 */}
                      <div className="space-y-2">
                        <Label htmlFor="inquiry-email" className="text-gray-200">
                          {t('form.email')} <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          type="email"
                          id="inquiry-email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder={t('placeholders.email')}
                          aria-describedby={validationErrors.email ? 'inquiry-email-error' : undefined}
                          className={`bg-[#343a40] border-[#495057] text-white placeholder:text-gray-500 focus-visible:ring-[#fdb827] focus-visible:border-[#fdb827] ${validationErrors.email ? 'border-red-500 ring-red-500/20' : ''}`}
                        />
                        {validationErrors.email && (
                          <p id="inquiry-email-error" className="text-sm text-red-400">
                            {validationErrors.email}
                          </p>
                        )}
                      </div>

                      {/* 公司字段 */}
                      <div className="space-y-2">
                        <Label htmlFor="inquiry-company" className="text-gray-200">
                          {t('form.company')} <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          type="text"
                          id="inquiry-company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          required
                          placeholder={t('placeholders.company')}
                          aria-describedby={validationErrors.company ? 'inquiry-company-error' : undefined}
                          className={`bg-[#343a40] border-[#495057] text-white placeholder:text-gray-500 focus-visible:ring-[#fdb827] focus-visible:border-[#fdb827] ${validationErrors.company ? 'border-red-500 ring-red-500/20' : ''}`}
                        />
                        {validationErrors.company && (
                          <p id="inquiry-company-error" className="text-sm text-red-400">
                            {validationErrors.company}
                          </p>
                        )}
                      </div>

                      {/* 产品兴趣 */}
                      <div className="space-y-2">
                        <Label htmlFor="inquiry-productInterest" className="text-gray-200">
                          {t('form.productInterest')}
                        </Label>
                        <Select
                          value={formData.productInterest}
                          onValueChange={(value) => handleSelectChange('productInterest', value)}
                          name="productInterest"
                        >
                          <SelectTrigger
                            id="inquiry-productInterest"
                            className="bg-[#343a40] border-[#495057] text-white focus-visible:ring-[#fdb827] focus-visible:border-[#fdb827]"
                          >
                            <SelectValue placeholder={t('placeholders.selectCategory')} />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2c3034] border-[#495057]">
                            <SelectItem value="Flexible Busbar">{t('options.flexibleBusbar')}</SelectItem>
                            <SelectItem value="Busbar Connector">{t('options.busbarConnector')}</SelectItem>
                            <SelectItem value="Custom Solutions">{t('options.customSolutions')}</SelectItem>
                            <SelectItem value="Other">{t('options.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator className="bg-[#495057]" />

                    {/* 消息字段 */}
                    <div className="space-y-2">
                      <Label htmlFor="inquiry-message" className="text-gray-200">
                        {t('form.message')} <span className="text-red-400">*</span>
                      </Label>
                      <Textarea
                        id="inquiry-message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder={t('placeholders.message')}
                        aria-describedby={validationErrors.message ? 'inquiry-message-error' : undefined}
                        className={`resize-vertical bg-[#343a40] border-[#495057] text-white placeholder:text-gray-500 focus-visible:ring-[#fdb827] focus-visible:border-[#fdb827] ${validationErrors.message ? 'border-red-500 ring-red-500/20' : ''}`}
                      />
                      {validationErrors.message && (
                        <p id="inquiry-message-error" className="text-sm text-red-400">
                          {validationErrors.message}
                        </p>
                      )}
                    </div>

                    {/* 提交按钮 */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#fdb827] text-[#212529] hover:bg-[#fdb827]/90 font-semibold shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-[#fdb827]/20 px-8"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {t('buttons.submitting')}
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            {t('buttons.submit')}
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <p className="text-sm text-gray-400 mt-2">
                      {t('privacyNote')}
                    </p>
                  </form>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
