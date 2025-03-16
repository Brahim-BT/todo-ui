export interface Todo {
    id: number | null;
    task: string | null;
    description?: string | null;
    completed: boolean | null;
    dueDate: Date | null | string;
    createdAt: Date | null;
    _links?: {
        self: { href: string };
        todo?: { href: string };
    };
}
