'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, ChevronRight } from 'lucide-react';

export default function Footer() {
  const footerLinks = {
    products: [
      { name: 'Flexible Busbar', href: '/products' },
      { name: 'Specifications', href: '/products/specs' },
      { name: 'Product Comparison', href: '/products/compare' },
      { name: 'Accessories', href: '/products/accessories' },
    ],
    solutions: [
      { name: 'New Energy', href: '/solutions/new-energy' },
      { name: 'Power Systems', href: '/solutions/power-systems' },
      { name: 'Industrial Applications', href: '/solutions/industrial' },
      { name: 'Data Center', href: '/solutions/data-center' },
    ],
    support: [
      { name: 'Technical Support', href: '/services/technical-support' },
      { name: 'Installation Guide', href: '/services/installation' },
      { name: 'After-sales Service', href: '/services/after-sales' },
      { name: 'Downloads', href: '/services/downloads' },
    ],
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
              Leading manufacturer of high-quality flexible busbar solutions for global industries. Trusted by 500+ companies worldwide.
            </p>
            <div className="space-y-2">
              <div className="flex items-center">
                <Phone size={16} className="mr-2 text-[#fdb827]" />
                <span className="text-sm">+86 138 0013 8000</span>
              </div>
              <div className="flex items-center">
                <Mail size={16} className="mr-2 text-[#fdb827]" />
                <span className="text-sm">info@yanghuasti.com</span>
              </div>
              <div className="flex items-center">
                <MapPin size={16} className="mr-2 text-[#fdb827]" />
                <span className="text-sm">Dongguan, Guangdong, China</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Products</h4>
            <ul className="space-y-2">
              {footerLinks.products.map((link) => (
                <li key={link.name}>
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
            <h4 className="text-lg font-semibold mb-4">Solutions</h4>
            <ul className="space-y-2">
              {footerLinks.solutions.map((link) => (
                <li key={link.name}>
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
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
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
              © 2024 YanghuaSTI. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-300 hover:text-[#fdb827] text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-300 hover:text-[#fdb827] text-sm">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}