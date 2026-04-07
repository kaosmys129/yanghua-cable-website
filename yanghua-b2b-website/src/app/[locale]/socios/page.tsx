import { notFound } from 'next/navigation';
import PartnersPage from '../partners/page';

export default function SociosPage({ params }: { params: { locale: string } }) {
  if (params.locale !== 'es') {
    notFound();
  }

  return <PartnersPage params={params} />;
}
