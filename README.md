# Iron30 🛡️
> A Telegram Mini App & Bot for group challenges and unbreakable habits (*3,000 Pushups in 30 Days*, reading, coding, meditation) with live leaderboards, 30-day consistency heatmaps, and friend progress tracking.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** v20+
- **MongoDB** (Local instance or MongoDB Atlas cloud cluster)

### 2. Environment Setup
Configure [`server/.env`](server/.env):
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/iron30        # Or your MongoDB Atlas URI
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather     # Optional during local web preview
WEBAPP_URL=http://localhost:5173
GROUP_CHAT_ID=                                        # Target Telegram group ID for daily bot message
DAILY_MESSAGE_CRON=0 9 * * *                          # Runs daily at 09:00 AM
```

### 3. Seed Sample Data
Initialize the database with the **"3000 Pushups in 30 Days"** challenge and mock friends:
```bash
npm run seed
```

### 4. Run Development Servers
Open two terminals or run:
```bash
# Terminal 1: Backend API & Bot
npm run dev:server

# Terminal 2: Vite React Mini App
npm run dev:client
```
Visit `http://localhost:5173` to test the Mini App directly in your browser with responsive Telegram simulation!

---

## 🤖 Setting Up the Telegram Bot & Mini App

### Step 1: Create Your Bot
1. Open Telegram and search for [`@BotFather`](https://t.me/BotFather).
2. Send `/newbot`, name your bot (e.g., `Iron30`), and choose a username (e.g., `Iron30Bot` or similar).
3. Copy the HTTP API token into `server/.env` under `TELEGRAM_BOT_TOKEN`.

### Step 2: Configure the Mini App
1. In `@BotFather`, send `/newapp`.
2. Select your newly created bot.
3. Enter title: `Iron30` and a short description: *Forge unbreakable habits in 30 days with friends*.
4. Upload a 640x360 app icon.
5. Provide your Mini App URL:
   - For local testing on Telegram mobile: run `ngrok http 5173` and use the HTTPS ngrok URL.
   - For production: paste your Render HTTPS URL (e.g., `https://iron30.onrender.com`).
6. `@BotFather` will give you a direct link: `t.me/YourBot/app`!

### Step 3: Add to Your Telegram Group
1. Add your bot to your friends' Telegram group.
2. Promote the bot to Administrator (so it has permission to post messages).
3. Set `GROUP_CHAT_ID` in `server/.env`.
4. The bot will automatically post daily morning check-in reminders with an inline `[ 🛡️ Open Iron30 & Check In ]` button!

---

## 📱 Features

1. **Clean Group Integration**:
   - Zero chat spam: All check-ins and streaks are managed inside the Telegram Mini App.
   - 1 daily morning message + evening leaderboard recap sent to the group by the bot.
2. **1-Tap Check-In**:
   - Quick presets (`+25`, `+50`, `+100`) or custom numbers with optional motivational notes.
   - Instant tactile haptic feedback.
3. **Friend Progress Inspection**:
   - Tap any friend on the leaderboard to view:
     - **30-Day Consistency Heatmap Grid** (Green = goal met, Yellow = partial, Red = missed).
     - **Pace Analytics**: On-track status, daily average, current & best streak.
     - **Activity History**: Reverse-chronological logs and workout notes.
     - **Friendly Nudges**: Ping friends who haven't logged today.
4. **Universal Challenge Creation**:
   - Create new challenges for pushups, squats, running, coding, reading, or meditation with custom targets and daily goals.
