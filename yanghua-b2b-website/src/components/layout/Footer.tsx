'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, ChevronRight } from 'lucide-react';

type FooterLink = { label: string; href: string };
type FooterSection = { title: string; items: FooterLink[] };
type FooterContent = {
  logo?: {
    textPrimary?: string;
    textAccent?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  footer?: {
    description?: string;
    copyright?: string;
    links?: {
      privacy?: FooterLink;
      terms?: FooterLink;
    };
    sections?: {
      products?: FooterSection;
      solutions?: FooterSection;
      support?: FooterSection;
    };
  };
};

export default function Footer({ content }: { content?: FooterContent }) {
  const logoPrimary = content?.logo?.textPrimary || 'Yanghua';
  const logoAccent = content?.logo?.textAccent || 'STI';
  const description = content?.footer?.description || '';
  const address = content?.contact?.address || '';
  const phone = content?.contact?.phone || '';
  const email = content?.contact?.email || '';
  const productSection = content?.footer?.sections?.products;
  const solutionSection = content?.footer?.sections?.solutions;
  const supportSection = content?.footer?.sections?.support;
  const privacyLink = content?.footer?.links?.privacy;
  const termsLink = content?.footer?.links?.terms;
  const copyright = (content?.footer?.copyright || '© {year} Yanghua Cable. All rights reserved.').replace(
    '{year}',
    String(new Date().getFullYear())
  );

  return (
    <footer className="bg-[#212529] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              {logoPrimary}<span className="text-[#fdb827]">{logoAccent}</span>
            </h3>
            <p className="text-gray-300 mb-4">{description}</p>
            <div className="space-y-2">
              <div className="flex items-center">
                <Phone size={16} className="mr-2 text-[#fdb827]" />
                <span className="text-sm">{phone}</span>
              </div>
              <div className="flex items-center">
                <Mail size={16} className="mr-2 text-[#fdb827]" />
                <span className="text-sm">{email}</span>
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-2 text-[#fdb827]" />
                <span className="text-sm">{address}</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{productSection?.title}</h4>
            <ul className="space-y-2">
              {(productSection?.items || []).map((link, index) => (
                <li key={`${link.label}-${index}`}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-[#fdb827] text-sm flex items-center"
                  >
                    <ChevronRight size={14} className="mr-1" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{solutionSection?.title}</h4>
            <ul className="space-y-2">
              {(solutionSection?.items || []).map((link, index) => (
                <li key={`${link.label}-${index}`}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-[#fdb827] text-sm flex items-center"
                  >
                    <ChevronRight size={14} className="mr-1" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{supportSection?.title}</h4>
            <ul className="space-y-2">
              {(supportSection?.items || []).map((link, index) => (
                <li key={`${link.label}-${index}`}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-[#fdb827] text-sm flex items-center"
                  >
                    <ChevronRight size={14} className="mr-1" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">{copyright}</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {privacyLink ? (
                <Link href={privacyLink.href} className="text-gray-300 hover:text-[#fdb827] text-sm">
                  {privacyLink.label}
                </Link>
              ) : null}
              {termsLink ? (
                <Link href={termsLink.href} className="text-gray-300 hover:text-[#fdb827] text-sm">
                  {termsLink.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
