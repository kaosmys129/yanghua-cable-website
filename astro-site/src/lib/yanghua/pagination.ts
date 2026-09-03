export const LISTING_PAGE_SIZE = 24;

export interface PaginationLink {
  href: string;
  label: string;
  pageNumber: number;
  current: boolean;
}

export interface PaginatedResult<T> {
  pageNumber: number;
  totalPages: number;
  totalItems: number;
  items: T[];
  hasPrevious: boolean;
  hasNext: boolean;
}

export function getTotalPages(totalItems: number, pageSize: number = LISTING_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function paginateItems<T>(
  items: T[],
  pageNumber: number,
  pageSize: number = LISTING_PAGE_SIZE,
): PaginatedResult<T> {
  const totalItems = items.length;
  const totalPages = getTotalPages(totalItems, pageSize);
  const currentPage = Math.min(Math.max(1, pageNumber), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    pageNumber: currentPage,
    totalPages,
    totalItems,
    items: items.slice(start, start + pageSize),
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
  };
}

export function buildPaginatedPath(basePath: string, pageNumber: number): string {
  const cleanBasePath = basePath === '/' ? '/' : basePath.replace(/\/+$/, '');
  return pageNumber <= 1 ? cleanBasePath : `${cleanBasePath}/page/${pageNumber}`;
}

export function buildPaginationLinks(basePath: string, pageNumber: number, totalPages: number): PaginationLink[] {
  return Array.from({ length: totalPages }, (_, index) => {
    const current = index + 1;
    return {
      href: buildPaginatedPath(basePath, current),
      label: String(current),
      pageNumber: current,
      current: current === pageNumber,
    };
  });
}
