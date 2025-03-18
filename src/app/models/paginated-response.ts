export interface PaginatedResponse<T> {
  data: T[];
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}