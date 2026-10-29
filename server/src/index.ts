import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import healthRoutes from './routes/healthRoutes';
import challengeRoutes from './routes/challengeRoutes';
import progressRoutes from './routes/progressRoutes';
import { setupBot } from './bot/bot';
import { ChallengeService } from './services/challengeService';

import path from 'path';
import fs from 'fs';

dotenv.config();

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/challenges', progressRoutes);

// Serve OG banner image
const bannerPath = path.resolve(__dirname, '../assets/og-banner.jpg');
const clientBannerPath = path.resolve(__dirname, '../../client/public/og-banner.jpg');
app.get('/og-banner.jpg', (req: express.Request, res: express.Response) => {
  if (fs.existsSync(bannerPath)) {
    return res.sendFile(bannerPath);
  }
  if (fs.existsSync(clientBannerPath)) {
    return res.sendFile(clientBannerPath);
  }
  res.status(404).send('Banner not found');
});

// Challenge OpenGraph Link Preview & Redirect route (/c/:id)
app.get('/c/:id', async (req: express.Request, res: express.Response) => {
  try {
    const id = String(req.params.id);
    const challenge = await ChallengeService.getChallengeById(id);

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'Iron30Bot';
    const appShortName = process.env.TELEGRAM_APP_SHORT_NAME || 'app';
    const tgAppUrl = `https://t.me/${botUsername}/${appShortName}?startapp=${id}`;

    if (!challenge) {
      return res.redirect(`https://t.me/${botUsername}/${appShortName}`);
    }

    const host = req.get('host') || 'iron30.onrender.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const canonicalUrl = `${protocol}://${host}/c/${id}`;
    const imageUrl = `${protocol}://${host}/og-banner.jpg`;

    const participantCount = challenge.participantCount || 2;
    const title = `🔥 ${challenge.title} — Iron30 Squad Challenge`;
    const description = `🎯 Target: ${challenge.targetCount.toLocaleString()} ${challenge.unit} (${challenge.dailyGoal.toLocaleString()} / day) · ${challenge.durationDays} Days · ${participantCount} Squad Members. Accept & compete on Telegram!`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  
  <!-- Open Graph / Telegram / WhatsApp / Discord Link Preview -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:site_name" content="Iron30 Challenge" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="675" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@Iron30Bot" />
  <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />

  <!-- JavaScript redirect for human browsers (does not run on preview bot crawlers) -->
  <script>
    if (!/bot|crawler|spider|facebookexternalhit|telegrambot|whatsapp|twitterbot|discordbot/i.test(navigator.userAgent)) {
      window.location.replace("${escapeHtml(tgAppUrl)}");
    }
  </script>
  <style>
    body {
      background-color: #0b1120;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 24px;
      padding: 28px 24px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .banner-img {
      width: 100%;
      border-radius: 16px;
      margin-bottom: 20px;
      border: 1px solid #334155;
      aspect-ratio: 16 / 9;
      object-fit: cover;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 12px 0;
      color: #ffffff;
    }
    p {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.5;
      margin: 0 0 24px 0;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      color: #ffffff;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 16px;
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);
      transition: transform 0.1s ease;
    }
    .btn:active {
      transform: scale(0.97);
    }
    .note {
      margin-top: 16px;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="${escapeHtml(imageUrl)}" alt="Iron30 Challenge" class="banner-img" />
    <div class="badge">Iron30 Squad Challenge</div>
    <h1>${escapeHtml(challenge.title)}</h1>
    <p>${escapeHtml(description)}</p>
    <a href="${escapeHtml(tgAppUrl)}" class="btn">
      🛡️ Open in Telegram
    </a>
    <div class="note">Opening Telegram Mini App...</div>
  </div>
</body>
</html>`);
  } catch (err) {
    console.error('Error generating challenge preview:', err);
    res.redirect('https://t.me/Iron30Bot/app');
  }
});

// Serve compiled React frontend in production or if client/dist exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`📦 Serving static client from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/c/')) {
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
      console.log(`🚀 Iron30 API server running on http://localhost:${port}`);
    });

    // Initialize Telegram Bot & Cron
    setupBot();
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

bootstrap();
