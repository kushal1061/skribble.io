import { useEffect, useRef, useState } from 'react';
import { socket } from "./utils/socket";
import Home from './Home';

function App() {
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const nameRef = useRef(null);
  const roomRef = useRef(null);
  useEffect(() => {
    socket.connect();
    socket.on("connect", () => {
      console.log("connected to server");
    });
    socket.on("connect_error", (err) => {
      console.log("Connection failed:", err.message);
      setError(err.message);
    });
    socket.on("room-created", ({ roomId }) => {
      setRoomId(roomId);
      setInRoom(true);
      setError("");
    });
    socket.on("room-joined", ({ roomId }) => {
      setRoomId(roomId);
      setInRoom(true);
      setError("");
    });
    socket.on("room-error", ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("room-created");
      socket.off("room-joined");
      socket.off("room-error");
    };
  }, []);

  const handleCreateRoom = () => {
    setError("");
    socket.emit("create-room", {
      name: nameRef.current?.value?.trim() || "Player",
      settings: {},
    });
  };

  const handleJoinRoom = () => {
    const enteredRoomId = roomRef.current?.value?.trim() ?? "";

    if (!enteredRoomId) {
      setError("Room ID cannot be empty");
      return;
    }

    setError("");
    socket.emit("join-room", {
      roomId: enteredRoomId,
      name: nameRef.current?.value?.trim() || "Player",
    });
  };

  if (inRoom) {
    return <Home socket={socket} roomId={roomId} />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fde68a_0%,_#fff7ed_35%,_#f5f5f4_100%)] px-6 py-10 text-stone-900">
      <h1 className='text-center text-6xl'> Skrrible io </h1>
      <div className="mx-auto flex justify-center min-h-[calc(100vh-10rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative">
          <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-amber-300/40 blur-3xl" />
          <div className="absolute -bottom-10 right-0 h-32 w-32 rounded-full bg-orange-300/30 blur-3xl" />

          <div className="relative rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_60px_rgba(120,53,15,0.12)] backdrop-blur sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                Join The Lobby
              </p>
              <h2 className="mt-2 text-2xl font-bold text-stone-950">Start a room or enter an invite code</h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-stone-700">
                  Your name
                </label>
                <input
                  ref={nameRef}
                  id="name"
                  type="text"
                  placeholder="Sketch master"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Create a new room
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-stone-200" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">or</span>
                <div className="h-px flex-1 bg-stone-200" />
              </div>

              <div className="space-y-2">
                <label htmlFor="room-id" className="text-sm font-medium text-stone-700">
                  Room ID
                </label>
                <input
                  ref={roomRef}
                  id="room-id"
                  type="text"
                  placeholder="Enter room code"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </div>

              <button
                onClick={handleJoinRoom}
                className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-400"
              >
                Join existing room
              </button>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
