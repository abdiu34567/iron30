import React, { useState } from 'react';
import { X, Target, Calendar, Dumbbell, Sparkles } from 'lucide-react';
import { TelegramUser } from '../types';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: TelegramUser;
  onCreated: (newChallengeId: string) => void;
  triggerHaptic: (type?: any) => void;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  user,
  onCreated,
  triggerHaptic,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetCount, setTargetCount] = useState<number>(3000);
  const [unit, setUnit] = useState('pushups');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const dailyGoal = Math.ceil(targetCount / durationDays);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || targetCount <= 0) return;

    try {
      setLoading(true);
      triggerHaptic('medium');

      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          targetCount,
          unit: unit.trim().toLowerCase(),
          durationDays,
          dailyGoal,
          creatorTelegramId: user.id,
          creatorName: user.first_name,
          creatorUsername: user.username,
          creatorPhotoUrl: user.photo_url,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        triggerHaptic('success');
        onCreated(json.data._id);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <Dumbbell className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Create New Challenge</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Description / Rules
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 100 reps every day. Stay consistent, log progress daily!"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Target Reps
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
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
                placeholder="pushups"
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
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={100}>100 Days</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-950/30 rounded-xl border border-blue-900/40 text-xs text-blue-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Calculated Daily Target:
            </span>
            <span className="font-black text-white">{dailyGoal} {unit}/day</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Launch Challenge & Join</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
