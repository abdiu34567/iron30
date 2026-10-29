import React, { useState } from 'react';
import { X, Share2, Copy, Check, Send, Sparkles } from 'lucide-react';
import { Challenge } from '../types';

interface ShareModalProps {
  challenge: Challenge;
  isOpen: boolean;
  onClose: () => void;
  triggerHaptic: (type?: any) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  challenge,
  isOpen,
  onClose,
  triggerHaptic,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const botUsername = 'Iron30Bot';
  const directLink = `https://t.me/${botUsername}/app?startapp=${challenge._id}`;
  const shareText = `🔥 Join me in "${challenge.title}" on Iron30! Track your daily reps, build a streak, and compete with friends:`;
  const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(directLink)}&text=${encodeURIComponent(shareText)}`;

  const handleCopyLink = async () => {
    triggerHaptic('light');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(directLink);
      } else {
        // Fallback for older webviews
        const textArea = document.createElement('textarea');
        textArea.value = directLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      triggerHaptic('success');
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error('Failed to copy link:', e);
    }
  };

  const handleForwardToChat = () => {
    triggerHaptic('medium');
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

    if (tg) {
      try {
        // In Telegram Mini App, openLink triggers the native share sheet
        if (tg.openLink) {
          tg.openLink(tgShareUrl);
          return;
        }
        if (tg.openTelegramLink) {
          tg.openTelegramLink(tgShareUrl);
          return;
        }
      } catch (err) {
        console.warn('Telegram openLink error, falling back:', err);
      }
    }

    // Browser / external fallback
    if (navigator.share) {
      navigator
        .share({
          title: challenge.title,
          text: shareText,
          url: directLink,
        })
        .catch(() => window.open(tgShareUrl, '_blank'));
    } else {
      window.open(tgShareUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Share Challenge</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Challenge Preview Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Squad Challenge
              </span>
            </div>
            <h4 className="text-base font-extrabold text-white mb-1">{challenge.title}</h4>
            <p className="text-xs text-slate-400 line-clamp-2 mb-3">{challenge.description}</p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                🎯 {challenge.targetCount.toLocaleString()} {challenge.unit}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                📅 {challenge.durationDays} Days
              </span>
            </div>
          </div>

          {/* Action 1: Forward to Telegram Chat / Group */}
          <button
            onClick={handleForwardToChat}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Forward to Telegram Chat or Group</span>
          </button>

          {/* Action 2: Copy Direct Link */}
          <button
            onClick={handleCopyLink}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all active:scale-98 ${
              copied
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950 hover:bg-slate-800/80 text-slate-200 border-slate-800'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Invite Link Copied to Clipboard! ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Invite Link</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-500">
            Friends opening this link will launch Iron30 with their own Telegram profile.
          </p>
        </div>
      </div>
    </div>
  );
};
