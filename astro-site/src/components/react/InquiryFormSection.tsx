import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Send, Shield } from 'lucide-react';

interface FormOption {
  label: string;
  value?: string;
}

interface InquiryFormSectionProps {
  content?: {
    title?: string;
    subtitle?: string;
    privacyNote?: string;
    form?: {
      name?: string;
      email?: string;
      company?: string;
      productInterest?: string;
      message?: string;
    };
    placeholders?: {
      name?: string;
      email?: string;
      company?: string;
      message?: string;
      selectCategory?: string;
    };
    options?: Record<string, FormOption>;
    buttons?: {
      submit?: string;
    };
  };
  locale?: string;
}

export default function InquiryFormSection({
  content = {},
  locale = 'en',
}: InquiryFormSectionProps) {
  const form = (content as any).form ?? {};
  const placeholders = (content as any).placeholders ?? {};
  const options = Object.values((content as any).options ?? {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/csrf', { method: 'GET', credentials: 'include' }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');
    setStatusType('idle');
    try {
      const formData = new FormData(e.currentTarget);
      const payload = Object.fromEntries(formData.entries());
      const response = await fetch('/api/email/send', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale,
        },
        body: JSON.stringify({
          ...payload,
          type: 'inquiry',
          locale,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result?.success) {
        e.currentTarget.reset();
        setStatusType('success');
        setStatusMessage(
          locale === 'es'
            ? 'Solicitud enviada con éxito.'
            : locale === 'pt'
              ? 'Consulta enviada com sucesso.'
              : 'Inquiry sent successfully.',
        );
        const eventPayload = {
          event: 'generate_lead',
          form_name: 'homepage_inquiry',
          language: locale,
        };
        (window as any).dataLayer?.push?.(eventPayload);
        (window as any).gtag?.('event', 'generate_lead', eventPayload);
      } else {
        setStatusType('error');
        setStatusMessage(
          result?.message ||
            result?.error ||
            (locale === 'es' ? 'Error al enviar.' : locale === 'pt' ? 'Falha ao enviar.' : 'Failed to submit.'),
        );
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setStatusType('error');
      setStatusMessage(
        locale === 'es'
          ? 'Error de red. Inténtalo de nuevo más tarde.'
          : locale === 'pt'
            ? 'Erro de rede. Tente novamente mais tarde.'
            : 'Network error. Please try again later.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-surface py-section">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14">
        {/* Left Info */}
        <div className="lg:col-span-5">
          <span className="text-topper font-bold uppercase tracking-widest text-[hsl(var(--accent-shadcn))]">
            Inquiry
          </span>
          <h2 className="mt-2 font-heading text-h2 font-bold uppercase text-text">
            {(content as any).title || 'Contact Us'}
          </h2>
          <p className="mt-4 text-text-muted leading-relaxed">
            {(content as any).subtitle || 'Tell us about your project and we\'ll get back to you with a tailored solution.'}
          </p>

          {/* Privacy Badge */}
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-background p-4">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--accent-shadcn))]" />
            <p className="text-sm text-text-muted">
              {(content as any).privacyNote || 'Your information is secure and will only be used to respond to your inquiry.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="lg:col-span-7 border-border bg-background shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{form.name || 'Name'}</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder={placeholders.name || 'Your name'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{form.email || 'Email'}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder={placeholders.email || 'your@email.com'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">{form.company || 'Company'}</Label>
                  <Input
                    id="company"
                    name="company"
                    placeholder={placeholders.company || 'Your company'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productInterest">{form.productInterest || 'Product Interest'}</Label>
                  <select
                    id="productInterest"
                    name="productInterest"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">{placeholders.selectCategory || 'Select a category'}</option>
                    {options.map((option: any, i: number) => (
                      <option key={i} value={typeof option === 'string' ? option : option.value}>
                        {typeof option === 'string' ? option : option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{form.message || 'Message'}</Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  placeholder={placeholders.message || 'Tell us about your requirements...'}
                  className="min-h-[150px]"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="min-h-[44px] bg-[hsl(var(--accent-shadcn))] font-bold text-[hsl(var(--accent-shadcn-foreground))] hover:bg-[hsl(var(--accent-shadcn))]/90"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-4 w-4" />
                    {(content as any).buttons?.submit || 'Send Inquiry'}
                  </>
                )}
              </Button>
              {statusMessage && (
                <p
                  className={`rounded-md border px-4 py-3 text-sm ${
                    statusType === 'success'
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : 'border-red-200 bg-red-50 text-red-800'
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {statusMessage}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
