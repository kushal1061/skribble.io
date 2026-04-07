import React, { useState, useEffect } from 'react';
import Canvas from './components/Canvas';
import Chat from './components/Chat';
import GameOver from './components/GameOver';
import LeaderBoard from './components/LeaderBoard';
import socketHandler from '../hooks/socketHandler';
function Home({ socket, roomId,isHost }) {

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
    <div className="min-h-screen px-6 py-8 relative font-fredoka flex flex-col items-center justify-center xl:h-screen xl:overflow-hidden">
      {wordChoices && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-sky-100 rounded-3xl skribbl-box p-8 w-full max-w-sm text-center animate-bounce-in ">
            <h3 className="text-2xl font-black text-sky-900 mb-2">Choose a word!</h3>
            <div className="flex flex-col gap-3 mt-6">
              {wordChoices.map((word) => (
                <button
                  key={word}
                  onClick={() => handlePickWord(word)}
                  className="w-full rounded-2xl bg-white px-6 py-4 text-xl font-bold text-sky-900 skribbl-btn hover:bg-sky-200"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {phase === 'turn-end' && revealedWord && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-yellow-300 text-yellow-900 rounded-3xl px-12 py-8 text-center skribbl-box animate-bounce-in pointer-events-auto">
            <p className="text-xl font-bold mb-2">The word was</p>
            <p className="text-5xl font-black tracking-widest">{revealedWord}</p>
          </div>
        </div>
      )}
      {youGuessed && phase === 'drawing' && (
        <div className="fixed top-8 left-1/2 z-50 bg-green-500 text-white rounded-2xl px-8 py-4 skribbl-box font-black text-xl animate-bounce-in-centered pointer-events-none">
          🎉 You guessed it!
        </div>
      )}

      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {guessedToasts.map(t => (
          <div key={t.id} className="bg-white text-green-700 rounded-2xl px-4 py-3 skribbl-box text-base font-bold flex items-center gap-2 animate-slide-in">
            <span className="text-green-500 text-xl">✓</span>
            <span>{t.name} guessed the word!</span>
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-[1400px] flex-col gap-4 xl:flex-1 xl:min-h-0">

        {/* Header bar */}
        <div className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 skribbl-box font-bold">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black uppercase text-stone-500">Room</span>
            <span className="text-xl text-sky-600 bg-sky-100 px-3 py-1 rounded-lg skribbl-border">{roomId}</span>
          </div>

          {/* Word & phase info */}
          <div className="flex flex-col items-center">
            {phase === 'lobby' && (
              <span className="text-lg text-stone-600 text-center animate-pulse">Waiting for the host to start…</span>
            )}
            {phase === 'choosing' && (
              <span className="text-xl text-orange-600 font-black animate-wiggle">
                {turn === 'your_turn' ? 'Pick your word!' : `${drawerName} is choosing a word…`}
              </span>
            )}
            {(phase === 'drawing' || phase === 'turn-end') && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-bold text-stone-500">
                  Round {round}/{totalRounds} • <span className="text-stone-800">{drawerName}</span> is drawing
                </span>
                {wordDisplay()}
              </div>
            )}
          </div>

          {/* Timer */}
          <div className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black skribbl-box ${timer <= 10 ? 'bg-red-400 text-white animate-pulse' : 'bg-yellow-300 text-yellow-900'}`}>
            {timer}
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-col xl:flex-1 xl:min-h-0 xl:flex-row gap-4 w-full h-auto min-h-[40rem]">
          
          <div className="w-full xl:w-64 h-[30rem] xl:h-full shrink-0">
            <LeaderBoard players={players} isHost={isHost} phase={phase} handleStartGame={handleStartGame} />
          </div>

          {/* Canvas area */}
          <div className="w-full xl:flex-1 h-[25rem] xl:h-full flex flex-col">
            <Canvas turn={turn} socket={socket} roomId={roomId} />
          </div>
          
          {/* Chat */}
          <div className="w-full xl:w-[24rem] h-[25rem] xl:h-full shrink-0">
             <Chat socket={socket} roomId={roomId} youGuessed={youGuessed} isDrawer={turn === 'your_turn'} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
