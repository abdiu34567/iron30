import React, { useState } from 'react';
import { Challenge, LeaderboardUser } from '../types';
import { Flame, Trophy, Users, Target, TrendingUp, Sparkles } from 'lucide-react';

interface AnalyticsBannerProps {
  challenges: Challenge[];
  selectedChallenge: Challenge;
  participants: LeaderboardUser[];
}

export const AnalyticsBanner: React.FC<AnalyticsBannerProps> = ({
  challenges,
  selectedChallenge,
  participants,
}) => {
  const [viewMode, setViewMode] = useState<'squad' | 'challenge'>('squad');

  // --- SQUAD-WIDE METRICS (Across all challenges) ---
  const totalChallenges = challenges.length;
  const totalEnrollments = challenges.reduce((sum, c) => sum + (c.participantCount || 0), 0);

  // Calculate average completion rate across all active challenges
  const challengeRates = challenges.map((c) => {
    const totalTarget = c.targetCount * Math.max(1, c.participantCount);
    return Math.min(100, Math.round(((c.totalCompletedCount || 0) / totalTarget) * 100));
  });
  const avgSquadCompletion =
    challengeRates.length > 0
      ? Math.round(challengeRates.reduce((a, b) => a + b, 0) / challengeRates.length)
      : 0;

  // Streaks
  const maxStreak = Math.max(0, ...participants.map((p) => p.currentStreak || 0));
  const avgStreak =
    participants.length > 0
      ? Math.round(participants.reduce((sum, p) => sum + (p.currentStreak || 0), 0) / participants.length)
      : 0;

  // --- CURRENT CHALLENGE METRICS ---
  const challengeTotal = selectedChallenge.totalCompletedCount || 0;
  const challengeParticipantCount = selectedChallenge.participantCount || participants.length || 0;
  const challengeTargetTotal = selectedChallenge.targetCount * Math.max(1, challengeParticipantCount);
  const challengePercentage =
    challengeTargetTotal > 0
      ? Math.min(100, Math.round((challengeTotal / challengeTargetTotal) * 100))
      : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-xl">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Group Analytics Pulse
            </h3>
            <span className="text-[10px] text-slate-400">Live group consistency & activity</span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center p-0.5 bg-slate-950 rounded-xl border border-slate-800/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('squad')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              viewMode === 'squad'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Habits ({totalChallenges})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('challenge')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all truncate max-w-[130px] ${
              viewMode === 'challenge'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            This Challenge
          </button>
        </div>
      </div>

      {/* METRIC GRIDS */}
      {viewMode === 'squad' ? (
        <>
          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span>Active Challenges</span>
              </div>
              <div className="text-xl font-black text-white">
                {totalChallenges}{' '}
                <span className="text-xs font-normal text-slate-400">habits</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Running in this group
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Squad Enrollments</span>
              </div>
              <div className="text-xl font-black text-white">
                {totalEnrollments}{' '}
                <span className="text-xs font-normal text-slate-400">spots</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Friends actively building habits
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Top Squad Streak</span>
              </div>
              <div className="text-xl font-black text-white flex items-center gap-1">
                {maxStreak} <span className="text-xs font-normal text-slate-400">days</span>
              </div>
              <div className="text-[10px] text-orange-400/80 mt-0.5">
                {maxStreak > 0 ? 'Consecutive consistency 🔥' : 'Start your streak today!'}
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                <span>Group Success Rate</span>
              </div>
              <div className="text-xl font-black text-white">
                {avgSquadCompletion}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Average goal completion
              </div>
            </div>
          </div>

          {/* Squad Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Overall Squad Milestone Progress</span>
              <span className="font-bold text-slate-200">{avgSquadCompletion}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${avgSquadCompletion}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Total {selectedChallenge.unit}</span>
              </div>
              <div className="text-xl font-black text-white">
                {challengeTotal.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">{selectedChallenge.unit}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Logged by group members
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Avg Streak</span>
              </div>
              <div className="text-xl font-black text-white flex items-center gap-1">
                {avgStreak} <span className="text-xs font-normal text-slate-400">days</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                In this challenge
              </div>
            </div>
          </div>

          {/* Challenge Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Group Target Completion</span>
              <span className="font-bold text-slate-200">{challengePercentage}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${challengePercentage}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
