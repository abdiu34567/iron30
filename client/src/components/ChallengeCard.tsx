import React from 'react';
import { Challenge, LeaderboardUser } from '../types';
import { Calendar, CheckCircle2, ChevronRight, Share2, PlusCircle, Rocket, Target, Users } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserProgress?: LeaderboardUser;
  isJoined: boolean;
  joining: boolean;
  currentUserId?: number;
  participantCount?: number;
  onJoin: () => void;
  onOpenCheckIn: () => void;
  onShare: () => void;
  onOpenEditDate?: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  currentUserProgress,
  isJoined,
  joining,
  currentUserId,
  participantCount,
  onJoin,
  onOpenCheckIn,
  onShare,
  onOpenEditDate,
}) => {
  const userProgress = currentUserProgress?.totalProgress || 0;
  const userPercentage = Math.min(
    100,
    Math.round((userProgress / challenge.targetCount) * 100)
  );

  // Pure calendar day diff calculation
  const startDateStr =
    typeof challenge.startDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(challenge.startDate)
      ? challenge.startDate.slice(0, 10)
      : new Date(challenge.startDate).toISOString().slice(0, 10);
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const startUtc = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0));

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const [ty, tm, td] = [year, month, day].map(Number);
  const todayUtc = new Date(Date.UTC(ty, tm - 1, td, 0, 0, 0));

  const dayDiff = Math.round((todayUtc.getTime() - startUtc.getTime()) / (1000 * 60 * 60 * 24));
  const isUpcoming = dayDiff < 0;
  const daysUntil = Math.abs(dayDiff);
  const dayNumber = isUpcoming ? daysUntil : Math.min(challenge.durationDays, dayDiff + 1);
  const daysLeft = Math.max(0, challenge.durationDays - dayNumber);

  // Only allow challenge author (or creator of seeded challenge) to edit dates
  const isAuthor =
    currentUserId !== undefined &&
    (challenge.creatorTelegramId === 0 || challenge.creatorTelegramId === currentUserId);
  const canEditDate = Boolean(isAuthor && onOpenEditDate);

  const badgeText = isUpcoming
    ? `Starts in ${dayNumber} day${dayNumber === 1 ? '' : 's'}`
    : `Day ${dayNumber} of ${challenge.durationDays}`;

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl">
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* Top badges */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {canEditDate ? (
            <button
              onClick={onOpenEditDate}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 active:scale-95 transition-all group"
              title="Click to edit starting date (Author)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span>{badgeText}</span>
              <Calendar className="w-3 h-3 text-blue-400/70 group-hover:text-blue-300 ml-0.5" />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              {badgeText}
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {participantCount !== undefined ? participantCount : (challenge.participantCount || 0)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {canEditDate && (
            <button
              onClick={onOpenEditDate}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 rounded-xl transition-colors"
              aria-label="Edit Start Date"
              title="Edit start date (Author only)"
            >
              <Calendar className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onShare}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 rounded-xl transition-colors"
            aria-label="Share Challenge"
            title="Share to friends"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title & description */}
      <h2 className="text-xl font-extrabold text-white tracking-tight mb-1">
        {challenge.title}
      </h2>
      <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
        {challenge.description}
      </p>

      {/* Dynamic Content based on Join Status */}
      {isJoined ? (
        <>
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
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-600/25 active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Log Today's {challenge.unit}</span>
          </button>
        </>
      ) : (
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 font-medium mb-1">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Target: <strong className="text-white">{challenge.targetCount.toLocaleString()} {challenge.unit}</strong> ({challenge.dailyGoal} / day)</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3.5">
            Join your friends in this challenge to start tracking your streak and climb the leaderboard!
          </p>

          <button
            onClick={onJoin}
            disabled={joining}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-emerald-600/25 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {joining ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                <span>Accept Challenge & Join</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
