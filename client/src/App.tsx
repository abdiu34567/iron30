import React, { useState, useEffect, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { Challenge, LeaderboardUser, FriendProgress } from './types';
import { Header } from './components/Header';
import { AnalyticsBanner } from './components/AnalyticsBanner';
import { ChallengeCard } from './components/ChallengeCard';
import { Leaderboard } from './components/Leaderboard';
import { CheckInModal } from './components/CheckInModal';
import { FriendProgressModal } from './components/FriendProgressModal';
import { CreateChallengeModal } from './components/CreateChallengeModal';
import { RefreshCw, Trophy, Flame, AlertCircle } from 'lucide-react';

export function App() {
  const { user, triggerHaptic, tg } = useTelegram();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);

  // Modals state
  const [isCheckInOpen, setIsCheckInOpen] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedFriendProgress, setSelectedFriendProgress] = useState<FriendProgress | null>(null);
  const [isFriendModalOpen, setIsFriendModalOpen] = useState<boolean>(false);
  const [loadingFriend, setLoadingFriend] = useState<boolean>(false);

  // Fetch all challenges
  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch('/api/challenges');
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setChallenges(json.data);
        // Default to the first active challenge (e.g. 3000 pushups)
        setSelectedChallenge((prev) => prev || json.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
    }
  }, []);

  // Fetch leaderboard for active challenge
  const fetchLeaderboard = useCallback(async (challengeId: string) => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/leaderboard`);
      const json = await res.json();
      if (json.success) {
        setLeaderboard(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, []);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchChallenges();
    setLoading(false);
  }, [fetchChallenges]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When selected challenge changes, load its leaderboard
  useEffect(() => {
    if (selectedChallenge?._id) {
      fetchLeaderboard(selectedChallenge._id);
    }
  }, [selectedChallenge?._id, fetchLeaderboard]);

  // Handle Refresh
  const handleRefresh = async () => {
    triggerHaptic('light');
    setRefreshing(true);
    if (selectedChallenge?._id) {
      await Promise.all([fetchChallenges(), fetchLeaderboard(selectedChallenge._id)]);
    } else {
      await fetchChallenges();
    }
    setRefreshing(false);
  };

  // Submit check-in
  const handleCheckIn = async (count: number, note?: string) => {
    if (!selectedChallenge) return;

    const res = await fetch(`/api/challenges/${selectedChallenge._id}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        count,
        note,
      }),
    });

    const json = await res.json();
    if (json.success) {
      // Refresh challenge tally and leaderboard
      await Promise.all([fetchChallenges(), fetchLeaderboard(selectedChallenge._id)]);
    } else {
      throw new Error(json.error || 'Failed to check in');
    }
  };

  // Open specific friend progress modal
  const handleSelectUser = async (userId: number) => {
    if (!selectedChallenge) return;
    try {
      triggerHaptic('light');
      setLoadingFriend(true);
      const res = await fetch(
        `/api/challenges/${selectedChallenge._id}/participants/${userId}/progress`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedFriendProgress(json.data);
        setIsFriendModalOpen(true);
      }
    } catch (e) {
      console.error('Failed to load friend progress:', e);
    } finally {
      setLoadingFriend(false);
    }
  };

  // Nudge a friend
  const handleNudge = async (friendUserId: number, friendName: string) => {
    if (!selectedChallenge) return;
    await fetch(
      `/api/challenges/${selectedChallenge._id}/participants/${friendUserId}/nudge`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserName: user.first_name,
        }),
      }
    );
  };

  // Share challenge to Telegram Group
  const handleShare = () => {
    triggerHaptic('medium');
    const text = encodeURIComponent(
      `🔥 Join me in the "${selectedChallenge?.title}" challenge on Iron30! Let's crush this together:`
    );
    const url = encodeURIComponent(window.location.origin);
    const tgShareUrl = `https://t.me/share/url?url=${url}&text=${text}`;

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(tgShareUrl);
    } else {
      window.open(tgShareUrl, '_blank');
    }
  };

  // Current user's progress record
  const currentUserProgress = leaderboard.find((p) => p.userId === user.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-blue-600">
      <div className="w-full max-w-md px-4 py-5 space-y-5 pb-24">
        {/* Header */}
        <Header
          user={user}
          onOpenCreate={() => {
            triggerHaptic('light');
            setIsCreateOpen(true);
          }}
          showAnalytics={showAnalytics}
          onToggleAnalytics={() => {
            triggerHaptic('light');
            setShowAnalytics(!showAnalytics);
          }}
        />

        {/* Group Analytics Dropdown/Banner */}
        {showAnalytics && selectedChallenge && (
          <AnalyticsBanner
            challenge={selectedChallenge}
            participants={leaderboard}
          />
        )}

        {/* Challenge selector pills if multiple exist */}
        {challenges.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {challenges.map((c) => (
              <button
                key={c._id}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedChallenge(c);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedChallenge?._id === c._id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}

        {/* Main Challenge Card */}
        {loading ? (
          <div className="h-64 rounded-3xl bg-slate-900/60 animate-pulse border border-slate-800" />
        ) : selectedChallenge ? (
          <ChallengeCard
            challenge={selectedChallenge}
            currentUserProgress={currentUserProgress}
            onOpenCheckIn={() => {
              triggerHaptic('light');
              setIsCheckInOpen(true);
            }}
            onShare={handleShare}
          />
        ) : (
          <div className="text-center py-12 bg-slate-900/50 rounded-3xl border border-slate-800 p-6">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white mb-1">No Active Challenges</h3>
            <p className="text-xs text-slate-400 mb-4">
              Be the first to create a challenge for your group!
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
            >
              Create Challenge
            </button>
          </div>
        )}

        {/* Friends Leaderboard */}
        {selectedChallenge && (
          <Leaderboard
            participants={leaderboard}
            currentUserId={user.id}
            unit={selectedChallenge.unit}
            onSelectUser={handleSelectUser}
          />
        )}

        {/* Bottom Floating Refresh Button */}
        <div className="fixed bottom-5 right-5 z-20">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 rounded-full bg-slate-850/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 shadow-xl backdrop-blur-md active:scale-90 transition-all"
            title="Refresh Leaderboard"
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? 'animate-spin text-blue-400' : ''}`}
            />
          </button>
        </div>

        {/* Modals */}
        {selectedChallenge && (
          <CheckInModal
            isOpen={isCheckInOpen}
            onClose={() => setIsCheckInOpen(false)}
            onSubmit={handleCheckIn}
            unit={selectedChallenge.unit}
            dailyGoal={selectedChallenge.dailyGoal}
            triggerHaptic={triggerHaptic}
          />
        )}

        {selectedChallenge && (
          <FriendProgressModal
            isOpen={isFriendModalOpen}
            onClose={() => setIsFriendModalOpen(false)}
            progress={selectedFriendProgress}
            unit={selectedChallenge.unit}
            onNudge={handleNudge}
            triggerHaptic={triggerHaptic}
          />
        )}

        <CreateChallengeModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          user={user}
          onCreated={(newId) => {
            fetchChallenges();
          }}
          triggerHaptic={triggerHaptic}
        />
      </div>
    </div>
  );
}

export default App;
