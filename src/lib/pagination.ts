export const PAGE_SIZE = 10;

export type PaginationMeta = {
  page: number;
  limit: number;
  totalCount: number;
  hasMore: boolean;
};

export type PageParams = {
  page?: number;
  limit?: number;
};

export function appendUniqueById<T extends { id: string }>(prev: T[], next: T[]): T[] {
  if (prev.length === 0) return next;
  const seen = new Set(prev.map((item) => item.id));
  const extra = next.filter((item) => item?.id && !seen.has(item.id));
  return extra.length ? [...prev, ...extra] : prev;
}

export function paginationFrom(payload?: Partial<PaginationMeta> | null, fallbackLimit = PAGE_SIZE): PaginationMeta {
  const page = Number(payload?.page) || 1;
  const limit = Number(payload?.limit) || fallbackLimit;
  const totalCount = Number(payload?.totalCount) || 0;
  const hasMore =
    typeof payload?.hasMore === 'boolean' ? payload.hasMore : page * limit < totalCount;
  return { page, limit, totalCount, hasMore };
}

export function pageCount(totalCount: number, limit = PAGE_SIZE) {
  return Math.max(1, Math.ceil(Math.max(0, totalCount) / limit));
}
