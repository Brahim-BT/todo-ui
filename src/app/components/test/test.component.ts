import { CommonModule } from '@angular/common';
import { Component, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ScrollerModule } from 'primeng/scroller';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { forkJoin } from 'rxjs';
import { Todo } from '../../models/todo';
import { ProductService } from '../../pages/service/product.service';
import { TodoService } from '../../services/todo.service';
import { ToggleSwitch } from 'primeng/toggleswitch';

interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

@Component({
  selector: 'app-test',
  providers: [MessageService, ProductService, ConfirmationService],
  imports: [ToggleSwitch, FormsModule, ProgressSpinnerModule, ConfirmDialogModule, ScrollerModule, ToolbarModule, TableModule, IconFieldModule, InputIconModule, CommonModule, ToastModule, ButtonModule, InputTextModule, MessageModule, FloatLabelModule, DialogModule, TextareaModule, DatePicker, ReactiveFormsModule],
  templateUrl: './test.component.html',
  styleUrl: './test.component.scss'
})
export class TestComponent {
  todoDialog: boolean = false;
  todoForm!: FormGroup;
  todos = signal<Todo[]>([]);
  cols!: Column[];
  selectedTodos!: Todo[] | null;
  @ViewChild('dt') dt!: Table;
  isSaving: boolean = false;

  currentPage: number = 0;
  rowsPerPage: number = 10;
  totalRecords: number = 0;

  filterTerm = signal<{ [key: string]: string }>({});

  sortField = signal<string>('id'); // Default sort field
  sortOrder = signal<number>(1); // 1 = ascending, -1 = descending

  constructor(private messageService: MessageService, private formBuilder: FormBuilder, private todoService: TodoService, private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.cols = [
      { field: 'id', header: 'ID', customExportHeader: 'Product Id' },
      { field: 'task', header: 'Task' },
      { field: 'description', header: 'Description' },
      { field: 'dueDate', header: 'Due Date' },
      { field: 'completed', header: 'Completed' },
    ];
    this.iniateForm();
    this.loadTodos();
  }

  loadTodos() {
    this.todoService.getTodos(this.currentPage, this.rowsPerPage, this.filterTerm(), this.sortField(), this.sortOrder()).subscribe({
      next: (response) => {
        this.todos.set(response.data);
        this.totalRecords = response.page.totalElements;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load todos: ${error.message}`,
          life: 3000
        })
      }
    });
  }

  toggleCompleted(todo: Todo) {
    this.isSaving = true; // Optional: Show loading state
    this.todoService.partialUpdateTodo(todo.id!, { completed: todo.completed })
      .subscribe({
        next: (updatedTodo) => {
          // Update the todos signal with the new value
          this.todos.set(this.todos().map(t =>
            t.id === updatedTodo.id ? updatedTodo : t
          ));
          this.isSaving = false;
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to update todo: ${err.message}`,
            life: 3000
          });
          // Revert the toggle on error
          todo.completed = !todo.completed;
          this.isSaving = false;
        }
      });
  }

  onPageChange(event: TableLazyLoadEvent) {
    // Handle sortField type (enforce single-column sorting)
    const sortField = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField || 'id';

    // Handle sortOrder (convert to 1/-1)
    const sortOrder = event.sortOrder === 1 ? 1 : -1;

    // Update signals
    this.sortField.set(sortField);
    this.sortOrder.set(sortOrder);

    // Pagination logic
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    this.currentPage = Math.floor(first / rows);
    this.rowsPerPage = rows;

    this.loadTodos();
  }

  iniateForm() {
    this.todoForm = this.formBuilder.group({
      id: [''],
      task: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(5)]],
      dueDate: ['', Validators.required],
      completed: [false] // Default to false for new todos
    });
  }

  exportCSV() {
    this.dt.exportCSV();
  }

  onGlobalFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    // Example: Search multiple fields
    this.filterTerm.set({ task: filterValue, description: filterValue });

    this.loadTodos();
  }

  openNew() {
    this.todoForm.reset();
    this.todoDialog = true;
  }

  deleteSelectedTodos() {
    if (!this.selectedTodos || this.selectedTodos.length === 0) return;

    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected todos?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const deleteObservables = this.selectedTodos!.map(todo => this.todoService.deleteTodo(todo.id!));

        forkJoin(deleteObservables).subscribe({
          next: () => {
            // Reload data to reflect changes
            this.loadTodos();

            // Clear selection
            this.selectedTodos = null;

            // Success message
            this.messageService.add({
              severity: 'success',
              summary: 'Successful',
              detail: 'Selected todos deleted successfully',
              life: 3000
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete todos: ' + error.message,
              life: 3000
            });
          }
        });
      }
    });
  }

  editTodo(todo: Todo) {
    this.todoForm.patchValue({
      ...todo,
      dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
      completed: todo.completed
    });
    this.todoDialog = true;
  }

  deleteTodo(todo: Todo) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this todo ?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.todoService.deleteTodo(todo.id!).subscribe({
          next: (value) => {
            // Code to handle successful deletion
            this.loadTodos();
            this.messageService.add({
              severity: 'success',
              summary: 'Successful',
              detail: 'The Todo Has Been Deleted Successfully',
              life: 3000,
            });
          },
          error: (error) => {
            // Code to handle error
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'An error occurred while deleting the todo :' + error.message,
              life: 3000
            })
          },
        });
      }
    });
  }

  hideDialog() {
    this.todoDialog = false;
    this.todoForm.reset();
  }

  showDialog() {
    this.todoDialog = true;
  }

  clearForm() {
    this.todoDialog = false;
    this.todoForm.reset();
  }

  saveTodo(): void {
    if (!this.todoForm.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields correctly.',
        life: 3000
      });
      return;
    }
    this.isSaving = true;
    if (this.todoForm.value.id) { // Edit existing
      let id = this.todoForm.value.id;
      this.todoService.updateTodo(id, this.todoForm.value).subscribe({
        next: (todo) => {
          this.loadTodos();
          this.clearForm();
          this.messageService.add({
            severity: 'info',
            summary: 'Successful',
            detail: 'The Todo Has Been Updated Successfully',
            life: 3000
          })
          this.isSaving = false;
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to update: ${err.error.message}`,
            life: 3000
          });
          this.isSaving = false;
        }
      });
      return;
    } else {
      const todo: Todo = {
        id: null,
        task: this.todoForm.value.task as string,
        description: this.todoForm.value.description,
        completed: this.todoForm.value.completed,
        dueDate: this.todoForm.value.dueDate,
        createdAt: null
      };
      this.todoService.createTodo(todo).subscribe({
        next: (todo) => {
          this.clearForm();
          this.loadTodos();
          this.messageService.add({
            severity: 'success',
            summary: 'Successful',
            detail: 'The Todo Has Been Created Successfully',
            life: 3000
          })
          this.isSaving = false;
        },
        error: (err) => {
          console.log(this.todoForm.value.completed);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to save: ${err.message || 'Unknown error'}`,
            life: 3000
          });
          this.isSaving = false;
        }
      });
    }
  }
}
