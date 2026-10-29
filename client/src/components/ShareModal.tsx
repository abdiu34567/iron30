import React, { useState } from 'react';
import { X, Share2, Copy, Check, Send, Globe, MessageSquare, Link2 } from 'lucide-react';
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
  const [copiedType, setCopiedType] = useState<'message' | 'web' | 'direct' | null>(null);

  if (!isOpen) return null;

  const botUsername = 'Iron30Bot';
  const directLink = `https://t.me/${botUsername}/app?startapp=${challenge._id}`;

  const origin =
    typeof window !== 'undefined' && window.location.origin.startsWith('http')
      ? window.location.origin
      : 'https://iron30.onrender.com';
  const webPreviewLink = `${origin}/c/${challenge._id}?v=2`;

  const shareLeadText = `🔥 Join my "${challenge.title}" squad on Iron30!\n🎯 Target: ${challenge.targetCount.toLocaleString()} ${challenge.unit} (${challenge.dailyGoal.toLocaleString()} / day) · ${challenge.durationDays} Days\n\n👇 Tap below to accept & track with our squad:`;

  const fullInviteMessage = `${shareLeadText}\n${directLink}`;

  const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(directLink)}&text=${encodeURIComponent(shareLeadText)}`;

  const copyToClipboard = async (text: string, type: 'message' | 'web' | 'direct') => {
    triggerHaptic('light');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedType(type);
      triggerHaptic('success');
      setTimeout(() => setCopiedType(null), 3000);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  };

  const handleForwardToChat = () => {
    triggerHaptic('medium');
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

    if (tg) {
      try {
        // In Telegram Mini App, openTelegramLink natively opens the chat chooser
        if (tg.openTelegramLink) {
          tg.openTelegramLink(tgShareUrl);
          return;
        }
        if (tg.openLink) {
          tg.openLink(tgShareUrl);
          return;
        }
      } catch (err) {
        console.warn('Telegram share link error, falling back:', err);
      }
    }

    // Browser / external fallback
    if (navigator.share) {
      navigator
        .share({
          title: challenge.title,
          text: shareLeadText,
          url: directLink,
        })
        .catch(() => window.open(tgShareUrl, '_blank'));
    } else {
      window.open(tgShareUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
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

        <div className="mt-4 space-y-4">
          {/* Challenge Preview Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                Squad Challenge
              </span>
            </div>
            <h4 className="text-base font-extrabold text-white mb-1">{challenge.title}</h4>
            <p className="text-xs text-slate-400 line-clamp-2 mb-3">{challenge.description}</p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                🎯 {challenge.targetCount.toLocaleString()} {challenge.unit}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                ⚡ {challenge.dailyGoal.toLocaleString()} / day
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                📅 {challenge.durationDays} Days
              </span>
            </div>
          </div>

          {/* Action 1: Forward Directly inside Telegram */}
          <button
            onClick={handleForwardToChat}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 active:scale-98 transition-all flex items-center justify-center gap-2.5"
          >
            <Send className="w-4 h-4" />
            <span>Forward to Telegram Chat or Group</span>
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-semibold text-slate-500">
              <span className="bg-slate-900 px-3">or copy invite</span>
            </div>
          </div>

          {/* Option A: Copy Full Formatted Invite Message */}
          <button
            onClick={() => copyToClipboard(fullInviteMessage, 'message')}
            className={`w-full p-3.5 rounded-2xl border text-left transition-all active:scale-98 ${
              copiedType === 'message'
                ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">Full Invite Message</span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                  Recommended
                </span>
              </div>
              {copiedType === 'message' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {copiedType === 'message'
                ? '✓ Copied with challenge name, target & launch link!'
                : 'Includes challenge title, daily targets, and launch button link'}
            </p>
          </button>

          {/* Option B: Copy Web Preview Link */}
          <button
            onClick={() => copyToClipboard(webPreviewLink, 'web')}
            className={`w-full p-3.5 rounded-2xl border text-left transition-all active:scale-98 ${
              copiedType === 'web'
                ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">Web Preview Link</span>
              </div>
              {copiedType === 'web' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {copiedType === 'web'
                ? '✓ Web preview link copied!'
                : 'Displays challenge preview card in Telegram, WhatsApp & Twitter'}
            </p>
          </button>

          {/* Option C: Copy Direct App Link */}
          <button
            onClick={() => copyToClipboard(directLink, 'direct')}
            className={`w-full py-2.5 px-3.5 rounded-xl border flex items-center justify-between text-xs transition-all active:scale-98 ${
              copiedType === 'direct'
                ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5" />
              <span className="font-medium text-[11px]">Direct App URL Only</span>
            </div>
            {copiedType === 'direct' ? (
              <span className="text-[10px] text-emerald-400 font-bold">Copied! ✓</span>
            ) : (
              <span className="text-[10px] text-slate-500">Copy URL</span>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-500 pt-1">
            Friends opening the link will launch Iron30 with their own Telegram account.
          </p>
        </div>
      </div>
    </div>
  );
};
