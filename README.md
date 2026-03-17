# 🎨 Skrrible.io

A real-time multiplayer drawing and guessing game — a Scribble.io clone built with **React**, **Node.js**, and **Socket.IO**.

---

## 🌐 Live Demo

> **Link:** https://skribbleio.netlify.app/
---

## ✨ Features

- 🏠 **Room System** — Create a private room or join one with a code
- ⚙️ **Customisable Settings** — Set rounds, draw time (30–120 s), max players, and hints before starting
- 🖊️ **Real-time Canvas** — Smooth freehand drawing synced to all players via WebSockets
- 🎨 **Drawing Tools** — Color picker, brush-size slider, eraser, clear canvas, and **undo**
- 💬 **Live Chat & Guessing** — Chat messages double as guesses; correct guesses are highlighted
- 🔑 **Progressive Hints** — Letters revealed gradually for guessers (configurable count)
- ⏱️ **Per-turn Timer** — Countdown bar; auto-skips if no word is chosen within 15 s
- 🏆 **Scoring** — Time-based score for guessers; drawer earns bonus points per correct guess
- 📋 **Leaderboard** — Full ranked results shown at game end with scores

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Backend | Node.js, Express 5 |
| Real-time | Socket.IO 4 |
| Styling | Tailwind CSS (utility-first) |

---

## 📁 Project Structure

```
skriible/
├── backend/
│   ├── contoller/
│   │   ├── gameManager.js   # Game phases, scoring, hints, timers
│   │   ├── roomManager.js   # Room creation, player management
│   │   └── wordList.js      # Word bank
│   ├── socket/
│   │   └── socketHandler.js # All Socket.IO event handlers
│   ├── server.js            # Express + Socket.IO entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Canvas.jsx   # Drawing canvas with tools & undo
    │   │   ├── Chat.jsx     # Chat / guess input
    │   │   ├── GameOver.jsx # End-of-game leaderboard screen
    │   │   └── LeaderBoard.jsx
    │   ├── hooks/
    │   │   └── socketHandler.js  # Custom hook for all game socket events
    │   ├── utils/
    │   │   └── socket.js    # Socket.IO client instance
    │   ├── App.jsx          # Lobby / room entry screen
    │   ├── Home.jsx         # In-game layout (canvas + chat + players)
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## 🚀 Local Setup

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### 1. Clone the repository

```bash
git clone https://github.com/kushalpal/skriible.git
cd skriible
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (currently not required — the server runs on port `3000` by default):

```env
PORT=3000
```

Start the backend:

```bash
# Development (auto-restart with nodemon)
npm run dev

# Production
npm start
```

The server will be running at `http://localhost:3000`.

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_BACKEND_URL=http://localhost:3000
```

Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## ☁️ Deployment

### Backend — [Render](https://render.com) 

1. Push the repo to GitHub.
2. Create a **new Web Service** pointing to the `backend/` directory.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add environment variable if needed: `PORT=3000`
6. Copy the deployed URL (e.g. `https://skriible-backend.onrender.com`).

### Frontend — [Vercel](https://vercel.com)

1. Import the repo in Vercel.
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   ```
   VITE_BACKEND_URL=https://skriible-backend.onrender.com
   ```
4. Deploy — Vercel will run `npm run build` and serve the `dist/` folder.

---

## 🎮 How to Play

1. **Open the app** and enter your name.
2. **Create a room** (configure rounds, draw time, hints) or **join** with a room code.
3. The host clicks **Start Game**.
4. Each round the **drawer** picks from 3 random words and draws on the canvas.
5. **Guessers** type in the chat — correct guesses earn points based on how fast you guessed.
6. The drawer earns bonus points for each person who correctly guesses.
7. Hints (partially revealed letters) appear at timed intervals for guessers.
8. After all rounds, the **leaderboard** ranks everyone by score.

---

## ⚙️ Room Settings

| Setting | Default | Range |
|---------|---------|-------|
| Rounds | 3 | 1 – 10 |
| Draw time | 80 s | 30 / 60 / 80 / 90 / 120 s |
| Max players | 8 | 2 – 8 |
| Hints | On | On / Off |
| No. of hints | 3 | 1 – 5 |

---

## 🔌 Socket.IO Event Reference

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `create-room` | `{ name, settings }` | Create a new room |
| `join-room` | `{ roomId, name }` | Join an existing room |
| `start-game` | `{ roomId }` | Host starts the game |
| `pick-word` | `{ roomId, word }` | Drawer picks a word |
| `draw` | `{ roomId, x, y, color, size, type }` | Draw event |
| `clear-canvas` | `{ roomId }` | Clear the canvas |
| `undo-canvas` | `{ roomId, imageData }` | Undo last stroke |
| `chat-message` | `{ roomId, message }` | Send a chat / guess |

### Server → Client

| Event | Description |
|-------|-------------|
| `room-created` / `room-joined` | Room entry confirmation |
| `game-started` | Game begins, sends player list & total rounds |
| `new-turn` | New turn with drawer info |
| `word-choices` | 3 word options sent to the drawer only |
| `your-turn` | Current word sent to the drawer |
| `drawing-started` | Masked word & word length sent to guessers |
| `timer` | Countdown tick (every second) |
| `hint` | Progressive letter reveal for guessers |
| `correct-guess` | Sent to the guesser who got it right |
| `player-guessed` | Broadcast score update |
| `turn-ended` | Revealed word + updated scores |
| `game-over` | Final leaderboard |
| `draw` | Broadcast drawing coordinates |
| `clear-canvas` | Broadcast canvas clear |
| `undo-canvas` | Broadcast undo state |

---

## 📄 License

This project is licensed under the **ISC License**.

---

<div align="center">
  Made with ❤️ — inspired by <a href="https://skribbl.io">skribbl.io</a>
</div>
