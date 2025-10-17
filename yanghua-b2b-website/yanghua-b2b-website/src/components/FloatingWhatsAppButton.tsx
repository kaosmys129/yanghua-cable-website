'use client';

import { useLocale } from 'next-intl';

type Props = {
  productName?: string;
  position?: {
    right?: string;
    bottom?: string;
  };
};

const FALLBACK_MESSAGES: Record<string, { ariaLabel: string; tooltip: string; prefill: (product?: string) => string }> = {
  en: {
    ariaLabel: 'Chat with us on WhatsApp',
    tooltip: 'WhatsApp chat',
    prefill: (product?: string) => `Hello, I’d like to know more${product ? ` about ${product}` : ''}.`
  },
  es: {
    ariaLabel: 'Chatea con nosotros en WhatsApp',
    tooltip: 'Chat de WhatsApp',
    prefill: (product?: string) => `Hola, me gustaría saber más${product ? ` sobre ${product}` : ''}.`
  },
  fr: {
    ariaLabel: 'Discutez avec nous sur WhatsApp',
    tooltip: 'Chat WhatsApp',
    prefill: (product?: string) => `Bonjour, je voudrais en savoir plus${product ? ` sur ${product}` : ''}.`
  },
  pt: {
    ariaLabel: 'Converse conosco no WhatsApp',
    tooltip: 'Chat do WhatsApp',
    prefill: (product?: string) => `Olá, gostaria de saber mais${product ? ` sobre ${product}` : ''}.`
  }
};

export default function FloatingWhatsAppButton({ productName, position }: Props) {
  const locale = useLocale() || 'en';
  const fallback = FALLBACK_MESSAGES[locale] || FALLBACK_MESSAGES['en'];

  // Use public env, fallback in development for demo
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || (process.env.NODE_ENV === 'development' ? '15551234567' : '');

  // Hide if no phone configured (except dev fallback)
  if (!phone) return null;

  const prefillText = fallback.prefill(productName);
  const encodedText = encodeURIComponent(prefillText);
  const href = `https://wa.me/${phone}?text=${encodedText}`;

  const onClick = () => {
    try {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({
        event: 'whatsapp_click',
        locale,
        path: window.location.pathname,
        productName: productName || null
      });
    } catch {}
  };

  const style: React.CSSProperties = {
    position: 'fixed',
    right: position?.right ?? '20px',
    bottom: position?.bottom ?? '20px',
    zIndex: 9999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#25D366',
    color: '#fff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    textDecoration: 'none',
    fontSize: '24px'
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={fallback.ariaLabel}
      title={fallback.tooltip}
      onClick={onClick}
      style={style}
    >
      {/* Simple WhatsApp glyph - replace with SVG if needed */}
      W
    </a>
  );
}