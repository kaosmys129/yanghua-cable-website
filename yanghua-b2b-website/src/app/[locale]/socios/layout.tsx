import { notFound } from 'next/navigation';
import PartnersLayout, { generateMetadata } from '../partners/layout';

export { generateMetadata };

export function generateStaticParams() {
  return [{ locale: 'es' }];
}

export default function SociosLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (params.locale !== 'es') {
    notFound();
  }

  return <PartnersLayout>{children}</PartnersLayout>;
}
