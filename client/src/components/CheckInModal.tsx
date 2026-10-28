import React, { useState } from 'react';
import { X, Flame, Check, Sparkles } from 'lucide-react';

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
  const [selectedCount, setSelectedCount] = useState<number>(dailyGoal || 100);
  const [customInput, setCustomInput] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const presets = [25, 50, 100];

  const handlePresetSelect = (count: number) => {
    triggerHaptic('light');
    setSelectedCount(count);
    setIsCustom(false);
  };

  const handleCustomChange = (val: string) => {
    setCustomInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setSelectedCount(num);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCount <= 0) return;

    try {
      setLoading(true);
      triggerHaptic('medium');
      await onSubmit(selectedCount, note.trim() || undefined);
      triggerHaptic('success');
      onClose();
      setNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
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
          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">
              Select Amount
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {presets.map((amt) => {
                const active = !isCustom && selectedCount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handlePresetSelect(amt)}
                    className={`py-3 px-2 rounded-2xl font-bold text-sm border transition-all active:scale-95 ${
                      active
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30'
                        : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    +{amt} {unit}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Input Toggle */}
          <div>
            <button
              type="button"
              onClick={() => {
                setIsCustom(!isCustom);
                triggerHaptic('light');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCustom ? 'Use quick presets' : 'Enter custom amount'}</span>
            </button>

            {isCustom && (
              <div className="mt-2">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={customInput}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  placeholder="e.g. 75"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              Optional Note / Hype (visible to friends)
            </label>
            <input
              type="text"
              maxLength={120}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Morning 50 reps, feeling solid!"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || selectedCount <= 0}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 disabled:opacity-50 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm +{selectedCount} {unit}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
