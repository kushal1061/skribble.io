import React from 'react'

function GameOver({leaderboard}) {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center px-6 py-8">
        <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-md text-center">
          <h2 className="text-3xl font-bold text-amber-700 mb-2">Game Over!</h2>
          <p className="text-stone-500 mb-6">Final Leaderboard</p>
          <div className="space-y-3">
            {leaderboard.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl bg-stone-50 px-5 py-3 shadow-sm">
                <span className="text-2xl mr-3">{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}</span>
                <span className="flex-1 text-left font-semibold text-stone-900">{p.name}</span>
                <span className="font-bold text-amber-600">{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
  )
}

export default GameOver