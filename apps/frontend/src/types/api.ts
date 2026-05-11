// src/types/api.ts
// Common API shapes shared across resources.

export interface Pagination {
  page: number;
  size: number;
  total: number;
  pages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface ListParams {
  page?: number;
  size?: number;
  q?: string;
  include_deleted?: boolean;
}
