import React from 'react';
import { Challenge, LeaderboardUser } from '../types';
import { Calendar, CheckCircle2, ChevronRight, Share2, PlusCircle } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserProgress?: LeaderboardUser;
  onOpenCheckIn: () => void;
  onShare: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  currentUserProgress,
  onOpenCheckIn,
  onShare,
}) => {
  const userProgress = currentUserProgress?.totalProgress || 0;
  const userPercentage = Math.min(
    100,
    Math.round((userProgress / challenge.targetCount) * 100)
  );

  const startDate = new Date(challenge.startDate);
  const now = new Date();
  const msElapsed = Math.max(0, now.getTime() - startDate.getTime());
  const dayNumber = Math.min(
    challenge.durationDays,
    Math.max(1, Math.floor(msElapsed / (1000 * 60 * 60 * 24)) + 1)
  );
  const daysLeft = Math.max(0, challenge.durationDays - dayNumber);

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl">
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* Top badges */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Day {dayNumber} of {challenge.durationDays}
        </span>

        <button
          onClick={onShare}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 rounded-xl transition-colors"
          title="Share to Group"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Title & description */}
      <h2 className="text-xl font-extrabold text-white tracking-tight mb-1">
        {challenge.title}
      </h2>
      <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
        {challenge.description}
      </p>

      {/* User personal progress section */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <div>
            <span className="text-xs text-slate-400">Your Progress</span>
            <div className="text-lg font-black text-white">
              {userProgress.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {challenge.targetCount.toLocaleString()} {challenge.unit}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-blue-400 font-bold">{userPercentage}%</span>
            <div className="text-[11px] text-slate-500">{daysLeft} days left</div>
          </div>
        </div>

        <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
            style={{ width: `${userPercentage}%` }}
          />
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={onOpenCheckIn}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-size-200 hover:bg-right text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-600/25 active:scale-[0.98] transition-all"
      >
        <PlusCircle className="w-5 h-5" />
        <span>Log Today's Pushups</span>
      </button>
    </div>
  );
};
