import React from 'react';
import { LeaderboardUser } from '../types';
import { Flame, ChevronRight, Trophy, Users } from 'lucide-react';

interface LeaderboardProps {
  participants: LeaderboardUser[];
  currentUserId: number;
  unit: string;
  onSelectUser: (userId: number) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  participants,
  currentUserId,
  unit,
  onSelectUser,
}) => {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-xl">🥇</span>;
      case 2:
        return <span className="text-xl">🥈</span>;
      case 3:
        return <span className="text-xl">🥉</span>;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">
            {rank}
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Friends Leaderboard
          </h3>
        </div>
        {participants.length > 0 && (
          <span className="text-xs text-slate-400">Tap friend to see journey</span>
        )}
      </div>

      {participants.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-2 text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-200 mb-1">No Participants Yet</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Be the first to join this challenge above and take the #1 spot on the leaderboard! 🥇
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {participants.map((p) => {
            const isCurrentUser = p.userId === currentUserId;

            return (
              <div
                key={p.userId}
                onClick={() => onSelectUser(p.userId)}
                role="button"
                tabIndex={0}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all active:scale-[0.99] flex items-center gap-3.5 ${
                  isCurrentUser
                    ? 'bg-blue-950/30 border-blue-600/40 hover:border-blue-500/60 shadow-lg shadow-blue-950/20'
                    : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Rank */}
                <div className="w-7 flex items-center justify-center shrink-0">
                  {getRankBadge(p.rank)}
                </div>

                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={
                      p.photoUrl ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${p.userId}`
                    }
                    alt={p.userName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  {p.currentStreak > 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-slate-950 border border-slate-800 px-1 py-0.2 rounded-full flex items-center text-[10px] text-orange-400 font-black">
                      <Flame className="w-2.5 h-2.5 fill-orange-400 text-orange-400 inline" />
                      <span>{p.currentStreak}</span>
                    </div>
                  )}
                </div>

                {/* Name & Progress bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-sm font-bold text-white truncate">
                        {p.userName}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-1.5 py-0.2 rounded-md">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white shrink-0">
                      {p.totalProgress.toLocaleString()} {unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p.rank === 1
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}
                        style={{ width: `${p.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                      {p.progressPercentage}%
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
