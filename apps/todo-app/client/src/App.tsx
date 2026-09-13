import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TodoFilters } from './components/TodoFilters';
import { TodoItem } from './components/TodoItem';
import { AddTodoModal } from './components/AddTodoModal';
import { AddCategoryModal } from './components/AddCategoryModal';
import {
  Todo,
  Category,
  Stats,
  HealthInfo,
  fetchHealth,
  fetchCategories,
  fetchTodos,
  fetchStats,
  createTodo,
  updateTodo,
  deleteTodo,
  createCategory,
  triggerDdlSync,
} from './api';
import { Layers, Loader2, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedPriority, setSelectedPriority] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [isAddTodoOpen, setIsAddTodoOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [h, cats, s, tList] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchCategories().catch(() => []),
        fetchStats().catch(() => null),
        fetchTodos({
          status: statusFilter,
          categoryId: selectedCategory,
          search: searchQuery,
          priority: selectedPriority,
        }).catch(() => []),
      ]);

      setHealth(h);
      setCategories(cats);
      setStats(s);
      setTodos(tList);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, selectedCategory, selectedPriority, searchQuery]);

  const handleToggleTodo = async (id: number, currentCompleted: boolean) => {
    try {
      const updated = await updateTodo(id, { completed: !currentCompleted });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      fetchStats().then(setStats);
    } catch (err) {
      console.error('Error toggling todo:', err);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      fetchStats().then(setStats);
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  const handleCreateTodo = async (
    title: string,
    priority: 'low' | 'medium' | 'high',
    categoryId?: number
  ) => {
    try {
      const newTodo = await createTodo({ title, priority, categoryId });
      setTodos((prev) => [newTodo, ...prev]);
      fetchStats().then(setStats);
    } catch (err: any) {
      alert(`ORM Error: ${err.message}`);
    }
  };

  const handleCreateCategory = async (name: string, color: string) => {
    try {
      const newCat = await createCategory(name, color);
      setCategories((prev) => [...prev, newCat]);
      fetchStats().then(setStats);
    } catch (err: any) {
      alert(`ORM Error: ${err.message}`);
    }
  };

  const handleSyncDb = async () => {
    try {
      setSyncing(true);
      await triggerDdlSync();
      await loadData();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header section */}
      <Header
        stats={stats}
        health={health}
        onSyncDb={handleSyncDb}
        syncing={syncing}
      />

      {/* Main Card */}
      <main className="glass-card p-6 md:p-8 rounded-3xl shadow-2xl">
        <TodoFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedPriority={selectedPriority}
          setSelectedPriority={setSelectedPriority}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          onOpenAddModal={() => setIsAddTodoOpen(true)}
          onOpenAddCategoryModal={() => setIsAddCategoryOpen(true)}
        />

        {/* Todo List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-xs font-medium">Executing ORM query builder...</p>
          </div>
        ) : todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-800/80 rounded-2xl bg-slate-900/40">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200">No tasks match your filters</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Create a task or clear filter options to query records using your TypeScript ORM.
            </p>
            <button
              onClick={() => setIsAddTodoOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/20"
            >
              Add First Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-slate-500">
        <p>
          Built with <strong className="text-indigo-400">lightweight-ts-orm</strong> npm package monorepo architecture.
        </p>
      </footer>

      {/* Modals */}
      <AddTodoModal
        isOpen={isAddTodoOpen}
        onClose={() => setIsAddTodoOpen(false)}
        onSubmit={handleCreateTodo}
        categories={categories}
      />

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onSubmit={handleCreateCategory}
      />
    </div>
  );
};
