import React, { useState, useEffect } from 'react';
import Canvas from './components/Canvas';
import Chat from './components/Chat';
import GameOver from './components/GameOver';
import socketHandler from '../hooks/socketHandler';
function Home({ socket, roomId }) {

  const {
    turn,
    timer,
    wordChoices,
    currentWord,
    maskedWord,
    wordLength,
    drawerName,
    round,
    totalRounds,
    players,
    phase,
    revealedWord,
    leaderboard,
    guessedToasts,
    hintWord,
    youGuessed,
    handlePickWord,
    handleStartGame,
  } = socketHandler(socket, roomId);
  
  const wordDisplay = () => {
    if (turn === 'your_turn' && currentWord) {
      return (
        <span className="font-bold text-amber-700 tracking-widest text-xl">
          {currentWord}
        </span>
      );
    }
    if (youGuessed && currentWord) {
      return (
        <span className="font-bold text-green-600 tracking-widest text-xl">
          {currentWord} ✓
        </span>
      );
    }
    const displayMask = hintWord || maskedWord;
    if (displayMask) {
      return (
        <span className="font-mono tracking-[0.35em] text-xl text-slate-700">
          {displayMask.split('').map((ch, i) => (
            <span key={i} className={ch === '_' ? 'text-slate-400' : 'text-slate-900 font-bold'}>
              {ch === '_' ? '_' : ch}
            </span>
          ))}
        </span>
      );
    }
    return null;
  };

  // ── Game Over screen ────────────────────────────────────────────
  if (phase === 'game-over') {
    return (
     <GameOver leaderboard={leaderboard}/>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 px-6 py-8 relative">
      {wordChoices && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center animate-fade-in">
            <h3 className="text-xl font-bold text-stone-900 mb-1">Choose a word!</h3>
            <p className="text-sm text-stone-500 mb-6">Pick the word you want to draw</p>
            <div className="flex flex-col gap-3">
              {wordChoices.map((word) => (
                <button
                  key={word}
                  onClick={() => handlePickWord(word)}
                  className="w-full rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 py-3 text-lg font-semibold text-amber-900 transition hover:bg-amber-500 hover:text-white hover:border-amber-500 active:scale-95"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {phase === 'turn-end' && revealedWord && (
        <div className="fixed inset-0 z-40 flex items-end justify-center pb-16 pointer-events-none">
          <div className="bg-stone-900 text-white rounded-2xl px-8 py-4 text-center shadow-2xl pointer-events-auto">
            <p className="text-sm text-stone-400 mb-1">The word was</p>
            <p className="text-3xl font-bold tracking-widest text-amber-400">{revealedWord}</p>
          </div>
        </div>
      )}
      {youGuessed && phase === 'drawing' && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white rounded-2xl px-6 py-3 shadow-lg font-semibold text-sm animate-bounce-in pointer-events-none">
          🎉 You guessed it!
        </div>
      )}

   
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {guessedToasts.map(t => (
          <div key={t.id} className="bg-white border border-green-200 text-green-800 rounded-2xl px-4 py-2 shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-in">
            <span className="text-green-500">✓</span>
            <span><strong>{t.name}</strong> guessed the word!</span>
          </div>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">

        {/* ── Header bar ───────────────────────────────────────── */}
        <div className="flex items-center justify-between rounded-2xl bg-white px-6 py-3 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">Room</span>
            <span className="font-mono font-bold text-stone-700">{roomId}</span>
            {phase === 'lobby' && (
              <span className='text-sm text-stone-400'>  Share this code to invite friends</span>
            )}
          </div>

          {/* Word & phase info */}
          <div className="flex flex-col items-center">
            {phase === 'lobby' && (
              <span className="text-sm text-stone-400 text-center">Waiting to start…</span>
            )}
            {phase === 'choosing' && (
              <span className="text-sm text-amber-600 font-semibold">
                {turn === 'your_turn' ? 'Pick your word!' : `${drawerName} is choosing a word…`}
              </span>
            )}
            {(phase === 'drawing' || phase === 'turn-end') && (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs text-stone-400">
                  Round {round}/{totalRounds} · {drawerName} is drawing
                </span>
                {wordDisplay()}
              </div>
            )}
          </div>

          {/* Timer */}
          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${timer <= 10 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
            {timer}
          </div>
        </div>

        {/* ── Main layout ──────────────────────────────────────── */}
        <div className="flex flex-col items-start gap-6 xl:flex-row xl:items-start">

          {/* Players sidebar */}
          <div className="w-full xl:w-44 shrink-0 flex xl:flex-col gap-2 flex-row flex-wrap">
            {players.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl bg-white border border-stone-200 px-3 py-2 shadow-sm min-w-[120px]">
                <span className="text-sm font-medium text-stone-800 truncate max-w-[70px]">{p.name}</span>
                <span className="text-xs font-bold text-amber-600 ml-2">{p.score}</span>
              </div>
            ))}
            {phase === 'lobby' && (
              <button
                onClick={handleStartGame}
                className="w-full rounded-2xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white mt-2 hover:bg-stone-700 transition"
              >
                Start Game
              </button>
            )}
          </div>

          {/* Canvas area */}
          <div className="w-full xl:flex-1">
            <Canvas turn={turn} socket={socket} roomId={roomId} />
          </div>
          {/* Chat */}
          <Chat socket={socket} roomId={roomId} youGuessed={youGuessed} isDrawer={turn === 'your_turn'} />
        </div>
      </div>
    </div>
  );
}

export default Home;
