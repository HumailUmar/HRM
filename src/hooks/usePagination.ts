import { useState, useMemo } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  totalPages: number;
  count: number;
}

export function usePagination<T>(items: T[], defaultLimit = 20) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);

  const totalPages = Math.max(1, Math.ceil(items.length / limit));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;

  const paginatedItems = useMemo(() => {
    return items.slice(offset, offset + limit);
  }, [items, offset, limit]);

  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);

  const reset = () => {
    setPage(1);
  };

  return {
    page: safePage,
    limit,
    totalPages,
    count: items.length,
    paginatedItems,
    setPage: goToPage,
    setLimit,
    nextPage,
    prevPage,
    reset,
  };
}
