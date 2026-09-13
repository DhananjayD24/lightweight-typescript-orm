import React from 'react';
import { Search, Filter, Plus, Tag } from 'lucide-react';
import { Category } from '../api';

interface TodoFiltersProps {
  statusFilter: 'all' | 'active' | 'completed';
  setStatusFilter: (status: 'all' | 'active' | 'completed') => void;
  selectedCategory: number | undefined;
  setSelectedCategory: (catId: number | undefined) => void;
  selectedPriority: string | undefined;
  setSelectedPriority: (priority: string | undefined) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: Category[];
  onOpenAddModal: () => void;
  onOpenAddCategoryModal: () => void;
}

export const TodoFilters: React.FC<TodoFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  selectedCategory,
  setSelectedCategory,
  selectedPriority,
  setSelectedPriority,
  searchQuery,
  setSearchQuery,
  categories,
  onOpenAddModal,
  onOpenAddCategoryModal,
}) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Top Bar: Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks using ORM query filter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddCategoryModal}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all border border-slate-700"
          >
            <Tag className="w-4 h-4 text-indigo-400" />
            <span>Add Category</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Status Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800">
          {(['all', 'active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-200">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card text-xs text-slate-300">
            <select
              value={selectedPriority || ''}
              onChange={(e) => setSelectedPriority(e.target.value || undefined)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-200">All Priorities</option>
              <option value="high" className="bg-slate-900 text-slate-200">High Priority</option>
              <option value="medium" className="bg-slate-900 text-slate-200">Medium Priority</option>
              <option value="low" className="bg-slate-900 text-slate-200">Low Priority</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
