import React, { useState, useEffect } from 'react';
import { X, Edit3, Calendar, Target, Sparkles, Check } from 'lucide-react';
import { Challenge } from '../types';

interface EditChallengeModalProps {
  challenge: Challenge;
  isOpen: boolean;
  onClose: () => void;
  onUpdateChallenge: (
    challengeId: string,
    updates: {
      title?: string;
      description?: string;
      targetCount?: number;
      unit?: string;
      durationDays?: number;
      startDate?: string;
    }
  ) => Promise<void>;
  triggerHaptic: (type?: any) => void;
}

function toLocalYYYYMMDD(dateInput: string | Date): string {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    return dateInput.slice(0, 10);
  }
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const EditChallengeModal: React.FC<EditChallengeModalProps> = ({
  challenge,
  isOpen,
  onClose,
  onUpdateChallenge,
  triggerHaptic,
}) => {
  const [title, setTitle] = useState(challenge.title);
  const [description, setDescription] = useState(challenge.description);
  const [targetCount, setTargetCount] = useState<number>(challenge.targetCount);
  const [unit, setUnit] = useState(challenge.unit || 'reps');
  const [durationDays, setDurationDays] = useState<number>(challenge.durationDays || 30);
  const [startDate, setStartDate] = useState<string>(() =>
    toLocalYYYYMMDD(challenge.startDate)
  );
  const [loading, setLoading] = useState(false);

  // Sync state whenever modal opens or challenge changes
  useEffect(() => {
    if (isOpen) {
      setTitle(challenge.title);
      setDescription(challenge.description);
      setTargetCount(challenge.targetCount);
      setUnit(challenge.unit || 'reps');
      setDurationDays(challenge.durationDays || 30);
      setStartDate(toLocalYYYYMMDD(challenge.startDate));
    }
  }, [isOpen, challenge]);

  if (!isOpen) return null;

  const todayStr = toLocalYYYYMMDD(new Date());

  // Calculate live preview metrics based on pure calendar days
  const calcDayMetrics = (dateStr: string, duration: number) => {
    if (!dateStr) return { badgeText: '', colorClass: 'text-slate-400' };

    const [y, m, d] = dateStr.split('-').map(Number);
    const startUtc = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));

    const now = new Date();
    const curTodayStr = toLocalYYYYMMDD(now);
    const [ty, tm, td] = curTodayStr.split('-').map(Number);
    const todayUtc = new Date(Date.UTC(ty, tm - 1, td, 0, 0, 0));

    const dayDiff = Math.round((todayUtc.getTime() - startUtc.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff < 0) {
      const daysUntil = Math.abs(dayDiff);
      return {
        badgeText: `Starts in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
        colorClass: 'text-amber-400',
      };
    }

    const dayNumber = Math.min(duration, dayDiff + 1);
    const daysLeft = Math.max(0, duration - dayNumber);

    return {
      badgeText: `Day ${dayNumber} of ${duration} (${daysLeft} days remaining)`,
      colorClass: 'text-blue-400',
    };
  };

  const setQuickDate = (offsetDays: number) => {
    triggerHaptic('light');
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setStartDate(toLocalYYYYMMDD(d));
  };

  const calculatedDaily =
    targetCount > 0 && durationDays > 0 ? Math.ceil(targetCount / durationDays) : 0;

  const metrics = calcDayMetrics(startDate, durationDays);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetCount <= 0 || durationDays <= 0 || !startDate) return;

    try {
      setLoading(true);
      triggerHaptic('medium');

      const isoDate = `${startDate}T00:00:00.000Z`;

      await onUpdateChallenge(challenge._id, {
        title: title.trim(),
        description: description.trim(),
        targetCount,
        unit: unit.trim().toLowerCase(),
        durationDays,
        startDate: isoDate,
      });

      triggerHaptic('success');
      onClose();
    } catch (err) {
      console.error('Failed to update challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if standard options include current durationDays
  const standardDurations = [7, 14, 30, 45, 60, 100];
  const durationOptions = standardDurations.includes(durationDays)
    ? standardDurations
    : [...standardDurations, durationDays].sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Edit Challenge Details</h3>
              <p className="text-[11px] text-slate-400">Modify title, goals, timeline & rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Challenge Title */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Challenge Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 3000 Pushups in 30 Days"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Description / Rules
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rules or notes for participants..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Target, Unit, Duration */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Target
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Unit
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="reps"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Duration
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {durationOptions.map((days) => (
                  <option key={days} value={days}>
                    {days} Days
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date & Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-400">
                Start Date
              </label>
              <span className={`text-[11px] font-bold ${metrics.colorClass}`}>
                {metrics.badgeText}
              </span>
            </div>

            {/* Quick Action Presets */}
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all active:scale-95 text-center ${
                  startDate === todayStr
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(-1)}
                className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all text-center"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(-7)}
                className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all text-center"
              >
                1 Wk Ago
              </button>
            </div>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Summary / Calculation Box */}
          <div className="p-3 bg-blue-950/30 rounded-xl border border-blue-900/40 text-xs text-blue-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Calculated Daily Pace:
            </span>
            <span className="font-black text-white">
              {calculatedDaily.toLocaleString()} {unit}/day
            </span>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-blue-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Challenge Details</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
