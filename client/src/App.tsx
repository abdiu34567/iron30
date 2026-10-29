import React, { useState, useEffect, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { Challenge, LeaderboardUser, FriendProgress } from './types';
import { Header } from './components/Header';
import { AnalyticsBanner } from './components/AnalyticsBanner';
import { ChallengeSwitcher } from './components/ChallengeSwitcher';
import { ChallengeCard } from './components/ChallengeCard';
import { Leaderboard } from './components/Leaderboard';
import { CheckInModal } from './components/CheckInModal';
import { FriendProgressModal } from './components/FriendProgressModal';
import { CreateChallengeModal } from './components/CreateChallengeModal';
import { EditStartDateModal } from './components/EditStartDateModal';
import { ShareModal } from './components/ShareModal';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function App() {
  const { user, triggerHaptic, tg, isTelegram, startParam } = useTelegram();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [joining, setJoining] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);

  // Set of challenge IDs user has joined
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isCheckInOpen, setIsCheckInOpen] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditDateOpen, setIsEditDateOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
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
        setSelectedChallenge((prev) => {
          // If a deep-linked startParam matches, always prioritize it
          if (startParam) {
            const startMatch = json.data.find((c: Challenge) => c._id === startParam);
            if (startMatch) return startMatch;
          }
          if (!prev) return json.data[0];
          // Keep current selection if still valid, otherwise first
          const found = json.data.find((c: Challenge) => c._id === prev._id);
          return found || json.data[0];
        });
      }
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
    }
  }, [startParam]);

  // Fetch leaderboard for active challenge
  const fetchLeaderboard = useCallback(async (challengeId: string) => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/leaderboard`);
      const json = await res.json();
      if (json.success) {
        const board: LeaderboardUser[] = json.data || [];
        setLeaderboard(board);

        // Check if user is in this board
        if (board.some((p) => p.userId === user.id)) {
          setJoinedChallengeIds((prev) => new Set(prev).add(challengeId));
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, [user.id]);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchChallenges();
    setLoading(false);
  }, [fetchChallenges]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-switch to challenge if startParam is detected or updates
  useEffect(() => {
    if (startParam && challenges.length > 0) {
      const match = challenges.find((c) => c._id === startParam);
      if (match && selectedChallenge?._id !== match._id) {
        setSelectedChallenge(match);
      }
    }
  }, [startParam, challenges, selectedChallenge?._id]);

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

  // Join a challenge
  const handleJoinChallenge = async () => {
    if (!selectedChallenge) return;
    try {
      setJoining(true);
      triggerHaptic('medium');

      const res = await fetch(`/api/challenges/${selectedChallenge._id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.first_name,
          username: user.username,
          photoUrl: user.photo_url,
        }),
      });

      const json = await res.json();
      if (json.success) {
        triggerHaptic('success');
        setJoinedChallengeIds((prev) => new Set(prev).add(selectedChallenge._id));
        await Promise.all([fetchChallenges(), fetchLeaderboard(selectedChallenge._id)]);
      }
    } catch (err) {
      console.error('Failed to join challenge:', err);
    } finally {
      setJoining(false);
    }
  };

  // Submit check-in
  const handleCheckIn = async (count: number, note?: string) => {
    if (!selectedChallenge) return;

    const res = await fetch(`/api/challenges/${selectedChallenge._id}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        userName: user.first_name,
        username: user.username,
        photoUrl: user.photo_url,
        count,
        note,
      }),
    });

    const json = await res.json();
    if (json.success) {
      setJoinedChallengeIds((prev) => new Set(prev).add(selectedChallenge._id));
      await Promise.all([fetchChallenges(), fetchLeaderboard(selectedChallenge._id)]);
    } else {
      throw new Error(json.error || 'Failed to check in');
    }
  };

  // Update challenge start date
  const handleUpdateStartDate = async (challengeId: string, newStartDate: string) => {
    const res = await fetch(`/api/challenges/${challengeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: newStartDate, userId: user.id }),
    });

    const json = await res.json();
    if (json.success && json.data) {
      setSelectedChallenge(json.data);
      await Promise.all([fetchChallenges(), fetchLeaderboard(challengeId)]);
    } else {
      throw new Error(json.error || 'Failed to update starting date');
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

  // Share challenge to Telegram Group or Copy Link
  const handleShare = () => {
    triggerHaptic('light');
    setIsShareOpen(true);
  };

  // Current user's progress record & join status
  const currentUserProgress = leaderboard.find((p) => p.userId === user.id);
  const isJoined = Boolean(currentUserProgress || (selectedChallenge && joinedChallengeIds.has(selectedChallenge._id)));

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

        {/* Web browser mode info banner */}
        {!isTelegram && (
          <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-3 flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">🌐</span>
              <span className="text-slate-300">
                Web preview mode. Open via Telegram to sync your personal profile & streak!
              </span>
            </div>
            <a
              href="https://t.me/Iron30Bot/app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-[11px] shrink-0 ml-2 shadow-md shadow-blue-600/30 active:scale-95 transition-all"
            >
              Open in TG
            </a>
          </div>
        )}

        {/* Group Analytics Dropdown/Banner */}
        {showAnalytics && selectedChallenge && (
          <AnalyticsBanner
            challenges={challenges}
            selectedChallenge={selectedChallenge}
            participants={leaderboard}
          />
        )}

        {/* Option A: Segmented Carousel Switcher for Multiple Challenges */}
        {challenges.length > 0 && selectedChallenge && (
          <ChallengeSwitcher
            challenges={challenges}
            selectedChallengeId={selectedChallenge._id}
            onSelect={(c) => setSelectedChallenge(c)}
            onOpenCreate={() => setIsCreateOpen(true)}
            joinedChallengeIds={joinedChallengeIds}
            triggerHaptic={triggerHaptic}
          />
        )}

        {/* Main Challenge Card */}
        {loading ? (
          <div className="h-64 rounded-3xl bg-slate-900/60 animate-pulse border border-slate-800" />
        ) : selectedChallenge ? (
          <ChallengeCard
            challenge={selectedChallenge}
            currentUserProgress={currentUserProgress}
            isJoined={isJoined}
            joining={joining}
            currentUserId={user.id}
            onJoin={handleJoinChallenge}
            onOpenCheckIn={() => {
              triggerHaptic('light');
              setIsCheckInOpen(true);
            }}
            onShare={handleShare}
            onOpenEditDate={() => {
              triggerHaptic('light');
              setIsEditDateOpen(true);
            }}
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
            aria-label="Refresh Leaderboard"
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
            currentUserId={user.id}
            onNudge={handleNudge}
            onOpenCheckIn={() => {
              setIsFriendModalOpen(false);
              setIsCheckInOpen(true);
            }}
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

        {selectedChallenge && (
          <EditStartDateModal
            challenge={selectedChallenge}
            isOpen={isEditDateOpen}
            onClose={() => setIsEditDateOpen(false)}
            onUpdateStartDate={handleUpdateStartDate}
            triggerHaptic={triggerHaptic}
          />
        )}

        {selectedChallenge && (
          <ShareModal
            challenge={selectedChallenge}
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            triggerHaptic={triggerHaptic}
          />
        )}
      </div>
    </div>
  );
}

export default App;
