import React from 'react';
import { Challenge } from '../types';
import { Plus, Flame, CheckCircle, Users } from 'lucide-react';

interface ChallengeSwitcherProps {
  challenges: Challenge[];
  selectedChallengeId: string;
  onSelect: (challenge: Challenge) => void;
  onOpenCreate: () => void;
  joinedChallengeIds: Set<string>;
  triggerHaptic: (type?: any) => void;
}

export const ChallengeSwitcher: React.FC<ChallengeSwitcherProps> = ({
  challenges,
  selectedChallengeId,
  onSelect,
  onOpenCreate,
  joinedChallengeIds,
  triggerHaptic,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Active Challenges ({challenges.length})
        </span>
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenCreate();
          }}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Challenge</span>
        </button>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none snap-x snap-mandatory">
        {challenges.map((c) => {
          const isSelected = c._id === selectedChallengeId;
          const isJoined = joinedChallengeIds.has(c._id);

          const startDate = new Date(c.startDate);
          const now = new Date();
          const msElapsed = Math.max(0, now.getTime() - startDate.getTime());
          const dayNumber = Math.min(
            c.durationDays,
            Math.max(1, Math.floor(msElapsed / (1000 * 60 * 60 * 24)) + 1)
          );

          return (
            <button
              key={c._id}
              onClick={() => {
                triggerHaptic('light');
                onSelect(c);
              }}
              className={`snap-start shrink-0 text-left p-3 rounded-2xl border transition-all active:scale-[0.98] min-w-[210px] max-w-[240px] relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/80 border-blue-500/60 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-xl rounded-full pointer-events-none" />
              )}

              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                  Day {dayNumber}/{c.durationDays}
                </span>

                {isJoined ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Joined
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                    Open
                  </span>
                )}
              </div>

              <div className="font-bold text-white text-sm truncate mb-1">
                {c.title}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Goal: <strong className="text-slate-200">{c.targetCount.toLocaleString()}</strong> {c.unit}
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Users className="w-3 h-3 text-slate-500" />
                  {c.participantCount || 0}
                </span>
              </div>
            </button>
          );
        })}

        {/* Quick Add Button in Carousel */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenCreate();
          }}
          className="snap-start shrink-0 min-w-[130px] p-3 rounded-2xl border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/30 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-white transition-all active:scale-95"
        >
          <div className="p-2 rounded-full bg-slate-800 text-slate-300">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold">New Challenge</span>
        </button>
      </div>
    </div>
  );
};
