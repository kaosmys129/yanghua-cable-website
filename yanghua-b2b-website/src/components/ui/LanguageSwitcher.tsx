'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { locales, type Locale } from '../../lib/i18n';

const languageNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español'
};

const languageFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸'
};

export default function LanguageSwitcher() {
  const t = useTranslations('navigation');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const switchLanguage = (newLocale: Locale) => {
    // Remove the current locale from the pathname
    const pathWithoutLocale = (pathname?.replace(`/${locale}`, '') ?? '/') as string;
    // Navigate to the new locale
    const newPath = newLocale === 'en' ? pathWithoutLocale : `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
        aria-label={t('language')}
      >
        <span className="text-lg">{languageFlags[locale]}</span>
        <span className="hidden sm:inline">{languageNames[locale]}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1" role="menu">
              {locales.map((lang) => (
                <button
                  key={lang}
                  onClick={() => switchLanguage(lang)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-3 ${
                    locale === lang ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                  role="menuitem"
                >
                  <span className="text-lg">{languageFlags[lang]}</span>
                  <span>{languageNames[lang]}</span>
                  {locale === lang && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}