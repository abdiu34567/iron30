import React from 'react';
import { Challenge, LeaderboardUser } from '../types';
import { Flame, Trophy, Users, Target } from 'lucide-react';

interface AnalyticsBannerProps {
  challenge: Challenge;
  participants: LeaderboardUser[];
}

export const AnalyticsBanner: React.FC<AnalyticsBannerProps> = ({ challenge, participants }) => {
  const totalGroupCompleted = challenge.totalCompletedCount || 0;
  const participantCount = participants.length || 1;
  const targetTotal = challenge.targetCount * participantCount;
  const groupPercentage = Math.min(100, Math.round((totalGroupCompleted / targetTotal) * 100));

  const totalStreakSum = participants.reduce((acc, p) => acc + (p.currentStreak || 0), 0);
  const avgStreak = Math.round(totalStreakSum / participantCount);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Group Pulse Analytics
          </span>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Live Group Sync
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Target className="w-3.5 h-3.5 text-blue-400" />
            <span>Group Reps</span>
          </div>
          <div className="text-xl font-black text-white">
            {totalGroupCompleted.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">{challenge.unit}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {groupPercentage}% of total group milestone
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Avg Streak</span>
          </div>
          <div className="text-xl font-black text-white flex items-center gap-1">
            {avgStreak} <span className="text-xs font-normal text-slate-400">days</span>
          </div>
          <div className="text-[10px] text-orange-400/80 mt-0.5">High consistency 🔥</div>
        </div>
      </div>

      {/* Group progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Overall Group Progress</span>
          <span className="font-semibold text-slate-200">{groupPercentage}%</span>
        </div>
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${groupPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
