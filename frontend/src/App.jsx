import { useEffect, useRef, useState } from 'react';
import { socket } from "./utils/socket";
import Home from './Home';

function App() {
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const createNameRef = useRef(null);
  const joinNameRef = useRef(null);
  const roomRef = useRef(null);
  const [isHost, setIsHost] = useState(false);
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
      setIsHost(true);
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
      alert(message);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("room-created");
      socket.off("room-joined");
      socket.off("room-error");
    };
  }, []);

  // ── Settings modal state ──────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    noOfRounds: 3,
    duration: 80,
    maxPlayers: 8,
    hints: true,
    noOfHints: 3,
  });

  const openSettings = () => {
    setError("");
    setShowSettings(true);
  };

  const handleCreateRoom = () => {
    setShowSettings(false);
    socket.emit("create-room", {
      name: createNameRef.current?.value?.trim() || "Player",
      settings,
    });
  };

  const handleJoinRoom = () => {
    const enteredRoomId = roomRef.current?.value?.trim() ?? "";

    if (!enteredRoomId) {
      setError("Room ID cannot be empty");
      return;
    }

    let name = joinNameRef.current?.value?.trim();
    if (!name) {
      name = "Player";
    }

    setError("");
    socket.emit("join-room", {
      roomId: enteredRoomId,
      name: name,
    });
  };

  if (inRoom) {
    return <Home socket={socket} roomId={roomId} isHost={isHost} />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#60a5fa_0%,_#38bdf8_35%,_#0284c7_100%)] flex flex-col justify-center items-center px-6 py-10 font-fredoka">
      
      <div className="absolute top-10 flex w-full justify-center">
         <h1 className="text-center text-7xl font-black text-white drop-shadow-[0_4px_0_rgba(2,132,199,1)] tracking-widest skew-y-[-2deg] mb-10">
           Skrrible.io
         </h1>
      </div>

      <div className="mx-auto flex flex-col lg:flex-row justify-center w-full max-w-4xl items-center gap-10 mt-20">
        
        {/* Left Column: Create Room */}
        <section className="w-full max-w-sm">
          <div className="skribbl-box bg-white p-8 rounded-[2rem] flex flex-col gap-6 text-center animate-bounce-in">
            <div>
              <h2 className="text-3xl font-black text-sky-600 mb-2">Create Room</h2>
              <p className="text-lg font-bold text-stone-500">Host your own game!</p>
            </div>

            <div className="flex flex-col gap-4">
              <input
                ref={createNameRef}
                id="create-name"
                type="text"
                placeholder="Enter your name"
                className="w-full rounded-2xl px-5 py-4 text-xl font-bold outline-none transition skribbl-box focus:border-sky-500 bg-stone-100 text-stone-800 placeholder-stone-400"
              />
              <button
                onClick={openSettings}
                className="w-full rounded-2xl bg-green-500 px-4 py-4 text-xl font-black text-white skribbl-btn hover:bg-green-600"
              >
                CREATE GAME
              </button>
            </div>
          </div>
        </section>

        {/* Divider for Desktop / Mobile */}
        <div className="hidden lg:flex flex-col items-center gap-2">
            <div className="w-2 h-16 bg-white/50 rounded-full" />
            <span className="text-2xl font-black text-white">OR</span>
            <div className="w-2 h-16 bg-white/50 rounded-full" />
        </div>

        {/* Right Column: Join Room */}
        <section className="w-full max-w-sm">
          <div className="skribbl-box bg-white p-8 rounded-[2rem] flex flex-col gap-6 text-center animate-bounce-in" style={{ animationDelay: '0.1s' }}>
            <div>
              <h2 className="text-3xl font-black text-orange-500 mb-2">Join Room</h2>
              <p className="text-lg font-bold text-stone-500">Play with friends!</p>
            </div>

            <div className="flex flex-col gap-4">
              <input
                ref={joinNameRef}
                id="join-name"
                type="text"
                placeholder="Enter your name"
                className="w-full rounded-2xl px-5 py-4 text-xl font-bold outline-none transition skribbl-box focus:border-orange-500 bg-stone-100 text-stone-800 placeholder-stone-400"
              />
              <input
                ref={roomRef}
                id="room-id"
                type="text"
                placeholder="Paste Room ID here"
                className="w-full rounded-2xl px-5 py-4 text-xl font-bold outline-none transition skribbl-box focus:border-orange-500 bg-stone-100 text-stone-800 placeholder-stone-400"
              />
              <button
                onClick={handleJoinRoom}
                className="w-full rounded-2xl bg-orange-400 px-4 py-4 text-xl font-black text-white skribbl-btn hover:bg-orange-500"
              >
                JOIN GAME
              </button>
            </div>
            
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-100 px-4 py-3 text-lg font-bold text-red-600 animate-wiggle">
                {error}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Settings modal ─────────────────────────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 skribbl-box animate-bounce-in flex flex-col gap-6">
            <div className="text-center">
              <h3 className="text-3xl font-black text-sky-600">Room Settings</h3>
            </div>

            <div className="flex flex-col gap-5 font-bold text-lg text-stone-700">
              <div className="flex items-center justify-between bg-stone-100 p-4 rounded-2xl skribbl-box">
                <label>Rounds</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1} max={10}
                    value={settings.noOfRounds}
                    onChange={e => setSettings(s => ({ ...s, noOfRounds: Number(e.target.value) }))}
                    className="w-16 rounded-xl bg-white px-2 py-2 text-center font-black outline-none skribbl-box focus:border-sky-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-stone-100 p-4 rounded-2xl skribbl-box">
                <label>Draw Time (s)</label>
                <select
                  value={settings.duration}
                  onChange={e => setSettings(s => ({ ...s, duration: Number(e.target.value) }))}
                  className="w-24 rounded-xl bg-white px-2 py-2 font-black outline-none skribbl-box focus:border-sky-500 cursor-pointer"
                >
                  {[30, 60, 80, 90, 120].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center justify-between bg-stone-100 p-4 rounded-2xl skribbl-box">
                <label>Max Players</label>
                <input
                  type="number"
                  min={2} max={8}
                  value={settings.maxPlayers}
                  onChange={e => setSettings(s => ({ ...s, maxPlayers: Number(e.target.value) }))}
                  className="w-16 rounded-xl bg-white px-2 py-2 text-center font-black outline-none skribbl-box focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-2">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 rounded-2xl bg-stone-400 px-4 py-4 text-xl font-black text-white skribbl-btn hover:bg-stone-500"
              >
                BACK
              </button>
              <button
                onClick={handleCreateRoom}
                className="flex-1 rounded-2xl bg-green-500 px-4 py-4 text-xl font-black text-white skribbl-btn hover:bg-green-600"
              >
                START Let's Go!
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
