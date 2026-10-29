export interface Challenge {
  _id: string;
  title: string;
  description: string;
  targetCount: number;
  unit: string;
  dailyGoal: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  creatorTelegramId: number;
  status: 'upcoming' | 'active' | 'completed';
  participantCount: number;
  totalCompletedCount: number;
  createdAt: string;
}

export interface LeaderboardUser {
  rank: number;
  userId: number;
  userName: string;
  username?: string;
  photoUrl?: string;
  totalProgress: number;
  progressPercentage: number;
  currentStreak: number;
  lastCheckInDate?: string;
  status: string;
}

export interface DayHeatmapItem {
  dayNumber: number;
  date: string;
  targetCount: number;
  loggedCount: number;
  status: 'completed' | 'partial' | 'missed' | 'future' | 'today';
}

export interface FriendProgress {
  participant: {
    userId: number;
    userName: string;
    username?: string;
    photoUrl?: string;
    totalProgress: number;
    targetCount: number;
    progressPercentage: number;
    currentStreak: number;
    bestStreak: number;
    status: string;
    joinedAt: string;
  };
  stats: {
    dailyAverage: number;
    daysElapsed: number;
    daysRemaining: number;
    expectedProgress: number;
    isOnTrack: boolean;
    remainingToGoal: number;
  };
  heatmap: DayHeatmapItem[];
  recentLogs: Array<{
    id: string;
    count: number;
    date: string;
    note?: string;
    createdAt: string;
  }>;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}
