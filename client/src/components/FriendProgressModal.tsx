import React, { useState } from 'react';
import { FriendProgress, DayHeatmapItem } from '../types';
import { UserAvatar } from './UserAvatar';
import { X, Flame, BellRing, Check, TrendingUp, Calendar, Clock, MessageSquare, PlusCircle, Plus } from 'lucide-react';

interface FriendProgressModalProps {
  progress: FriendProgress | null;
  isOpen: boolean;
  onClose: () => void;
  unit: string;
  currentUserId?: number;
  onNudge: (friendUserId: number, friendName: string) => Promise<void>;
  onOpenCheckIn?: () => void;
  triggerHaptic: (type?: any) => void;
}

export const FriendProgressModal: React.FC<FriendProgressModalProps> = ({
  progress,
  isOpen,
  onClose,
  unit,
  currentUserId,
  onNudge,
  onOpenCheckIn,
  triggerHaptic,
}) => {
  const [nudged, setNudged] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayHeatmapItem | null>(null);

  if (!isOpen || !progress) return null;

  const { participant, stats, heatmap, recentLogs } = progress;
  const isCurrentUser = currentUserId !== undefined && participant.userId === currentUserId;

  const handleNudgeClick = async () => {
    try {
      setNudging(true);
      triggerHaptic('medium');
      await onNudge(participant.userId, participant.userName);
      setNudged(true);
      triggerHaptic('success');
      setTimeout(() => setNudged(false), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setNudging(false);
    }
  };

  const getHeatmapColor = (item: DayHeatmapItem) => {
    switch (item.status) {
      case 'completed':
        return 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm shadow-emerald-500/30';
      case 'partial':
        return 'bg-amber-500 hover:bg-amber-400 text-white';
      case 'missed':
        return 'bg-rose-500/40 text-rose-200 border border-rose-500/30';
      case 'future':
      default:
        return 'bg-slate-800/40 text-slate-600 border border-slate-800/80';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header with User Info */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={participant.userName}
              photoUrl={participant.photoUrl}
              id={participant.userId}
              size="lg"
              className="ring-2 ring-blue-500/40"
            />
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                {participant.userName}
                {isCurrentUser && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    You 👤
                  </span>
                )}
                {stats.isOnTrack ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    On Track 🟢
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Needs Hype 🟡
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {participant.username ? `@${participant.username}` : 'Challenge Participant'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-5 pr-1">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Total Reps
              </span>
              <div className="text-base font-black text-white">
                {participant.totalProgress.toLocaleString()}
              </div>
              <span className="text-[10px] text-blue-400 font-bold">
                {participant.progressPercentage}% done
              </span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Streak
              </span>
              <div className="text-base font-black text-white flex items-center justify-center gap-0.5">
                <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                <span>{participant.currentStreak}d</span>
              </div>
              <span className="text-[10px] text-slate-400">best: {participant.bestStreak}d</span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Daily Avg
              </span>
              <div className="text-base font-black text-white">
                {stats.dailyAverage}
              </div>
              <span className="text-[10px] text-slate-400">reps / day</span>
            </div>
          </div>

          {/* 30-Day Heatmap Calendar */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>30-Day Consistency Heatmap</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Goal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" /> Part
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-rose-500/50 inline-block" /> Miss
                </span>
              </div>
            </div>

            {/* Grid of days (e.g. 5 columns x 6 rows for 30 days) */}
            <div className="grid grid-cols-6 gap-2">
              {heatmap.map((item) => (
                <button
                  key={item.dayNumber}
                  onClick={() => setSelectedDay(item)}
                  type="button"
                  className={`h-9 rounded-xl flex flex-col items-center justify-center text-[11px] font-black transition-all active:scale-90 ${getHeatmapColor(
                    item
                  )}`}
                >
                  <span>D{item.dayNumber}</span>
                  <span className="text-[9px] font-semibold opacity-90">
                    {item.loggedCount > 0 ? item.loggedCount : '-'}
                  </span>
                </button>
              ))}
            </div>

            {selectedDay && (
              <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">Day {selectedDay.dayNumber}</span>{' '}
                  <span className="text-slate-400">({selectedDay.date})</span>
                  <div className="font-semibold text-blue-400 mt-0.5">
                    {selectedDay.loggedCount} / {selectedDay.targetCount} {unit} logged
                  </div>
                </div>

                {isCurrentUser && onOpenCheckIn && (
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      onClose();
                      onOpenCheckIn();
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Activity / Check-in Feed */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-2.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Recent Activity History</span>
            </div>

            {recentLogs.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-4">No check-ins yet.</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">+{log.count} {unit}</div>
                      {log.note && (
                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <MessageSquare className="w-3 h-3 text-slate-500" />
                          <span>"{log.note}"</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{log.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 shrink-0">
          {isCurrentUser ? (
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
                if (onOpenCheckIn) onOpenCheckIn();
              }}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 active:scale-98 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Log Today's {unit}</span>
            </button>
          ) : (
            <button
              onClick={handleNudgeClick}
              disabled={nudging || nudged}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                nudged
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-white active:scale-98'
              }`}
            >
              {nudged ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Nudge Sent! Bot alerted {participant.userName} ⚡</span>
                </>
              ) : (
                <>
                  <BellRing className="w-4 h-4 text-orange-400" />
                  <span>Send Friendly Nudge to {participant.userName}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
