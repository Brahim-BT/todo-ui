import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../models/paginated-response';
import { Todo } from '../models/todo';

@Injectable({
  providedIn: 'root'
})
export class TodoService {

  private apiUrl = 'http://localhost:8080/api/todos';
  private searchUrl = 'http://localhost:8080/api/todos/search';

  constructor(private httpclient: HttpClient) { }

  getTodos(page: number, size: number, filters: { [key: string]: string } = {}, sortField: string = 'id', sortOrder: number = 1): Observable<PaginatedResponse<Todo>> {
    const params: { [key: string]: string } = {
      page: page.toString(),
      size: size.toString(),
      sort: `${sortField},${sortOrder === 1 ? 'asc' : 'desc'}`,
      ...filters
    };

    return this.httpclient.get<PaginatedResponse<Todo>>(this.searchUrl, { params });
  }

  // GET todo by id
  getTodoById(id: number): Observable<Todo> {
    return this.httpclient.get<Todo>(`${this.apiUrl}/${id}`);
  }

  // POST create new todo
  createTodo(todo: Todo): Observable<Todo> {
    return this.httpclient.post<Todo>(this.apiUrl, todo);
  }

  // PUT update existing todo
  updateTodo(id: number, todo: Todo): Observable<Todo> {
    return this.httpclient.put<Todo>(`${this.apiUrl}/${id}`, todo);
  }

  // PATCH partially update existing todo
  partialUpdateTodo(id: number, todo: Partial<Todo>): Observable<Todo> {
    return this.httpclient.patch<Todo>(`${this.apiUrl}/${id}`, todo);
  }

  // DELETE todo by id
  deleteTodo(id: number): Observable<Todo> {
    return this.httpclient.delete<Todo>(`${this.apiUrl}/${id}`);
  }

  private extractIdFromUrl(url: string): number {
    const parts = url.split('/');
    return parseInt(parts[parts.length - 1], 10);
  }
}