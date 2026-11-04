import React, { useState } from 'react';
import { FriendProgress, DayHeatmapItem } from '../types';
import { UserAvatar } from './UserAvatar';
import { X, Flame, BellRing, Check, Calendar, Clock, MessageSquare, PlusCircle, Plus } from 'lucide-react';

interface FriendProgressModalProps {
  progress: FriendProgress | null;
  isOpen: boolean;
  onClose: () => void;
  unit: string;
  currentUserId?: number;
  onNudge: (friendUserId: number, friendName: string) => Promise<void>;
  onOpenCheckIn?: () => void;
  onCheckIn?: (count: number, note?: string, date?: string, tradeOutcome?: 'win' | 'loss' | 'breakeven') => Promise<void>;
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
  onCheckIn,
  triggerHaptic,
}) => {
  const isTrade = unit.toLowerCase().includes('trade');
  const [nudged, setNudged] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayHeatmapItem | null>(null);

  // Quick Log state for direct 1-tap logging
  const [quickLogDay, setQuickLogDay] = useState<DayHeatmapItem | null>(null);
  const [quickCount, setQuickCount] = useState<string>('');
  const [tradeOutcome, setTradeOutcome] = useState<'win' | 'loss' | 'breakeven'>('win');
  const [tradeNote, setTradeNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !progress || !progress.participant || !progress.stats) return null;

  const { participant, stats } = progress;
  const heatmap = progress.heatmap || [];
  const recentLogs = progress.recentLogs || [];
  const isCurrentUser = currentUserId !== undefined && participant?.userId === currentUserId;

  const handleDayClick = (item: DayHeatmapItem) => {
    triggerHaptic('light');
    setSelectedDay(item);

    if (!isCurrentUser) {
      return;
    }

    if (item.status === 'future') {
      setToastMessage(`Day ${item.dayNumber} begins on ${item.date}!`);
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    // Direct, frictionless quick-log for today or past days
    setQuickLogDay(item);
    if (isTrade) {
      setQuickCount('1');
      setTradeOutcome(item.tradeOutcome === 'loss' ? 'loss' : item.tradeOutcome === 'breakeven' ? 'breakeven' : 'win');
      setTradeNote('');
    } else {
      setQuickCount(String(item.targetCount || 100));
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogDay || !onCheckIn) return;
    const num = parseInt(quickCount, 10);
    if (!num || num <= 0) return;

    try {
      setSubmitting(true);
      triggerHaptic('medium');
      await onCheckIn(
        num,
        isTrade ? (tradeNote.trim() || undefined) : undefined,
        quickLogDay.date,
        isTrade ? tradeOutcome : undefined
      );
      triggerHaptic('success');
      setQuickLogDay(null);
    } catch (err) {
      console.error(err);
      triggerHaptic('error');
    } finally {
      setSubmitting(false);
    }
  };

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
    if (isTrade) {
      if (item.tradeOutcome === 'win') {
        return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 ring-1 ring-emerald-400/40';
      }
      if (item.tradeOutcome === 'loss') {
        return 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/30 ring-1 ring-rose-400/40';
      }
      if (item.tradeOutcome === 'breakeven') {
        return 'bg-slate-600 hover:bg-slate-500 text-slate-100 ring-1 ring-slate-400/30';
      }
      if (item.tradeOutcome === 'mixed') {
        return 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm shadow-amber-600/30';
      }
      if (item.status === 'today') {
        return 'bg-blue-600/25 text-blue-300 border-2 border-blue-500 shadow-md shadow-blue-500/20';
      }
      if (item.status === 'missed') {
        return 'bg-slate-850/60 text-slate-500 border border-slate-800';
      }
      return 'bg-slate-900/50 text-slate-600 border border-slate-800/80';
    }

    switch (item.status) {
      case 'completed':
        return 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm shadow-emerald-500/30';
      case 'partial':
        return 'bg-amber-500 hover:bg-amber-400 text-white';
      case 'today':
        return 'bg-blue-600/25 text-blue-300 border-2 border-blue-500 shadow-md shadow-blue-500/20';
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
                {isTrade ? 'Total Trades' : 'Total Reps'}
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

            {isTrade && stats.tradeStats ? (
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Win Rate
                </span>
                <div className="text-base font-black text-emerald-400">
                  {stats.tradeStats.winRate}%
                </div>
                <span className="text-[10px] text-slate-400">
                  {stats.tradeStats.winCount}W - {stats.tradeStats.lossCount}L
                  {stats.tradeStats.breakevenCount > 0 ? ` · ${stats.tradeStats.breakevenCount}BE` : ''}
                </span>
              </div>
            ) : (
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Daily Avg
                </span>
                <div className="text-base font-black text-white">
                  {stats.dailyAverage}
                </div>
                <span className="text-[10px] text-slate-400">{unit} / day</span>
              </div>
            )}
          </div>

          {/* 30-Day Heatmap Calendar */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>{heatmap.length}-Day {isTrade ? 'Trade Journal' : 'Consistency Heatmap'}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                {isTrade ? (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Win
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-rose-500 inline-block" /> Loss
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-slate-500 inline-block" /> BE
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" /> Today
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Goal
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" /> Part
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" /> Today
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-rose-500/50 inline-block" /> Miss
                    </span>
                  </>
                )}
              </div>
            </div>

            {toastMessage && (
              <div className="mb-2.5 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-center text-xs text-amber-300 font-semibold animate-fade-in">
                {toastMessage}
              </div>
            )}

            {/* Grid of days */}
            <div className="grid grid-cols-6 gap-2">
              {heatmap.map((item) => (
                <button
                  key={item.dayNumber}
                  onClick={() => handleDayClick(item)}
                  type="button"
                  title={isCurrentUser ? `Tap to log Day ${item.dayNumber}` : `Day ${item.dayNumber}`}
                  className={`h-9 rounded-xl flex flex-col items-center justify-center text-[11px] font-black transition-all active:scale-90 ${getHeatmapColor(
                    item
                  )} ${selectedDay?.dayNumber === item.dayNumber ? 'ring-2 ring-white/80' : ''}`}
                >
                  <span>D{item.dayNumber}</span>
                  <span className="text-[9px] font-bold opacity-90">
                    {isTrade ? (
                      item.tradeOutcome === 'win'
                        ? 'WIN'
                        : item.tradeOutcome === 'loss'
                        ? 'LOSS'
                        : item.tradeOutcome === 'breakeven'
                        ? 'BE'
                        : item.tradeOutcome === 'mixed'
                        ? 'MIX'
                        : item.loggedCount > 0
                        ? `${item.loggedCount}T`
                        : '-'
                    ) : (
                      item.loggedCount > 0 ? item.loggedCount : '-'
                    )}
                  </span>
                </button>
              ))}
            </div>

            {selectedDay && (
              <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">Day {selectedDay.dayNumber}</span>{' '}
                  <span className="text-slate-400">({selectedDay.date})</span>
                  <div className="font-semibold text-blue-400 mt-0.5 flex items-center gap-1.5">
                    <span>
                      {selectedDay.loggedCount} {isTrade ? (selectedDay.loggedCount === 1 ? 'trade' : 'trades') : unit} logged
                    </span>
                    {isTrade && selectedDay.tradeOutcome === 'win' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md font-bold">
                        🟢 Win
                      </span>
                    )}
                    {isTrade && selectedDay.tradeOutcome === 'loss' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded-md font-bold">
                        🔴 Loss
                      </span>
                    )}
                    {isTrade && selectedDay.tradeOutcome === 'breakeven' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-500/20 text-slate-300 rounded-md font-bold">
                        ⚪ Break-even
                      </span>
                    )}
                    {isTrade && selectedDay.tradeOutcome === 'mixed' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-md font-bold">
                        🟡 Mixed
                      </span>
                    )}
                  </div>
                </div>

                {isCurrentUser && selectedDay.status !== 'future' && (
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setQuickLogDay(selectedDay);
                      if (isTrade) {
                        setQuickCount('1');
                        setTradeOutcome(selectedDay.tradeOutcome === 'loss' ? 'loss' : selectedDay.tradeOutcome === 'breakeven' ? 'breakeven' : 'win');
                        setTradeNote('');
                      } else {
                        setQuickCount(String(selectedDay.targetCount || 100));
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{selectedDay.loggedCount > 0 ? (isTrade ? 'Add Trade' : 'Add More') : (isTrade ? 'Log Trade' : 'Log')}</span>
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
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>+{log.count} {unit}</span>
                        {log.tradeOutcome === 'win' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/30">
                            WIN 🟢
                          </span>
                        )}
                        {log.tradeOutcome === 'loss' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-black border border-rose-500/30">
                            LOSS 🔴
                          </span>
                        )}
                        {log.tradeOutcome === 'breakeven' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-600/30 text-slate-300 font-bold border border-slate-500/30">
                            BE ⚪
                          </span>
                        )}
                      </div>
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
                const todayItem = heatmap.find((h) => h.status === 'today') || heatmap[0];
                if (todayItem) {
                  setQuickLogDay(todayItem);
                  if (isTrade) {
                    setQuickCount('1');
                    setTradeOutcome('win');
                    setTradeNote('');
                  } else {
                    setQuickCount(String(todayItem.targetCount || 100));
                  }
                } else if (onOpenCheckIn) {
                  onOpenCheckIn();
                }
              }}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 active:scale-98 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              <span>{isTrade ? "Journal Today's Trade" : `Log Today's ${unit}`}</span>
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

      {/* Instant Quick-Log Overlay on Day Click */}
      {quickLogDay && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuickLogDay(null);
          }}
        >
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>{isTrade ? `Journal Trade · Day ${quickLogDay.dayNumber}` : `Log Day ${quickLogDay.dayNumber}`}</span>
                </h4>
                <p className="text-xs text-slate-400">
                  {quickLogDay.status === 'today' ? 'Today' : quickLogDay.date} · Target: {quickLogDay.targetCount} {unit}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickLogDay(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="mt-4 space-y-4">
              {isTrade ? (
                <>
                  {/* Outcome Selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-2">
                      Trade Outcome
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setTradeOutcome('win');
                        }}
                        className={`py-3 px-2 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1 active:scale-95 ${
                          tradeOutcome === 'win'
                            ? 'bg-emerald-600/25 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/50'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-base">🟢</span>
                        <span>Winning</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setTradeOutcome('loss');
                        }}
                        className={`py-3 px-2 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1 active:scale-95 ${
                          tradeOutcome === 'loss'
                            ? 'bg-rose-600/25 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/50'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-base">🔴</span>
                        <span>Losing</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setTradeOutcome('breakeven');
                        }}
                        className={`py-3 px-2 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1 active:scale-95 ${
                          tradeOutcome === 'breakeven'
                            ? 'bg-slate-700/40 border-slate-500 text-slate-200 shadow-lg shadow-slate-500/20 ring-1 ring-slate-400/50'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-base">⚪</span>
                        <span>Break-Even</span>
                      </button>
                    </div>
                  </div>

                  {/* Trade Count Preset / Input */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Number of Trades</span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setQuickCount(String(val));
                          }}
                          className={`w-9 h-9 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center justify-center ${
                            quickCount === String(val)
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/30'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trade Setup Note */}
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                      Trade Setup / Reason (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={tradeNote}
                      onChange={(e) => setTradeNote(e.target.value)}
                      placeholder="e.g. Breakout retest on 15m, adhered to plan"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !parseInt(quickCount, 10)}
                    className={`w-full py-3.5 font-bold text-sm rounded-2xl shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                      tradeOutcome === 'win'
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                        : tradeOutcome === 'loss'
                        ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30'
                        : 'bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-slate-600/30'
                    }`}
                  >
                    {submitting ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>
                          {tradeOutcome === 'win'
                            ? `Log Winning Trade 🟢 (+${parseInt(quickCount, 10) || 1})`
                            : tradeOutcome === 'loss'
                            ? `Log Losing Trade 🔴 (+${parseInt(quickCount, 10) || 1})`
                            : `Log Break-even Trade ⚪ (+${parseInt(quickCount, 10) || 1})`}
                        </span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* Fitness Numeric Quick Log */
                <>
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
                    <label className="text-xs font-semibold text-slate-400 mb-2">
                      Enter {unit} count
                    </label>
                    <div className="w-full max-w-[200px]">
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="1"
                        max="10000"
                        value={quickCount}
                        onChange={(e) => setQuickCount(e.target.value)}
                        placeholder={String(quickLogDay.targetCount || 100)}
                        autoFocus
                        className="w-full text-center text-4xl font-black text-white bg-slate-900 border border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl py-2.5 px-3 outline-none transition-all shadow-inner"
                      />
                    </div>
                    <span className="text-xs text-blue-400 font-bold mt-1.5">
                      {unit} completed
                    </span>

                    {/* Quick 1-tap preset chips */}
                    <div className="flex items-center gap-2 mt-3.5 flex-wrap justify-center w-full">
                      {[
                        Math.round(quickLogDay.targetCount * 0.5),
                        quickLogDay.targetCount,
                        Math.round(quickLogDay.targetCount * 1.5),
                      ]
                        .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                        .map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setQuickCount(String(preset));
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                              quickCount === String(preset)
                                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/30'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !parseInt(quickCount, 10)}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Log {parseInt(quickCount, 10) || quickLogDay.targetCount} {unit}</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
