import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  if (!resolvedParams || !resolvedParams.locale) {
    return {
      title: 'Page Not Found',
      description: 'The page you are looking for could not be found.',
      robots: 'noindex, nofollow',
    };
  }
  
  const { locale } = resolvedParams;
  const t = await getTranslations({ locale, namespace: 'notFound' });
  
  return {
    title: `404 - ${t('title')} | Yanghua Cable`,
    description: t('description'),
    robots: 'noindex, nofollow',
  };
}

export default async function LocalizedNotFound({ params }: Props) {
  const resolvedParams = await params;
  if (!resolvedParams || !resolvedParams.locale) {
    // Fallback if params is undefined
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-9xl font-bold text-gray-300">404</h1>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Page Not Found
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              The page you are looking for could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const { locale } = resolvedParams;
  const t = await getTranslations({ locale, namespace: 'notFound' });
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('description')}
          </p>
        </div>
        
        <div className="mt-8 text-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            ← {t('backToHome')}
          </Link>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {t('contactMessage')}{' '}
            <Link href={`/${locale}/contact`} className="text-blue-600 hover:text-blue-500">
              {t('contactUs')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}