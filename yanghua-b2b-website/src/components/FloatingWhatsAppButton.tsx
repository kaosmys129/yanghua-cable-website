'use client';
import { useEffect, useState } from 'react';

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
  const [locale, setLocale] = useState<string>('en');
  useEffect(() => {
    try {
      // Prefer SSR-set html[lang]
      const htmlLang = document.documentElement.lang?.toLowerCase();
      // Fallback to first path segment
      const pathLocale = (window.location.pathname.split('/')[1] || '').toLowerCase();
      const supported = ['en', 'es', 'fr', 'pt'];
      const detected = supported.includes(htmlLang || '') ? htmlLang : (supported.includes(pathLocale) ? pathLocale : 'en');
      setLocale(detected || 'en');
    } catch {
      setLocale('en');
    }
  }, []);
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
    textDecoration: 'none'
  };

  const svgStyle: React.CSSProperties = {
    width: '28px',
    height: '28px'
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
      {/* WhatsApp official-like glyph (simplified) */}
      <svg viewBox="0 0 32 32" role="img" aria-hidden="true" style={svgStyle}>
        <path fill="#fff" d="M16 3C9.383 3 4 8.383 4 15c0 2.284.631 4.428 1.73 6.27L4 28l6.874-1.701C12.684 27.356 14.301 28 16 28c6.617 0 12-5.383 12-12S22.617 3 16 3zm0 22c-1.46 0-2.868-.419-4.093-1.212l-.294-.187-4.01 1.004 1.037-3.862-.198-.309C7.238 19.092 7 17.905 7 16 7 10.477 11.477 6 17 6s10 4.477 10 10-4.477 9-11 9z"/>
        <path fill="#fff" d="M21.562 18.265c-.315-.173-1.859-.918-2.146-1.021-.287-.103-.496-.155-.705.155-.209.309-.81 1.021-.992 1.23-.182.206-.365.232-.68.058-.315-.173-1.331-.489-2.536-1.56-.937-.812-1.57-1.813-1.754-2.122-.182-.309-.02-.476.137-.633.141-.141.315-.365.473-.547.155-.182.206-.309.315-.515.103-.206.052-.387-.026-.547-.077-.155-.705-1.7-.966-2.325-.254-.609-.514-.526-.705-.526-.182-.01-.387-.01-.594-.01-.206 0-.54.078-.825.387-.287.309-1.086 1.061-1.086 2.587s1.114 2.996 1.27 3.202c.155.206 2.193 3.353 5.312 4.56.743.319 1.322.51 1.773.653.744.236 1.423.203 1.958.123.597-.089 1.859-.759 2.121-1.491.262-.732.262-1.359.183-1.491-.078-.131-.287-.206-.602-.379z"/>
      </svg>
    </a>
  );
}