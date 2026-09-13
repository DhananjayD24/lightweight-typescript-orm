import React from 'react';
import { Database, CheckCircle2, ListTodo, Layers, RefreshCw } from 'lucide-react';
import { Stats, HealthInfo } from '../api';

interface HeaderProps {
  stats: Stats | null;
  health: HealthInfo | null;
  onSyncDb: () => void;
  syncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ stats, health, onSyncDb, syncing }) => {
  return (
    <header className="mb-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Todo <span className="italic text-indigo-400">App</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {health && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md glass-card text-xs text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{health.databaseFallback}</span>
            </div>
          )}

          <button
            onClick={onSyncDb}
            disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-all border border-slate-700 disabled:opacity-50"
            title="Execute ORM schema sync (DDL)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Sync Schema</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="glass-card p-4 rounded-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Tasks</span>
              <ListTodo className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{stats.total}</div>
          </div>

          <div className="glass-card p-4 rounded-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-2">{stats.completed}</div>
          </div>

          <div className="glass-card p-4 rounded-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Active</span>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-2">{stats.active}</div>
          </div>

          <div className="glass-card p-4 rounded-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Completion Rate</span>
              <Layers className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-violet-400">{stats.completionRate}%</span>
              <div className="w-full bg-slate-800 h-1.5 rounded-md overflow-hidden">
                <div
                  className="bg-violet-500 h-full rounded-md transition-all duration-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};