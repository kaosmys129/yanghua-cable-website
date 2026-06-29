/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CLIENT DATA
 * ─────────────────────────────────────────────────────────────────────────────
 * Business-specific copy: name, phone, email, address, socials.
 * Imported by Header, Footer, Contact page, and Head/SEO components.
 *
 * No component should hardcode a business name or phone number —
 * everything comes from this file or brand.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const client = {
  name: 'Yanghua Cable',
  email: 'info@yhflexiblebusbar.com',
  phoneForTel: '+86-769-3893-9888',
  phoneFormatted: '+86-769-3893-9888',
  /** Business / contractor license number. Displayed in the header and footer
   *  as a trust signal. Set to an empty string to hide it. */
  license: '',
  address: {
    lineOne: 'Dongguan, Guangdong, China',
    lineTwo: '',
    city: 'Dongguan',
    state: 'Guangdong',
    zip: '',
    country: 'CN',
    mapLink: '',
  },
  socials: {
    facebook: '',
    instagram: '',
    google: '',
  },
  domain: 'https://yhflexiblebusbar.com',
} as const;

export type Client = typeof client;
