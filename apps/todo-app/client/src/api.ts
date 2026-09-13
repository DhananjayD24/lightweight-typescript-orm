export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  categoryId?: number;
  category?: Category | null;
}

export interface Stats {
  total: number;
  completed: number;
  active: number;
  categoriesCount: number;
  completionRate: number;
}

export interface HealthInfo {
  status: string;
  timestamp: string;
  databaseFallback: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchHealth(): Promise<HealthInfo> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createCategory(name: string, color: string): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create category');
  }
  return res.json();
}

export async function fetchTodos(filters?: {
  status?: 'all' | 'active' | 'completed';
  categoryId?: number;
  search?: string;
  priority?: string;
}): Promise<Todo[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.priority) params.append('priority', filters.priority);

  const res = await fetch(`${API_BASE}/todos?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json();
}

export async function createTodo(data: {
  title: string;
  priority?: 'low' | 'medium' | 'high';
  categoryId?: number;
}): Promise<Todo> {
  const res = await fetch(`${API_BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create todo');
  }
  return res.json();
}

export async function updateTodo(
  id: number,
  data: {
    title?: string;
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
    categoryId?: number | null;
  }
): Promise<Todo> {
  const res = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update todo');
  }
  return res.json();
}

export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete todo');
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function triggerDdlSync(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: false }),
  });
  if (!res.ok) throw new Error('Schema sync failed');
  return res.json();
}
