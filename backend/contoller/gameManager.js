const { getRandomWords } = require("./wordList");

const WORD_CHOICE_TIMEOUT = 15000; // 15s to pick a word
class GameManager {
    constructor(io, roomManager) {
        this.io = io;
        this.roomManager = roomManager;
        this.timers = new Map();     // roomId → interval ID
        this.wordTimers = new Map(); // roomId → word-choice timeout ID
    }
    startGame(roomId) {
        const room = this.roomManager.getRoom(roomId);
        if (!room) return;

        room.currentRound = 1;
        room.drawerIndex = 0;
        room.players.forEach(p => { p.score = 0; p.hasGuessed = false; });
        room.gameState = "choosing";

        this.io.to(roomId).emit("game-started", {
            totalRounds: room.settings.noOfRounds,
            players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
        });

        this.startChoosing(roomId);
    }
    startChoosing(roomId) {
        const room = this.roomManager.getRoom(roomId);
        if (!room) return;

        const drawer = room.players[room.drawerIndex];
        if (!drawer) { this.endGame(roomId); return; }

        const choices = getRandomWords(3);
        room.wordChoices = choices;
        room.gameState = "choosing";

        // Tell everyone who is drawing
        this.io.to(roomId).emit("new-turn", {
            drawerId: drawer.id,
            drawerName: drawer.name,
            round: room.currentRound,
            totalRounds: room.settings.noOfRounds,
        });

        // Give only the drawer the word choices
        this.io.to(drawer.id).emit("word-choices", { choices });

        // Auto-pick if no response
        const autoPickTimer = setTimeout(() => {
            if (room.gameState === "choosing") {
                this.beginDrawing(roomId, choices[0]);
            }
        }, WORD_CHOICE_TIMEOUT);
        this.wordTimers.set(roomId, autoPickTimer);
    }

    drawerPickedWord(roomId, word) {
        const room = this.roomManager.getRoom(roomId);
        if (!room || room.gameState !== "choosing") return;
        clearTimeout(this.wordTimers.get(roomId));
        this.wordTimers.delete(roomId);

        this.beginDrawing(roomId, word);
    }

    beginDrawing(roomId, word) {
        const room = this.roomManager.getRoom(roomId);
        if (!room) return;
        room.currentWord = word;
        room.gameState = "drawing";
        room.timeLeft = room.settings.duration;
        room.players.forEach(p => { p.hasGuessed = false; });
        const drawer = room.players[room.drawerIndex];
        const maskedWord = this.maskWord(word);
        this.io.to(drawer.id).emit("your-turn", { word });
        this.io.to(roomId).except(drawer.id).emit("drawing-started", {
            maskedWord,
            wordLength: word.length,
        });
        this.io.to(roomId).emit("timer", room.timeLeft);
        this.startTimer(roomId);
        this.scheduleHints(roomId);
    }
    startTimer(roomId) {
        this.clearTimer(roomId);
        const interval = setInterval(() => {
            const room = this.roomManager.getRoom(roomId);
            if (!room || room.gameState !== "drawing") {
                this.clearTimer(roomId);
                return;
            }
            room.timeLeft -= 1;
            this.io.to(roomId).emit("timer", room.timeLeft);

            if (room.timeLeft <= 0) {
                this.clearTimer(roomId);
                this.endTurn(roomId, false);
            }
        }, 1000);
        this.timers.set(roomId, interval);
    }

    clearTimer(roomId) {
        if (this.timers.has(roomId)) {
            clearInterval(this.timers.get(roomId));
            this.timers.delete(roomId);
        }
    }

    scheduleHints(roomId) {
        const room = this.roomManager.getRoom(roomId);
        if (!room || !room.settings.hints) return;

        const duration = room.settings.duration;
        const noOfHints = room.settings.noOfHints;
        const word = room.currentWord;
        const hiddenIndices = word.split("").map((_, i) => i);

        // Spread hints evenly across the turn duration
        for (let h = 1; h <= noOfHints; h++) {
            const delay = (duration / (noOfHints + 1)) * h * 1000;
            setTimeout(() => {
                const r = this.roomManager.getRoom(roomId);
                if (!r || r.gameState !== "drawing" || r.currentWord !== word) return;

                // Reveal one random hidden character
                const unrevealed = hiddenIndices.filter(i => r.revealedIndices && !r.revealedIndices.includes(i));
                if (unrevealed.length === 0) return;
                const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
                if (!r.revealedIndices) r.revealedIndices = [];
                r.revealedIndices.push(pick);

                const drawer = r.players[r.drawerIndex];
                const hint = this.maskWord(r.currentWord, r.revealedIndices);
                this.io.to(roomId).except(drawer.id).emit("hint", { hint });
            }, delay);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Guessing
    // ─────────────────────────────────────────────────────────────

    checkGuess(roomId, playerId, guess) {
        const room = this.roomManager.getRoom(roomId);
        if (!room || room.gameState !== "drawing") return;

        const player = this.roomManager.getPlayer(room, playerId);
        if (!player) return;

        const drawer = room.players[room.drawerIndex];

        if (playerId === drawer.id) return;

        if (player.hasGuessed) return;

        if (guess.toLowerCase().trim() === room.currentWord.toLowerCase()) {
            player.hasGuessed = true;
            const timeTaken = room.settings.duration - room.timeLeft;
            const guesserScore = this.calculateScore(timeTaken, room.settings.duration);
            player.score += guesserScore;

            drawer.score += Math.round(guesserScore * 0.5);
            this.io.to(playerId).emit("correct-guess", { word: room.currentWord });
            this.io.to(roomId).emit("player-guessed", {
                playerId,
                playerName: player.name,
                score: player.score,
                players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
            });

            const nonDrawers = room.players.filter(p => p.id !== drawer.id);
            if (nonDrawers.length > 0 && nonDrawers.every(p => p.hasGuessed)) {
                this.clearTimer(roomId);
                this.endTurn(roomId, true);
            }
        } else {
            this.io.to(roomId).emit("chat-message", {
                senderId: playerId,
                senderName: player.name,
                message: guess,
                isGuess: true,
            });
        }
    }
    endTurn(roomId, allGuessed) {
        const room = this.roomManager.getRoom(roomId);
        if (!room) return;
        room.revealedIndices = [];
        this.io.to(roomId).emit("turn-ended", {
            word: room.currentWord,
            players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
        });
        

        const nextDrawerIndex = (room.drawerIndex + 1) % room.players.length;
        if (nextDrawerIndex === 0) {
            if (room.currentRound >= room.settings.noOfRounds) {
                setTimeout(() => this.endGame(roomId), 3000);
                return;
            }
            room.currentRound++;
        }

        room.drawerIndex = nextDrawerIndex;
        room.gameState = "choosing";
        setTimeout(() => this.startChoosing(roomId), 3000);
        this.io.to(roomId).emit("clear-canvas");
    }

    endGame(roomId) {
        const room = this.roomManager.getRoom(roomId);
        if (!room) return;
        room.gameState = "ended";

        const leaderboard = [...room.players]
            .sort((a, b) => b.score - a.score)
            .map((p, i) => ({ rank: i + 1, id: p.id, name: p.name, score: p.score }));

        this.io.to(roomId).emit("game-over", { leaderboard });
    }
    maskWord(word, revealedIndices = []) {
        return word
            .split("")
            .map((ch, i) => (ch === " " || revealedIndices.includes(i) ? ch : "_"))
            .join("");
    }

    calculateScore(timeTaken, duration) {
        const ratio = 1 - timeTaken / duration;
        return Math.max(50, Math.round(500 * ratio));
    }

    getCurrentDrawerId(roomId) {
        const room = this.roomManager.getRoom(roomId);
        if (!room || room.players.length === 0) return null;
        return room.players[room.drawerIndex]?.id || null;
    }
}

module.exports = GameManager;