import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllArticles, getArticleBySlug, getAllArticlesWithDrafts, getArticleBySlugWithDrafts, checkStrapiHealth } from './strapi-client';
import { Article } from './types';
import { generateCacheKey } from './data-transformer';
import { logError } from './error-logger';

// Query keys for consistent caching
export const queryKeys = {
  articles: ['articles'] as const,
  article: (slug: string) => ['article', slug] as const,
  health: ['strapi-health'] as const,
} as const;

// Cache configuration
const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

/**
 * Hook for fetching all articles with caching
 */
export function useArticles(locale?: string) {
  return useQuery({
    queryKey: locale ? [queryKeys.articles[0], locale] : queryKeys.articles,
    queryFn: async () => {
      try {
        const result = await getAllArticles(locale as any);
        return result.data;
      } catch (error) {
        logError('Failed to fetch articles', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - longer for cloud service
    gcTime: 30 * 60 * 1000, // 30 minutes - extended garbage collection
    retry: (failureCount, error: any) => {
      // Custom retry logic for cloud services
      if (error?.originalError?.response?.status === 404) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Reduce unnecessary requests
    refetchOnReconnect: true, // Refetch when connection is restored
    refetchOnMount: 'always',
  });
}

/**
 * Hook for fetching a single article by slug with caching
 */
export function useArticle(slug: string, locale?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: locale ? [queryKeys.article(slug)[0], slug, locale] : [queryKeys.article(slug)[0], slug],
    queryFn: async () => {
      try {
        const result = await getArticleBySlug(slug, locale as any);
        if (!result) {
          throw new Error(`Article with slug '${slug}' not found`);
        }
        return result;
      } catch (error) {
        logError(`Failed to fetch article: ${slug}`, error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    },
    enabled: enabled && !!slug,
    staleTime: 15 * 60 * 1000, // 15 minutes - longer for individual articles
    gcTime: 60 * 60 * 1000, // 1 hour - articles change less frequently
    retry: (failureCount, error: any) => {
      // Don't retry if article not found
      if (error?.originalError?.response?.status === 404) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1500 * 2 ** attemptIndex, 45000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

/**
 * Hook for checking Strapi health with caching
 */
export function useStrapiHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: checkStrapiHealth,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });
}

/**
 * Hook for prefetching articles (useful for performance optimization)
 */
export function usePrefetchArticles() {
  const queryClient = useQueryClient();

  return {
    prefetchArticles: (locale?: string) => {
      queryClient.prefetchQuery({
        queryKey: locale ? [queryKeys.articles[0], locale] : queryKeys.articles,
        queryFn: async () => {
          const result = await getAllArticles(locale as any);
          return result.data;
        },
        staleTime: CACHE_CONFIG.staleTime,
      });
    },
    prefetchArticle: (slug: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.article(slug),
        queryFn: async () => {
          const result = await getArticleBySlug(slug);
          return result;
        },
        staleTime: CACHE_CONFIG.staleTime,
      });
    },
  };
}

/**
 * Hook for invalidating and refetching data
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateArticles: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles });
    },
    invalidateArticle: (slug: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.article(slug) });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
    refetchArticles: () => {
      queryClient.refetchQueries({ queryKey: queryKeys.articles });
    },
  };
}

/**
 * Hook for optimistic updates (useful for future features like likes, comments)
 */
export function useOptimisticArticleUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, updates }: { slug: string; updates: Partial<Article> }) => {
      // This would be implemented when we have update endpoints
      throw new Error('Article updates not implemented yet');
    },
    onMutate: async ({ slug, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.article(slug) });

      // Snapshot the previous value
      const previousArticle = queryClient.getQueryData(queryKeys.article(slug));

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.article(slug), (old: Article | undefined) => {
        if (!old) return old;
        return { ...old, ...updates };
      });

      // Return a context object with the snapshotted value
      return { previousArticle };
    },
    onError: (err, { slug }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousArticle) {
        queryClient.setQueryData(queryKeys.article(slug), context.previousArticle);
      }
    },
    onSettled: (data, error, { slug }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.article(slug) });
    },
  });
}

/**
 * Utility function to get cached article data without triggering a fetch
 */
export function getCachedArticle(slug: string, queryClient: ReturnType<typeof useQueryClient>): Article | undefined {
  return queryClient.getQueryData(queryKeys.article(slug));
}

/**
 * Utility function to get cached articles data without triggering a fetch
 */
export function getCachedArticles(queryClient: ReturnType<typeof useQueryClient>): Article[] | undefined {
  return queryClient.getQueryData(queryKeys.articles);
}

/**
 * Hook for managing loading states across multiple queries
 */
export function useLoadingStates() {
  const articlesQuery = useQuery({ queryKey: queryKeys.articles, enabled: false });
  const healthQuery = useQuery({ queryKey: queryKeys.health, enabled: false });

  return {
    isLoadingAny: articlesQuery.isLoading || healthQuery.isLoading,
    isErrorAny: articlesQuery.isError || healthQuery.isError,
    errors: {
      articles: articlesQuery.error,
      health: healthQuery.error,
    },
  };
}

/**
 * Hook for fetching articles with draft support (for preview mode)
 */
export function useArticlesWithDrafts(locale?: string) {
  return useQuery({
    queryKey: locale ? [queryKeys.articles[0], 'drafts', locale] : [queryKeys.articles[0], 'drafts'],
    queryFn: async () => {
      try {
        const result = await getAllArticlesWithDrafts(locale as any);
        return result.data;
      } catch (error) {
        logError('Failed to fetch articles with drafts', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter for draft content
    gcTime: 5 * 60 * 1000, // 5 minutes - shorter garbage collection for drafts
    retry: (failureCount, error: any) => {
      if (error?.originalError?.response?.status === 404) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
  });
}

/**
 * Hook for fetching single article with draft support (for preview mode)
 */
export function useArticleWithDrafts(slug: string, locale?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: locale ? [queryKeys.article(slug)[0], slug, 'drafts', locale] : [queryKeys.article(slug)[0], slug, 'drafts'],
    queryFn: async () => {
      try {
        const result = await getArticleBySlugWithDrafts(slug, locale as any);
        if (!result) {
          throw new Error(`Article with slug '${slug}' not found`);
        }
        return result;
      } catch (error) {
        logError(`Failed to fetch article with drafts: ${slug}`, error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    },
    enabled: enabled && !!slug,
    staleTime: 1 * 60 * 1000, // 1 minute - very short for draft content
    gcTime: 5 * 60 * 1000, // 5 minutes - shorter for drafts
    retry: (failureCount, error: any) => {
      if (error?.originalError?.response?.status === 404) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1500 * 2 ** attemptIndex, 45000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}