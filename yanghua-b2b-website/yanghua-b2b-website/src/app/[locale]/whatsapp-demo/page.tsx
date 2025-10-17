import FloatingWhatsAppButton from '../../../components/FloatingWhatsAppButton';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-static';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'metadata' }).catch(() => ({
    // Fallback metadata if missing
    t: (key: string) => key
  } as any));
  return {
    title: `WhatsApp Demo | Yanghua`,
    description: `Floating WhatsApp chat button demo page.`
  };
}

export default function WhatsAppDemoPage() {
  return (
    <div style={{ minHeight: '60vh', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>WhatsApp Floating Button Demo</h1>
      <p style={{ color: '#555', marginBottom: '1.5rem' }}>
        This page demonstrates the floating WhatsApp chat button. The button appears in the bottom-right corner.
      </p>
      <p style={{ color: '#555', marginBottom: '2rem' }}>
        Try clicking the button to open WhatsApp with a prefilled message. On product pages, you can pass a product name to improve context.
      </p>

      {/* Demo integration: passing product name for better prefill */}
      <FloatingWhatsAppButton productName="Flexible Busbar" />
    </div>
  );
}