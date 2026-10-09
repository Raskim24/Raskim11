# QuizBlast ⚡ - Real-time Multiplayer Kahoot-Style Quiz Platform

QuizBlast is a full-stack, real-time multiplayer quiz game where hosts project questions on a big screen and participants buzz in from their phones using 4 colorful tactile shapes (▲, ◆, ●, ■).

---

## 🌟 Key Features

1. **Host Live Control Screen:**
   - 6-digit Game PIN and real scannable QR Code for instant phone camera joining.
   - 3-second question previews, animated countdown timers, live answer counters.
   - Correct answer reveal with a 4-color answer distribution bar chart.
   - Top 5 leaderboard with animated scores and streak flames 🔥.
   - Olympic-style 3-tier podium finish with confetti celebration and CSV export.
   - On-screen "Simulate Phone" buzzer and "Add 3 Test Bots" for effortless solo testing.

2. **Mobile Player Experience:**
   - No account required. Join via Game PIN and choose a nickname & fun avatar.
   - 4 large tactile color buttons (Red Triangle, Blue Diamond, Yellow Circle, Green Square).
   - Instant feedback with points earned (Kahoot formula) and streak bonuses.

3. **AI Quiz Generator (Gemini):**
   - Automatically generate engaging quizzes from any topic, audience/grade level, and difficulty.

4. **Quiz Editor & Management:**
   - Create, edit, reorder, duplicate, and delete quizzes.
   - Supports 4-choice Multiple Choice and True/False questions.
   - Custom time limits (5s, 10s, 15s, 20s, 30s, 60s) and points (1000, 2000, 0).

5. **Supabase PostgreSQL Schema & RLS Rules:**
   - Complete production SQL schema with Row Level Security (`owner_id = auth.uid()`) and triggers.

---

## 🚀 Quick Start Guide (Local Setup)

### 1. Prerequisites
- Node.js (version 18 or 20+)
- npm or yarn

### 2. Installation
```bash
# Clone or unzip the project
cd quizblast

# Install dependencies
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your `GEMINI_API_KEY` (from Google AI Studio) if you wish to use the AI Quiz Generator.

### 4. Running the App
```bash
# Start full-stack development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- To test on your mobile phone on the same Wi-Fi: open `http://<YOUR_LOCAL_IP>:3000` on your phone!
- Or use the built-in **"Simulate Phone"** button right on the host screen to test side-by-side in one window!
