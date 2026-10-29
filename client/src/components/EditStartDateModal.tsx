import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, Clock, Sparkles } from 'lucide-react';
import { Challenge } from '../types';

interface EditStartDateModalProps {
  challenge: Challenge;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStartDate: (challengeId: string, newStartDate: string) => Promise<void>;
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

export const EditStartDateModal: React.FC<EditStartDateModalProps> = ({
  challenge,
  isOpen,
  onClose,
  onUpdateStartDate,
  triggerHaptic,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toLocalYYYYMMDD(challenge.startDate)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && challenge.startDate) {
      setSelectedDate(toLocalYYYYMMDD(challenge.startDate));
    }
  }, [isOpen, challenge.startDate]);

  if (!isOpen) return null;

  const todayStr = toLocalYYYYMMDD(new Date());

  // Calculate live preview metrics based on pure calendar days
  const calcDayMetrics = (dateStr: string) => {
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

    const dayNumber = Math.min(challenge.durationDays, dayDiff + 1);
    const daysLeft = Math.max(0, challenge.durationDays - dayNumber);

    return {
      badgeText: `Day ${dayNumber} of ${challenge.durationDays} (${daysLeft} days remaining)`,
      colorClass: 'text-blue-400',
    };
  };

  const setQuickDate = (offsetDays: number) => {
    triggerHaptic('light');
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(toLocalYYYYMMDD(d));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    try {
      setLoading(true);
      triggerHaptic('medium');
      // Send unambiguous UTC midnight string for the selected calendar date
      const isoDate = `${selectedDate}T00:00:00.000Z`;
      await onUpdateStartDate(challenge._id, isoDate);
      triggerHaptic('success');
      onClose();
    } catch (err) {
      console.error('Failed to update start date:', err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = calcDayMetrics(selectedDate);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Edit Starting Date</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">
              Select Start Date for <span className="text-white font-bold">{challenge.title}</span>
            </label>

            {/* Quick Action Presets */}
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 text-center ${
                  selectedDate === todayStr
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(-1)}
                className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all text-center"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(-7)}
                className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all text-center"
              >
                1 Wk Ago
              </button>
            </div>

            {/* Native Date Input */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Calculated Timeline:</span>
              <span className={`font-bold ${metrics.colorClass}`}>{metrics.badgeText}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Duration:</span>
              <span className="font-medium text-slate-300">{challenge.durationDays} Days</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !selectedDate}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 disabled:opacity-50 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save New Start Date</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
