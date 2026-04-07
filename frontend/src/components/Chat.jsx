import React, { useEffect, useRef, useState } from 'react';

export default function Chat({ socket, roomId, youGuessed = false, isDrawer = false }) {
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    // Timeout ensures DOM has updated with the new message before scrolling
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 10);
  }, [messages]);

  useEffect(() => {
    const onChatMessage = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          senderName: msg.senderName || 'Unknown',
          text: msg.message,
          isGuess: msg.isGuess ?? false,
        },
      ]);
    };

    const onPlayerGuessed = ({ playerName }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          senderName: '',
          text: `🎉 ${playerName} guessed the word!`,
          isSystem: true,
        },
      ]);
    };

    const onCorrectGuess = () => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          senderName: '',
          text: '✅ You guessed correctly!',
          isSystem: true,
          isSelf: true,
        },
      ]);
    };

    const onTurnEnded = ({ word }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          senderName: '',
          text: `The word was: ${word}`,
          isSystem: true,
        },
      ]);
    };

    socket.on('chat-message', onChatMessage);
    socket.on('player-guessed', onPlayerGuessed);
    socket.on('correct-guess', onCorrectGuess);
    socket.on('turn-ended', onTurnEnded);

    return () => {
      socket.off('chat-message', onChatMessage);
      socket.off('player-guessed', onPlayerGuessed);
      socket.off('correct-guess', onCorrectGuess);
      socket.off('turn-ended', onTurnEnded);
    };
  }, [socket]);

  const send = () => {
    const text = inputRef.current?.value?.trim() ?? '';
    if (!text) return;

    socket.emit('guess', { roomId, guess: text });
    inputRef.current.value = '';
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') send();
  };

  const inputDisabled = isDrawer || youGuessed;
  const placeholder = isDrawer
    ? "You're drawing…"
    : youGuessed
    ? 'You already guessed!'
    : 'Type a guess…';

  return (
    <div className="flex h-full w-full flex-col rounded-3xl bg-[#f0f0f0] p-4 skribbl-box gap-3">
      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-2 bg-white rounded-2xl skribbl-box p-3">
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className={`rounded-xl px-3 py-2 text-sm font-black text-center ${
                  msg.isSelf
                    ? 'bg-green-400 text-white'
                    : 'bg-yellow-300 text-yellow-900 border-2 border-yellow-400'
                }`}
              >
                {msg.text}
              </div>
            );
          }
          return (
            <div
              key={msg.id}
              className={`rounded-xl px-3 py-2 text-base font-bold ${
                msg.isGuess
                  ? 'bg-amber-100 text-amber-950 border-2 border-amber-300'
                  : 'bg-sky-50 text-stone-800'
              }`}
            >
              {msg.senderName && (
                <span className="font-black text-sky-700 mr-2">{msg.senderName}:</span>
              )}
              {msg.text}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex w-full items-center gap-2">
        <input
          ref={inputRef}
          id="message-input"
          type="text"
          disabled={inputDisabled}
          placeholder={placeholder}
          onKeyDown={handleKey}
          className="flex-1 rounded-2xl px-4 py-3 text-base font-bold outline-none transition disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 skribbl-box focus:border-blue-500 bg-white"
        />
        <button
          onClick={send}
          disabled={inputDisabled}
          className="h-full rounded-2xl bg-blue-500 px-6 py-2 text-lg font-black text-white skribbl-btn disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
        >
          SEND
        </button>
      </div>
    </div>
  );
}
