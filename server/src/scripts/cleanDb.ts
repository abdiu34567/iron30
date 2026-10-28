import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, disconnectDatabase } from '../config/database';
import { Challenge } from '../models/Challenge';
import { Participant } from '../models/Participant';
import { CheckInLog } from '../models/CheckInLog';
import { User } from '../models/User';

async function cleanAndInit() {
  console.log('🧹 Cleaning up mock data from MongoDB...');
  await connectDatabase();

  // Clear all mock participants, logs, and users
  const deletedLogs = await CheckInLog.deleteMany({});
  const deletedParticipants = await Participant.deleteMany({});
  const deletedUsers = await User.deleteMany({});
  const deletedChallenges = await Challenge.deleteMany({});

  console.log(`🗑️ Removed ${deletedUsers.deletedCount} users, ${deletedParticipants.deletedCount} participants, ${deletedLogs.deletedCount} check-in logs.`);

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 30);

  // Create clean initial "3000 Pushups in 30 Days" challenge with 0 participants
  const challenge = await Challenge.create({
    title: '3000 Pushups in 30 Days',
    description: 'Crush 100 pushups every single day with friends. No excuses, let’s build iron discipline together!',
    targetCount: 3000,
    unit: 'pushups',
    dailyGoal: 100,
    durationDays: 30,
    startDate: now,
    endDate: endDate,
    creatorTelegramId: 0,
    status: 'active',
    participantCount: 0,
    totalCompletedCount: 0,
  });

  console.log(`✅ Created clean challenge: "${challenge.title}" (ID: ${challenge._id})`);
  console.log('🎉 Database is now 100% clean and ready for real Telegram users!');

  await disconnectDatabase();
}

cleanAndInit().catch((err) => {
  console.error('Database cleanup failed:', err);
  process.exit(1);
});
