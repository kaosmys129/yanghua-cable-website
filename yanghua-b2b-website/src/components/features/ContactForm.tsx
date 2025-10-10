'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ContactForm() {
  const t = useTranslations('contact');
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Contact form submitted:', formData);
    alert(t('form.messages.success'));
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      company: '',
      country: '',
      phone: '',
      subject: '',
      message: '',
    });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#212529] mb-2">
            {t('form.labels.name')} *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#fdb827] focus:outline-none"
            placeholder={t('form.placeholders.name')}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#212529] mb-2">
            {t('form.labels.email')} *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#fdb827] focus:outline-none"
            placeholder={t('form.placeholders.email')}
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-[#212529] mb-2">
            {t('form.labels.company')} *
          </label>
          <input
            type="text"
            id="company"
            name="company"
            required
            value={formData.company}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#fdb827] focus:outline-none"
            placeholder={t('form.placeholders.company')}
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-[#212529] mb-2">
            {t('form.labels.country')} *
          </label>
          <input
            type="text"
            id="country"
            name="country"
            required
            value={formData.country}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#fdb827] focus:outline-none"
            placeholder={t('form.placeholders.country')}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="phone" className="block text-sm font-medium text-[#212529] mb-2">
            {t('form.labels.phone')}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#fdb827] focus:outline-none"
            placeholder={t('form.placeholders.phone')}
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-[#212529] mb-2">
          {t('form.labels.subject')} *
        </label>
        <select
          id="subject"
          name="subject"
          required
          value={formData.subject}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#fdb827] focus:outline-none"
        >
          <option value="">{t('form.subjects.selectSubject')}</option>
          <option value="product-inquiry">{t('form.subjects.productInquiry')}</option>
          <option value="technical-support">{t('form.subjects.technicalSupport')}</option>
          <option value="partnership">{t('form.subjects.partnership')}</option>
          <option value="custom-solution">{t('form.subjects.customSolution')}</option>
          <option value="other">{t('form.subjects.other')}</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-[#212529] mb-2">
          {t('form.labels.message')} *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          value={formData.message}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-[#fdb827] focus:outline-none"
          placeholder={t('form.placeholders.message')}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full btn-primary flex items-center justify-center py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#212529] mr-2"></div>
            {t('form.buttons.sending')}
          </>
        ) : (
          <>
            <Send className="mr-2 h-5 w-5" />
            {t('form.buttons.submit')}
          </>
        )}
      </button>
    </form>
  );
}