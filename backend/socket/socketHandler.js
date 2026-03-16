function socketHandler(io, GameManager, RoomManager) {

    const socketRoomMap = new Map();

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        socket.on("create-room", (data = {}) => {
            const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const playerName = data.name || "Host";
            const settings = data.settings || {};

            RoomManager.createRoom(roomId, socket.id, settings);
            const result = RoomManager.addPlayer(roomId, socket.id, playerName);
            if (result.error) {
                socket.emit("room-error", { message: result.error });
                return;
            }

            socket.join(roomId);
            socketRoomMap.set(socket.id, { roomId, name: playerName });

            const room = RoomManager.getRoom(roomId);
            console.log(`Room created: ${roomId} by ${playerName}`);
            socket.emit("room-created", {
                roomId,
                players: room.players,
            });
        });

        socket.on("join-room", (data = {}) => {
            const { roomId, name } = data;
            if (!roomId) {
                socket.emit("room-error", { message: "roomId is required to join." });
                return;
            }

            const playerName = name || `Player`;
            const result = RoomManager.addPlayer(roomId, socket.id, playerName);
            if (result.error) {
                socket.emit("room-error", { message: result.error });
                return;
            }

            socket.join(roomId);
            socketRoomMap.set(socket.id, { roomId, name: playerName });

            const room = RoomManager.getRoom(roomId);
            console.log(`${playerName} (${socket.id}) joined room ${roomId}`);

            socket.emit("room-joined", { roomId, players: room.players });
            // Notify others
            socket.to(roomId).emit("players-updated", { players: room.players });
        });
        socket.on("start-game", (data = {}) => {
            const roomId = data.roomId || (socketRoomMap.get(socket.id) || {}).roomId;
            if (!roomId) {
                socket.emit("room-error", { message: "roomId missing." });
                return;
            }

            const room = RoomManager.getRoom(roomId);
            if (!room) {
                socket.emit("room-error", { message: "Room not found." });
                return;
            }
            if (room.hostId !== socket.id) {
                socket.emit("room-error", { message: "Only the host can start the game." });
                return;
            }
            if (room.players.length < 2) {
                socket.emit("room-error", { message: "Need at least 2 players to start." });
                return;
            }

            GameManager.startGame(roomId);
        });

        socket.on("pick-word", (data = {}) => {
            const { roomId, word } = data;
            if (!roomId || !word) return;

            const room = RoomManager.getRoom(roomId);
            if (!room) return;

            const drawerId = GameManager.getCurrentDrawerId(roomId);
            if (socket.id !== drawerId) {
                socket.emit("room-error", { message: "You are not the current drawer." });
                return;
            }
            if (!room.wordChoices || !room.wordChoices.includes(word)) {
                socket.emit("room-error", { message: "Invalid word choice." });
                return;
            }

            GameManager.drawerPickedWord(roomId, word);
        });

        // ─────────────────────────────────────────────────────────
        // Drawing
        // ─────────────────────────────────────────────────────────

        socket.on("draw", (data = {}) => {
            const { roomId } = data;
            if (!roomId) {
                socket.emit("room-error", { message: "roomId missing." });
                return;
            }

            const room = RoomManager.getRoom(roomId);
            if (!room) {
                socket.emit("room-error", { message: "Room not found." });
                return;
            }
            const drawerId = GameManager.getCurrentDrawerId(roomId);
            if (socket.id !== drawerId) {
                return;
            }

            socket.to(roomId).emit("draw", {
                x: data.x,
                y: data.y,
                color: data.color,
                size: data.size,
                type: data.type,
            });
        });

        socket.on("clear-canvas", (data = {}) => {
            const { roomId } = data;
            if (!roomId) {
                socket.emit("room-error", { message: "roomId missing." });
                return;
            }

            const drawerId = GameManager.getCurrentDrawerId(roomId);
            if (socket.id !== drawerId) return; 

            console.log(`Canvas cleared for room ${roomId}`);
            socket.to(roomId).emit("clear-canvas");
        });

        // ─────────────────────────────────────────────────────────
        // Guessing & Chat
        // ─────────────────────────────────────────────────────────

        socket.on("guess", (data = {}) => {
            const { roomId, guess } = data;
            if (!roomId || !guess) return;
            GameManager.checkGuess(roomId, socket.id, guess);
        });

        socket.on("chat-message", (data = {}) => {
            const { roomId, message } = data;
            if (!roomId || !message) return;

            const room = RoomManager.getRoom(roomId);
            if (!room) return;

            const player = RoomManager.getPlayer(room, socket.id);
            const senderName = player ? player.name : "Unknown";
            io.to(roomId).emit("chat-message", {
                senderId: socket.id,
                senderName,
                message,
                isGuess: false,
            });
        });

        // ─────────────────────────────────────────────────────────
        // Disconnect
        // ─────────────────────────────────────────────────────────

        socket.on("disconnect", (reason) => {
            console.log(`User disconnected: ${socket.id} (${reason})`);

            const info = socketRoomMap.get(socket.id);
            if (!info) return;

            const { roomId, name } = info;
            socketRoomMap.delete(socket.id);

            const room = RoomManager.getRoom(roomId);
            if (!room) return;

            RoomManager.removePlayer(roomId, socket.id);
            if (room.players.length === 0) {
                RoomManager.removeRoom(roomId);
                console.log(`Room ${roomId} removed (empty)`);
                return;
            }
            if (room.hostId === socket.id) {
                room.hostId = room.players[0].id;
                io.to(roomId).emit("host-changed", { newHostId: room.hostId });
            }

            io.to(roomId).emit("player-left", {
                playerId: socket.id,
                playerName: name,
                players: room.players,
            });

            io.to(roomId).emit("players-updated", { players: room.players });
        });
    });
}

module.exports = socketHandler;
