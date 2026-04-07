'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import type { Locale } from '@/lib/i18n';

type HeaderContent = {
  logo?: {
    textPrimary?: string;
    textAccent?: string;
  };
  navigation?: {
    items: Array<{ label: string; href: string }>;
    ctaLabel?: string;
  };
};

export default function Header({ content }: { content?: HeaderContent }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const locale = useLocale() as Locale;
  const navigation = content?.navigation?.items || [];
  const ctaLabel = content?.navigation?.ctaLabel || (locale === 'es' ? 'Solicitar Cotización' : 'Get Quote');
  const logoPrimary = content?.logo?.textPrimary || 'Yanghua';
  const logoAccent = content?.logo?.textAccent || 'STI';
  const homeHref = locale === 'es' ? '/es' : '/en';
  const contactHref = locale === 'es' ? '/es/contacto' : '/en/contact';

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href={homeHref} className="text-2xl font-bold text-[#212529]">
              {logoPrimary}<span className="text-[#fdb827]">{logoAccent}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[#212529] hover:text-[#fdb827] px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button and Language Switcher */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            <Link
              href={contactHref}
              className="btn-primary text-sm"
            >
              {ctaLabel}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-[#212529] hover:text-[#fdb827]"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[#212529] hover:text-[#fdb827] block px-3 py-2 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-2 space-y-3">
                <div className="flex justify-center mb-3">
                  <LanguageSwitcher />
                </div>
                <Link
                  href={contactHref}
                  className="btn-primary w-full text-center block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {ctaLabel}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
