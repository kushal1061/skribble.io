class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    createRoom(roomId, hostId, settings = {}) {
        const room = {
            id: roomId,
            hostId: hostId,
            players: [],          // array of { id, name, score }
            gameState: "waiting", // "waiting" | "choosing" | "drawing" | "ended"
            drawerIndex: 0,
            currentWord: "",
            currentRound: 0,
            timeLeft: 0,
            settings: {
                duration:   settings.duration   || 60,
                maxPlayers: settings.maxPlayers  || 8,
                hints:      settings.hints       !== undefined ? settings.hints : true,
                noOfHints:  settings.noOfHints   || 3,
                noOfRounds: settings.noOfRounds  || 2,
            },
        };
        this.rooms.set(roomId, room);
        return room;
    }

    addPlayer(roomId, playerId, playerName) {
        const room = this.getRoom(roomId);
        if (!room) return { error: "Room not found." };
        if (room.players.length >= room.settings.maxPlayers) return { error: "Room is full." };
        if (room.gameState !== "waiting") return { error: "Game already in progress." };

        const player = { id: playerId, name: playerName || `Player ${room.players.length + 1}`, score: 0, hasGuessed: false };
        room.players.push(player);
        return { ok: true, player };
    }

    removePlayer(roomId, playerId) {
        const room = this.getRoom(roomId);
        if (!room) return;
        room.players = room.players.filter(p => p.id !== playerId);
    }

    getPlayer(room, playerId) {
        return room.players.find(p => p.id === playerId);
    }

    changeSettings(roomId, settings) {
        const room = this.getRoom(roomId);
        if (!room) return "wrong room id";
        room.settings = { ...room.settings, ...settings };
        return "settings updated";
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    removeRoom(roomId) {
        this.rooms.delete(roomId);
    }
}

module.exports = RoomManager;
