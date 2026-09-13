import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Todo } from '../api';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, currentCompleted: boolean) => void;
  onDelete: (id: number) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-rose-400';
      case 'medium':
        return 'text-amber-400';
      case 'low':
      default:
        return 'text-emerald-400';
    }
  };

  const priorityLabel = todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1) + ' Priority';

  return (
    <div className="glass-card glass-card-hover p-4 rounded-md flex items-center justify-between gap-4 group">
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* Custom Checkbox */}
        <button
          onClick={() => onToggle(todo.id, todo.completed)}
          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all border ${
            todo.completed
              ? 'bg-gradient-to-tr from-indigo-600 to-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'border-slate-700 bg-slate-800/60 hover:border-indigo-500 text-transparent'
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
        </button>

        {/* Title & Metadata */}
        <div className="flex-1 min-w-0">
          <span
            className={`text-sm font-medium transition-all block truncate ${
              todo.completed ? 'line-through text-slate-500' : 'text-slate-100'
            }`}
          >
            {todo.title}
          </span>

          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
            {/* Category */}
            <span className="text-slate-400">
              {todo.category ? todo.category.name : 'No Category'}
            </span>

            <span className="text-white-800">,</span>

            {/* Priority */}
            <span className={`font-semibold ${getPriorityStyle(todo.priority)}`}>
              {priorityLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Delete Action Button */}
      <button
        onClick={() => onDelete(todo.id)}
        className="p-2 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Delete task"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};