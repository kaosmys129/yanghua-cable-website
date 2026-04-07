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

  const labels = locale === 'es'
    ? { home: 'Inicio', articles: 'Artículos' }
    : { home: 'Home', articles: 'Articles' };

  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <li>
          <Link
            href={`/${locale}${homePath === '/' ? '' : homePath}`}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 transition-colors hover:border-amber-200 hover:text-amber-700"
          >
            {labels.home}
          </Link>
        </li>
        <li aria-hidden="true" className="text-slate-300">/</li>
        <li>
          <Link
            href={`/${locale}${listPath === '/' ? '' : listPath}`}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 transition-colors hover:border-amber-200 hover:text-amber-700"
          >
            {labels.articles}
          </Link>
        </li>
        <li aria-hidden="true" className="text-slate-300">/</li>
        <li aria-current="page" className="max-w-full min-w-0">
          <span
            title={currentTitle}
            className="inline-flex max-w-full rounded-full border border-amber-100 bg-amber-50 px-4 py-1.5 font-medium text-slate-800"
          >
            <span className="truncate">{currentTitle}</span>
          </span>
        </li>
      </ol>
    </nav>
  );
}
