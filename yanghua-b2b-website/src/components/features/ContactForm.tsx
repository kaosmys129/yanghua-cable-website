'use client';

import { useState, useEffect } from 'react';
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
      if (csrfToken) {
        requestHeaders['X-CSRF-Token'] = csrfToken;
      }

      const requestBody = {
        ...formData,
        type: 'contact',
        locale,
      };

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
          const errors: Record<string, string> = {};
          payloadErrors.forEach((error: string) => {
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

  // 成功状态
  if (submitStatus === 'success') {
    return (
      <Card className="bg-gradient-to-br from-brand-yellow/5 to-transparent border-brand-yellow/30">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-[#fdb827] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Check className="h-8 w-8 text-[#212529]" />
          </div>
          <CardTitle className="text-2xl mb-2 text-[#212529]">
            {t('success.title')}
          </CardTitle>
          <CardDescription className="text-base mb-4">
            {t('success.description')}
          </CardDescription>
          {emailId && (
            <p className="text-sm text-muted-foreground mb-8">
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
      </Card>
    );
  }

  return (
    <div className={`${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      <Card className="shadow-md border-gray-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-[#212529]">{t('title')}</CardTitle>
          <CardDescription className="text-sm">{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 全局错误消息 */}
            {submitStatus === 'error' && errorMessage && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{errorMessage}</p>
                  <p className="text-xs mt-1 opacity-80">
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
                <Label htmlFor="name" className="text-[#212529]">
                  {t('form.name')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('placeholders.name')}
                  aria-describedby={validationErrors.name ? 'name-error' : undefined}
                  className={validationErrors.name ? 'border-destructive ring-destructive/20' : ''}
                />
                {validationErrors.name && (
                  <p id="name-error" className="text-sm text-destructive">
                    {validationErrors.name}
                  </p>
                )}
              </div>

              {/* 邮箱字段 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#212529]">
                  {t('form.email')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('placeholders.email')}
                  aria-describedby={validationErrors.email ? 'email-error' : undefined}
                  className={validationErrors.email ? 'border-destructive ring-destructive/20' : ''}
                />
                {validationErrors.email && (
                  <p id="email-error" className="text-sm text-destructive">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* 公司字段 */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-[#212529]">
                  {t('form.company')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  id="company"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  placeholder={t('placeholders.company')}
                  aria-describedby={validationErrors.company ? 'company-error' : undefined}
                  className={validationErrors.company ? 'border-destructive ring-destructive/20' : ''}
                />
                {validationErrors.company && (
                  <p id="company-error" className="text-sm text-destructive">
                    {validationErrors.company}
                  </p>
                )}
              </div>

              {/* 国家字段 */}
              <div className="space-y-2">
                <Label htmlFor="country" className="text-[#212529]">
                  {t('form.country')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  id="country"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  placeholder={t('placeholders.country')}
                  aria-describedby={validationErrors.country ? 'country-error' : undefined}
                  className={validationErrors.country ? 'border-destructive ring-destructive/20' : ''}
                />
                {validationErrors.country && (
                  <p id="country-error" className="text-sm text-destructive">
                    {validationErrors.country}
                  </p>
                )}
              </div>

              {/* 电话字段 - 跨双列 */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="phone" className="text-[#212529]">
                  {t('form.phone')}
                </Label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t('placeholders.phone')}
                />
              </div>
            </div>

            <Separator />

            {/* 主题选择 */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-[#212529]">
                {t('form.subject')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.subject}
                onValueChange={(value) => handleSelectChange('subject', value)}
                name="subject"
                required
              >
                <SelectTrigger
                  id="subject"
                  className={validationErrors.subject ? 'border-destructive ring-destructive/20' : ''}
                  aria-describedby={validationErrors.subject ? 'subject-error' : undefined}
                >
                  <SelectValue placeholder={t('subjects.selectSubject')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product-inquiry">{t('subjects.productInquiry')}</SelectItem>
                  <SelectItem value="technical-support">{t('subjects.technicalSupport')}</SelectItem>
                  <SelectItem value="partnership">{t('subjects.partnership')}</SelectItem>
                  <SelectItem value="custom-solution">{t('subjects.customSolution')}</SelectItem>
                  <SelectItem value="other">{t('subjects.other')}</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.subject && (
                <p id="subject-error" className="text-sm text-destructive">
                  {validationErrors.subject}
                </p>
              )}
            </div>

            {/* 消息字段 */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-[#212529]">
                {t('form.message')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder={t('placeholders.message')}
                aria-describedby={validationErrors.message ? 'message-error' : undefined}
                className={`resize-vertical ${validationErrors.message ? 'border-destructive ring-destructive/20' : ''}`}
              />
              {validationErrors.message && (
                <p id="message-error" className="text-sm text-destructive">
                  {validationErrors.message}
                </p>
              )}
            </div>

            {/* 提交按钮 */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#fdb827] text-[#212529] hover:bg-[#fdb827]/90 font-semibold shadow-md transition-all duration-300 hover:shadow-lg"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('buttons.sending')}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  {t('buttons.submit')}
                </>
              )}
            </Button>

            {/* 隐私声明 */}
            <p className="text-xs text-muted-foreground text-center">
              {t('privacyNote')}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
