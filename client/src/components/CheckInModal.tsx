import React, { useState, useEffect } from 'react';
import { X, Flame, Check, Plus, Minus } from 'lucide-react';
import { parseLoggedAmount, toggleAmountSign, formatLoggedAmount } from '../utils/numberUtils';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (count: number, note?: string) => Promise<void>;
  unit: string;
  dailyGoal: number;
  triggerHaptic: (type?: any) => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  unit,
  dailyGoal,
  triggerHaptic,
}) => {
  const [count, setCount] = useState<string>(String(dailyGoal || 100));
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCount(String(dailyGoal || 100));
      setNote('');
    }
  }, [isOpen, dailyGoal]);

  if (!isOpen) return null;

  const parsedCount = parseLoggedAmount(count);
  const isValid = parsedCount !== null;

  const handleQuickAdd = (amount: number) => {
    triggerHaptic('light');
    setCount((prev) => {
      const current = parseLoggedAmount(prev) ?? 0;
      return String(Math.round((current + amount) * 100) / 100);
    });
  };

  const handleSetPreset = (amount: number) => {
    triggerHaptic('light');
    setCount(String(amount));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedCount === null) return;

    try {
      setLoading(true);
      triggerHaptic('medium');
      await onSubmit(parsedCount, note.trim() || undefined);
      triggerHaptic('success');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic presets based on dailyGoal
  const defaultPresets = dailyGoal && dailyGoal <= 10
    ? [dailyGoal, dailyGoal * 2, dailyGoal * 5]
    : [25, 50, 100];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-lg">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Log Today's {unit}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
          {/* Prominent Number Input with Stepper */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400">
                Enter or adjust {unit} count
              </label>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setCount((prev) => toggleAmountSign(prev));
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-95 transition-all flex items-center gap-1"
                title="Toggle positive/negative"
              >
                <span>+ / -</span>
              </button>
            </div>

            <div className="flex items-center gap-3 w-full justify-center">
              <button
                type="button"
                onClick={() => handleQuickAdd(dailyGoal && dailyGoal <= 10 ? -1 : -10)}
                className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-90 flex items-center justify-center text-slate-300 font-bold transition-all"
                aria-label="Decrease"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="relative flex-1 max-w-[180px]">
                <input
                  type="text"
                  inputMode="decimal"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="0"
                  className="w-full text-center text-3xl font-black text-white bg-slate-900/90 border border-slate-700/80 rounded-2xl py-2 px-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={() => handleQuickAdd(dailyGoal && dailyGoal <= 10 ? 1 : 10)}
                className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-90 flex items-center justify-center text-slate-300 font-bold transition-all"
                aria-label="Increase"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 mt-3.5 flex-wrap justify-center">
              {defaultPresets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSetPreset(amt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                    parsedCount === amt
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/30'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {amt}
                </button>
              ))}
              {dailyGoal > 10 && (
                <button
                  type="button"
                  onClick={() => handleQuickAdd(25)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-blue-400 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all"
                >
                  +25
                </button>
              )}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              Optional Note / Details (visible to friends)
            </label>
            <input
              type="text"
              maxLength={120}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Morning session, breakout trade, or notes"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 disabled:opacity-50 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>
                  Confirm {isValid ? formatLoggedAmount(parsedCount) : ''} {unit}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
