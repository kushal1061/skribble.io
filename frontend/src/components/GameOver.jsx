import React from 'react'

function GameOver({leaderboard}) {
  return (
    <div className="min-h-screen bg-[#bae6fd] flex items-center justify-center px-6 py-8 font-fredoka" style={{ backgroundImage: 'radial-gradient(#93c5fd 2px, transparent 2px)', backgroundSize: '32px 32px' }}>
        <div className="bg-yellow-300 rounded-3xl skribbl-box p-10 w-full max-w-md text-center animate-bounce-in">
          <h2 className="text-5xl font-black text-rose-600 mb-2 drop-shadow-md">Game Over!</h2>
          <p className="text-yellow-900 font-bold text-xl mb-6">Final Leaderboard</p>
          <div className="space-y-4">
            {leaderboard.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 skribbl-box transition hover:-translate-y-1">
                <span className="text-3xl mr-3 font-black text-stone-300">{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}</span>
                <span className="flex-1 text-left font-black text-2xl text-sky-900">{p.name}</span>
                <span className="font-black text-rose-500 text-2xl">{p.score} <span className="text-sm text-rose-300 text-base">pts</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
  )
}

export default GameOver;
