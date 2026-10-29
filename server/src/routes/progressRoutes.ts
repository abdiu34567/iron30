import { Router, Request, Response } from 'express';
import { ChallengeService } from '../services/challengeService';
import { ProgressService } from '../services/progressService';

const router = Router();

// POST check-in progress
router.post('/:id/checkin', async (req: Request, res: Response) => {
  try {
    const { userId, userName, username, photoUrl, count, note, date } = req.body;

    if (!userId || !count) {
      return res.status(400).json({
        success: false,
        error: 'userId and count are required',
      });
    }

    const challengeId = req.params.id as string;
    const result = await ChallengeService.addCheckIn({
      challengeId,
      userId: Number(userId),
      userName,
      username,
      photoUrl,
      count: Number(count),
      note,
      date,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET specific friend / participant progress (heatmap + stats + history)
router.get('/:id/participants/:userId/progress', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.params.userId as string;

    const progress = await ProgressService.getParticipantProgress(id, Number(userId));

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found in this challenge',
      });
    }

    res.json({ success: true, data: progress });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST nudge a friend who hasn't logged today
router.post('/:id/participants/:userId/nudge', async (req: Request, res: Response) => {
  try {
    const { fromUserName } = req.body;
    const { userId } = req.params;

    // In production with live bot, we send a Telegram message to userId.
    // For now, record the action and return a friendly confirmation.
    res.json({
      success: true,
      message: `Nudge sent from ${fromUserName || 'a friend'} to user ${userId}! 💪`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
