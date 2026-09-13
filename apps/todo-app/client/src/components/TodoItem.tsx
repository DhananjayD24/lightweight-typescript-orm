import React from 'react';
import { Check, Trash2, Tag, AlertCircle } from 'lucide-react';
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
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="glass-card glass-card-hover p-4 rounded-2xl flex items-center justify-between gap-4 group">
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* Custom Checkbox */}
        <button
          onClick={() => onToggle(todo.id, todo.completed)}
          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all border ${
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

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Priority Badge */}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityStyle(todo.priority)}`}>
              {todo.priority}
            </span>

            {/* Relational Category Badge */}
            {todo.category ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: todo.category.color }}
                />
                <span>{todo.category.name}</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 italic">No Category</span>
            )}
          </div>
        </div>
      </div>

      {/* Delete Action Button */}
      <button
        onClick={() => onDelete(todo.id)}
        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Delete task"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
