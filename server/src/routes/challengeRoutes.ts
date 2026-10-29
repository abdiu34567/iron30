import { Router, Request, Response } from 'express';
import { ChallengeService } from '../services/challengeService';

const router = Router();

// GET all challenges
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const challenges = await ChallengeService.getChallenges(status);
    res.json({ success: true, data: challenges });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET challenge by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const challenge = await ChallengeService.getChallengeById(id);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }
    res.json({ success: true, data: challenge });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create a new challenge
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      targetCount,
      unit,
      dailyGoal,
      durationDays,
      startDate,
      creatorTelegramId,
      creatorName,
      creatorUsername,
      creatorPhotoUrl,
      telegramChatId,
    } = req.body;

    if (!title || !description || !targetCount || !creatorTelegramId || !creatorName) {
      return res.status(400).json({
        success: false,
        error: 'title, description, targetCount, creatorTelegramId, and creatorName are required',
      });
    }

    const challenge = await ChallengeService.createChallenge({
      title,
      description,
      targetCount: Number(targetCount),
      unit,
      dailyGoal: dailyGoal ? Number(dailyGoal) : undefined,
      durationDays: durationDays ? Number(durationDays) : 30,
      startDate: startDate ? new Date(startDate) : undefined,
      creatorTelegramId: Number(creatorTelegramId),
      creatorName,
      creatorUsername,
      creatorPhotoUrl,
      telegramChatId: telegramChatId ? Number(telegramChatId) : undefined,
    });

    res.status(201).json({ success: true, data: challenge });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH update challenge (e.g., startDate, title, description)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { startDate, title, description, dailyGoal, durationDays } = req.body;

    const challenge = await ChallengeService.updateChallenge(id, {
      startDate: startDate ? new Date(startDate) : undefined,
      title,
      description,
      dailyGoal: dailyGoal ? Number(dailyGoal) : undefined,
      durationDays: durationDays ? Number(durationDays) : undefined,
    });

    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    res.json({ success: true, data: challenge });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST join a challenge
router.post('/:id/join', async (req: Request, res: Response) => {
  try {
    const { userId, userName, username, photoUrl } = req.body;

    if (!userId || !userName) {
      return res.status(400).json({
        success: false,
        error: 'userId and userName are required to join',
      });
    }

    const participant = await ChallengeService.joinChallenge({
      challengeId: req.params.id as string,
      userId: Number(userId),
      userName,
      username,
      photoUrl,
    });

    res.json({ success: true, data: participant });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET challenge leaderboard
router.get('/:id/leaderboard', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const leaderboard = await ChallengeService.getLeaderboard(id);
    res.json({ success: true, data: leaderboard });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
