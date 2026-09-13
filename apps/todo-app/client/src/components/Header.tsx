import React from 'react';
import { Database, CheckCircle2, ListTodo, Layers, RefreshCw, Zap } from 'lucide-react';
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Lightweight ORM <span className="text-indigo-400 font-normal">Todo</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v1.0.0 Monorepo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Powered by <code className="text-indigo-300 font-mono">lightweight-ts-orm</code> npm package
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {health && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-xs text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{health.databaseFallback}</span>
            </div>
          )}

          <button
            onClick={onSyncDb}
            disabled={syncing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-all border border-slate-700 disabled:opacity-50"
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
          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Tasks</span>
              <ListTodo className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{stats.total}</div>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-2">{stats.completed}</div>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Active</span>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-2">{stats.active}</div>
          </div>

          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Completion Rate</span>
              <Layers className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-violet-400">{stats.completionRate}%</span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-violet-500 h-full rounded-full transition-all duration-500"
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
