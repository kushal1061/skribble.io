const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const RoomManager = require("./contoller/roomManager");
const GameManager = require("./contoller/gameManager");
const socketHandler = require("./socket/socketHandler");
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const roomManager = new RoomManager();
const gameManager = new GameManager(io, roomManager);
socketHandler(io,gameManager,roomManager);
app.get("/", (req, res) => {
  res.send("Server running");
});
server.listen(3000, () => {
  console.log("Server running on port 3000");
});