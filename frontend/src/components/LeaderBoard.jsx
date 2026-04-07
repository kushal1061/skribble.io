import React from 'react'

// import React from 'react';

function LeaderBoard({ players, isHost, phase, handleStartGame }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full xl:w-56 shrink-0 flex  flex-col gap-3">
      {sortedPlayers.map((p, index) => {
        const isFirst = index === 0 && p.score > 0;
        return (
          <div
            key={p.id}
            className={`flex items-center justify-between rounded-xl bg-white px-3 py-3 skribbl-box ${
              isFirst ? 'bg-yellow-300' : 'bg-white'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className={`font-black text-lg ${isFirst ? 'text-amber-700' : 'text-stone-400'}`}>
                #{index + 1}
              </span>
              <span className="text-sm font-bold text-stone-900 truncate max-w-[80px] sm:max-w-[120px]" title={p.name}>
                {p.name}
              </span>
            </div>
            <span className="text-sm font-black text-sky-600">{p.score}</span>
          </div>
        );
      })}

      {phase === 'lobby' && isHost && (
        <button
          onClick={handleStartGame}
          className="mt-2 w-full rounded-2xl bg-green-500 px-4 py-3 text-lg font-black text-white skribbl-btn hover:bg-green-400"
        >
          START GAME
        </button>
      )}
    </div>
  );
}

export default LeaderBoard;