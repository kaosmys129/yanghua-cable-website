import Link from "next/link";
import { getLocalizedPath } from "@/lib/url-localization";

interface BreadcrumbsProps {
  locale: string;
  currentTitle: string;
  currentSlug: string;
}

// Simple visual breadcrumbs component (JSON-LD is handled in page.tsx)
export default function Breadcrumbs({ locale, currentTitle, currentSlug }: BreadcrumbsProps) {
  const homePath = getLocalizedPath('home', locale as any);
  const listPath = getLocalizedPath('articles', locale as any);
  const detailPath = getLocalizedPath('articles-detail', locale as any, { slug: currentSlug });

  const labels = locale === 'es'
    ? { home: 'Inicio', articles: 'Artículos' }
    : { home: 'Home', articles: 'Articles' };

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-600">
      <ol className="flex items-center space-x-1">
        <li>
          <Link href={`/${locale}${homePath === '/' ? '' : homePath}`} className="hover:underline">
            {labels.home}
          </Link>
        </li>
        <li>/</li>
        <li>
          <Link href={`/${locale}${listPath === '/' ? '' : listPath}`} className="hover:underline">
            {labels.articles}
          </Link>
        </li>
        <li>/</li>
        <li aria-current="page" className="text-gray-900">
          <span title={currentTitle}>{currentTitle}</span>
        </li>
      </ol>
    </nav>
  );
}