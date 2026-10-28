import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, disconnectDatabase } from '../config/database';
import { Challenge } from '../models/Challenge';
import { Participant } from '../models/Participant';
import { CheckInLog } from '../models/CheckInLog';
import { User } from '../models/User';
import { ProgressService } from '../services/progressService';

async function seed() {
  console.log('🌱 Starting database seed...');
  await connectDatabase();

  // Clear existing challenge data for clean test
  await Challenge.deleteMany({});
  await Participant.deleteMany({});
  await CheckInLog.deleteMany({});
  await User.deleteMany({});

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 12); // Started 12 days ago

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 30); // 30 day duration

  // 1. Create Challenge
  const challenge = await Challenge.create({
    title: '3000 Pushups in 30 Days',
    description: 'Crush 100 pushups every single day with friends. No excuses, let’s build iron discipline together!',
    targetCount: 3000,
    unit: 'pushups',
    dailyGoal: 100,
    durationDays: 30,
    startDate,
    endDate,
    creatorTelegramId: 1001,
    status: 'active',
    participantCount: 3,
    totalCompletedCount: 3500,
  });

  console.log(`✅ Created Challenge: "${challenge.title}" (ID: ${challenge._id})`);

  // 2. Mock Users
  const users = [
    {
      id: 1001,
      name: 'Abdi',
      username: 'abdi_codes',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      totalProgress: 1250,
      streak: 12,
    },
    {
      id: 1002,
      name: 'Alex Rivera',
      username: 'alex_r',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      totalProgress: 1450,
      streak: 12,
    },
    {
      id: 1003,
      name: 'Sara Chen',
      username: 'sarachen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      totalProgress: 800,
      streak: 7,
    },
  ];

  for (const u of users) {
    await User.create({
      telegramId: u.id,
      firstName: u.name,
      username: u.username,
      photoUrl: u.avatar,
    });

    const participant = await Participant.create({
      challengeId: challenge._id,
      userId: u.id,
      userName: u.name,
      username: u.username,
      photoUrl: u.avatar,
      totalProgress: u.totalProgress,
      currentStreak: u.streak,
      bestStreak: u.streak,
      lastCheckInDate: ProgressService.formatDate(now),
      status: 'active',
      joinedAt: startDate,
    });

    // Generate check-in history across past 12 days
    for (let dayOffset = 0; dayOffset <= 12; dayOffset++) {
      const logDate = new Date(startDate);
      logDate.setDate(startDate.getDate() + dayOffset);
      const dateStr = ProgressService.formatDate(logDate);

      // Vary counts realistically
      let count = 100;
      let note = 'Daily 100 completed!';

      if (u.id === 1002 && dayOffset % 3 === 0) {
        count = 120;
        note = 'Feeling energized, extra 20 reps! 🔥';
      } else if (u.id === 1003 && dayOffset === 4) {
        count = 50;
        note = 'Tough day, squeezed in 50 before bed';
      } else if (u.id === 1003 && dayOffset === 9) {
        continue; // Missed day to show heatmap distinction
      }

      await CheckInLog.create({
        challengeId: challenge._id,
        participantId: participant._id,
        userId: u.id,
        count,
        date: dateStr,
        note,
        createdAt: logDate,
      });
    }

    console.log(`✅ Seeded Participant: ${u.name} (Total: ${u.totalProgress})`);
  }

  console.log('🎉 Database seeding complete!');
  await disconnectDatabase();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
