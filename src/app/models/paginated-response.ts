export interface PaginatedResponse<T> {
  _embedded: {
    todos: T[]; // Match the Spring HAL format
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}