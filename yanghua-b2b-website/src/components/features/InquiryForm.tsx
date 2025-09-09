'use client';

import { useState } from 'react';
import { Send, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function InquiryForm() {
  const t = useTranslations('inquiry');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    productInterest: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        company: '',
        productInterest: '',
        message: '',
      });
    } catch (error) {
      setSubmitStatus('error');
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
                <p className="text-gray-300 mb-8">
                  {t('success.description')}
                </p>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="btn-primary px-8 py-3"
                >
                  {t('buttons.sendAnother')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="w-full px-4 py-3 bg-[#343a40] border border-[#495057] rounded-lg focus:ring-2 focus:ring-[#fdb827] focus:border-[#fdb827] outline-none transition"
                      placeholder={t('placeholders.name')}
                    />
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
                      className="w-full px-4 py-3 bg-[#343a40] border border-[#495057] rounded-lg focus:ring-2 focus:ring-[#fdb827] focus:border-[#fdb827] outline-none transition"
                      placeholder={t('placeholders.email')}
                    />
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
                      className="w-full px-4 py-3 bg-[#343a40] border border-[#495057] rounded-lg focus:ring-2 focus:ring-[#fdb827] focus:border-[#fdb827] outline-none transition"
                      placeholder={t('placeholders.company')}
                    />
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
                    className="w-full px-4 py-3 bg-[#343a40] border border-[#495057] rounded-lg focus:ring-2 focus:ring-[#fdb827] focus:border-[#fdb827] outline-none transition"
                    placeholder={t('placeholders.message')}
                  ></textarea>
                </div>

                <div className="flex items-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t('buttons.submitting') : t('buttons.submit')}
                  </button>
                  
                  {submitStatus === 'error' && (
                    <p className="ml-4 text-red-400">{t('errors.submitFailed')}</p>
                  )}
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