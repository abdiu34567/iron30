import React, { useState, useEffect } from 'react';
import { X, Flame, Check, Plus, Minus } from 'lucide-react';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (count: number, note?: string, date?: string, tradeOutcome?: 'win' | 'loss' | 'breakeven') => Promise<void>;
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
  const isTrade = unit.toLowerCase().includes('trade');
  const [count, setCount] = useState<string>(isTrade ? '1' : String(dailyGoal || 100));
  const [tradeOutcome, setTradeOutcome] = useState<'win' | 'loss' | 'breakeven'>('win');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCount(isTrade ? '1' : String(dailyGoal || 100));
      setTradeOutcome('win');
      setNote('');
    }
  }, [isOpen, dailyGoal, isTrade]);

  if (!isOpen) return null;

  const currentCount = parseInt(count, 10) || 0;

  const handleQuickAdd = (amount: number) => {
    triggerHaptic('light');
    setCount((prev) => {
      const val = parseInt(prev, 10) || 0;
      return String(Math.max(1, val + amount));
    });
  };

  const handleSetPreset = (amount: number) => {
    triggerHaptic('light');
    setCount(String(amount));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCount <= 0) return;

    try {
      setLoading(true);
      triggerHaptic('medium');
      await onSubmit(
        currentCount,
        note.trim() || undefined,
        undefined,
        isTrade ? tradeOutcome : undefined
      );
      triggerHaptic('success');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-lg">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isTrade ? 'Journal Today\'s Trade' : `Log Today's ${unit}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
          {/* Trade Outcome Selector if Trade Challenge */}
          {isTrade && (
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
                  <span>Winning Trade</span>
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
                  <span>Losing Trade</span>
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
          )}

          {/* Stepper & Number Input */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
            <label className="text-xs font-semibold text-slate-400 mb-2">
              {isTrade ? 'Number of trades logged' : `Enter or adjust ${unit} count`}
            </label>
            <div className="flex items-center gap-3 w-full justify-center">
              <button
                type="button"
                onClick={() => handleQuickAdd(isTrade ? -1 : -10)}
                className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-90 flex items-center justify-center text-slate-300 font-bold transition-all"
                aria-label={isTrade ? 'Decrease by 1' : 'Decrease by 10'}
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="relative flex-1 max-w-[150px]">
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="1"
                  max="10000"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="1"
                  className="w-full text-center text-3xl font-black text-white bg-slate-900/90 border border-slate-700/80 rounded-2xl py-2 px-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={() => handleQuickAdd(isTrade ? 1 : 10)}
                className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-90 flex items-center justify-center text-slate-300 font-bold transition-all"
                aria-label={isTrade ? 'Increase by 1' : 'Increase by 10'}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 mt-3.5 flex-wrap justify-center">
              {(isTrade ? [1, 2, 3] : [25, 50, 100]).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSetPreset(amt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                    currentCount === amt
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/30'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isTrade ? `${amt} trade${amt > 1 ? 's' : ''}` : amt}
                </button>
              ))}
              {!isTrade && (
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
              {isTrade ? 'Trade Setup / Execution Notes' : 'Optional Note / Hype (visible to friends)'}
            </label>
            <input
              type="text"
              maxLength={120}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isTrade ? 'e.g. EUR/USD breakout win, stuck to risk management' : 'e.g. 50 morning pushups done!'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || currentCount <= 0}
            className={`w-full py-3.5 font-bold text-sm rounded-2xl shadow-lg disabled:opacity-50 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2 ${
              isTrade
                ? tradeOutcome === 'win'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                  : tradeOutcome === 'loss'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30'
                  : 'bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-slate-600/30'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
            }`}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>
                  {isTrade
                    ? tradeOutcome === 'win'
                      ? `Log Winning Trade 🟢 (+${currentCount})`
                      : tradeOutcome === 'loss'
                      ? `Log Losing Trade 🔴 (+${currentCount})`
                      : `Log Break-even Trade ⚪ (+${currentCount})`
                    : `Confirm +${currentCount > 0 ? currentCount : 0} ${unit}`}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
