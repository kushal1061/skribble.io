import React, { useEffect, useRef, useState } from 'react';

function Chat({ socket, roomId, youGuessed = false, isDrawer = false }) {
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
    <div className="flex h-[30rem] w-[20rem] shrink-0 flex-col rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-sm">
      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-2 [scrollbar-color:#d97706_#fef3c7] [scrollbar-width:thin]">
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className={`rounded-xl px-3 py-2 text-xs font-semibold text-center ${
                  msg.isSelf
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {msg.text}
              </div>
            );
          }
          return (
            <div
              key={msg.id}
              className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                msg.isGuess
                  ? 'bg-white border border-amber-200 text-amber-950'
                  : 'bg-white text-slate-800'
              }`}
            >
              {msg.senderName && (
                <span className="font-semibold text-amber-700 mr-1">{msg.senderName}:</span>
              )}
              {msg.text}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex w-full items-center gap-2 border-t border-amber-200 pt-3">
        <input
          ref={inputRef}
          id="message-input"
          type="text"
          disabled={inputDisabled}
          placeholder={placeholder}
          onKeyDown={handleKey}
          className="flex-1 rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-amber-50 disabled:text-amber-400"
        />
        <button
          onClick={send}
          disabled={inputDisabled}
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
