import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import healthRoutes from './routes/healthRoutes';
import challengeRoutes from './routes/challengeRoutes';
import progressRoutes from './routes/progressRoutes';
import { setupBot } from './bot/bot';

import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/challenges', progressRoutes);

// Serve compiled React frontend in production or if client/dist exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`📦 Serving static client from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Fallback error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

async function bootstrap() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start Express HTTP Server
    app.listen(port, () => {
      console.log(`🚀 Auto-Challenges API server running on http://localhost:${port}`);
    });

    // Initialize Telegram Bot & Cron
    setupBot();
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

bootstrap();
