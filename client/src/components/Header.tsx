import React from 'react';
import { TelegramUser } from '../types';
import { Plus, BarChart3 } from 'lucide-react';

interface HeaderProps {
  user: TelegramUser;
  onOpenCreate: () => void;
  showAnalytics: boolean;
  onToggleAnalytics: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenCreate,
  showAnalytics,
  onToggleAnalytics,
}) => {
  return (
    <header className="flex items-center justify-between pb-4 border-b border-slate-800/80">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={user.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={user.first_name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/50"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
        </div>
        <div>
          <div className="text-xs font-medium text-slate-400">Welcome back</div>
          <div className="text-base font-bold text-white flex items-center gap-1.5">
            {user.first_name}
            {user.username && <span className="text-xs text-blue-400 font-normal">@{user.username}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleAnalytics}
          className={`p-2 rounded-xl transition-all ${
            showAnalytics
              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
          }`}
          title="Toggle Group Analytics"
        >
          <BarChart3 className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenCreate}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>
    </header>
  );
};
