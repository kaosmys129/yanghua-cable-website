'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { buildLocalizedUrl } from '@/lib/url-localization';
import type { Locale } from '@/lib/i18n';

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  // Get products from translation data
  const getProductCategories = () => {
    try {
      const categories = t.raw('products.categories');
      return Array.isArray(categories) ? categories.slice(0, 4) : [];
    } catch (error) {
      console.error('Error loading product categories:', error);
      return [];
    }
  };

  // Get solutions from translation data
  const getSolutions = () => {
    try {
      const solutions = t.raw('solutions.solutions');
      return Array.isArray(solutions) ? solutions.slice(0, 4) : [];
    } catch (error) {
      console.error('Error loading solutions:', error);
      return [];
    }
  };

  const productCategories = getProductCategories();
  const solutions = getSolutions();

  // Get services from translation data
  const getServices = () => {
    try {
      const services = t.raw('services.services');
      return Array.isArray(services) ? services.slice(0, 4) : [];
    } catch (error) {
      console.error('Error loading services:', error);
      return [
        { title: t('services.technicalSupport.title', { defaultValue: 'Technical Support' }) },
        { title: t('services.installationGuide.title', { defaultValue: 'Installation Guide' }) },
        { title: t('services.afterSalesService.title', { defaultValue: 'After-sales Service' }) },
        { title: t('services.downloadCenter.title', { defaultValue: 'Downloads' }) }
      ];
    }
  };

  const services = getServices();

  const footerLinks = {
    products: productCategories.map(category => ({
      name: category.name,
      href: buildLocalizedUrl('products', locale, { category: category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-') })
    })),
    solutions: solutions.map(solution => ({
      name: solution.title,
      href: buildLocalizedUrl('solutions', locale, { id: solution.id })
    })),
    support: services.map(service => ({
      name: service.title,
      href: buildLocalizedUrl('services', locale)
    })),
  };
  return (
    <footer className="bg-[#212529] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              Yanghua<span className="text-[#fdb827]">STI</span>
            </h3>
            <p className="text-gray-300 mb-4">
              {t('footer.company.description', { 
                defaultValue: 'Leading manufacturer of high-quality flexible busbar solutions for global industries. Trusted by 500+ companies worldwide.' 
              })}
            </p>
            <div className="space-y-2">
              <div className="flex items-center">
                <Phone size={16} className="mr-2 text-[#fdb827]" />
                <span className="text-sm">+86 193 5995 3105</span>
              </div>
              <div className="flex items-center">
                <Mail size={16} className="mr-2 text-[#fdb827]" />
                <span className="text-sm">info@yhflexiblebusbar.com</span>
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-2 text-[#fdb827]" />
                <span className="text-sm">
                  {t('footer.company.address', { defaultValue: 'Shenzhen, Guangdong, China' })}
                </span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('navigation.products')}</h4>
            <ul className="space-y-2">
              {footerLinks.products.map((link, index) => (
                <li key={`${link.name}-${index}`}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-[#fdb827] text-sm flex items-center"
                  >
                    <ChevronRight size={14} className="mr-1" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('navigation.solutions')}</h4>
            <ul className="space-y-2">
              {footerLinks.solutions.map((link, index) => (
                <li key={`${link.name}-${index}`}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-[#fdb827] text-sm flex items-center"
                  >
                    <ChevronRight size={14} className="mr-1" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.support.title', { defaultValue: 'Support' })}</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={`${link.name}-${index}`}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-[#fdb827] text-sm flex items-center"
                  >
                    <ChevronRight size={14} className="mr-1" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              {t('footer.copyright', { 
                defaultValue: '© 2024 YanghuaSTI. All rights reserved.',
                year: new Date().getFullYear()
              })}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href={buildLocalizedUrl('privacy', locale)} className="text-gray-300 hover:text-[#fdb827] text-sm">
                {t('footer.links.privacy', { defaultValue: 'Privacy Policy' })}
              </Link>
              <Link href={buildLocalizedUrl('terms', locale)} className="text-gray-300 hover:text-[#fdb827] text-sm">
                {t('footer.links.terms', { defaultValue: 'Terms of Service' })}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}