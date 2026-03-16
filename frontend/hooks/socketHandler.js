import { useEffect, useState } from "react";

export default function socketHandler(socket, roomId) {
   const [turn, setTurn] = useState('spectator'); 
  const [timer, setTimer] = useState(60);
  const [wordChoices, setWordChoices] = useState(null); 


  const [currentWord, setCurrentWord] = useState('');   
  const [maskedWord, setMaskedWord] = useState('');        
  const [wordLength, setWordLength] = useState(0);

  const [drawerName, setDrawerName] = useState('');
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);

  // Players / scores
  const [players, setPlayers] = useState([]);

  // Game phase: 'lobby' | 'choosing' | 'drawing' | 'turn-end' | 'game-over'
  const [phase, setPhase] = useState('lobby');
  const [revealedWord, setRevealedWord] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [guessedToasts, setGuessedToasts] = useState([]);
  const [hintWord, setHintWord] = useState('');
  const [youGuessed, setYouGuessed] = useState(false);

  useEffect(() => {
    const onTimer = (time) => setTimer(time);

    const onNewTurn = ({ drawerId, drawerName, round, totalRounds }) => {
      setDrawerName(drawerName);
      setRound(round);
      setTotalRounds(totalRounds);
      setPhase('choosing');
      setCurrentWord('');
      setMaskedWord('');
      setHintWord('');
      setYouGuessed(false);
      const isDrawer = drawerId === socket.id;
      setTurn(isDrawer ? 'your_turn' : 'spectator');
    };

    const onWordChoices = ({ choices }) => {
      setWordChoices(choices);
    };

    const onYourTurn = ({ word }) => {
      setCurrentWord(word);
      setWordChoices(null); 
      setPhase('drawing');
    };

    const onDrawingStarted = ({ maskedWord, wordLength }) => {
      setMaskedWord(maskedWord);
      setWordLength(wordLength);
      setPhase('drawing');
      setWordChoices(null);
    };

    const onHint = ({ hint }) => {
      setHintWord(hint);
    };

    const onCorrectGuess = ({ word }) => {
      setYouGuessed(true);
      setCurrentWord(word);
    };

    const onPlayerGuessed = ({ playerName, players }) => {
      setPlayers(players);
      // Show a toast
      const id = Date.now() + Math.random();
      setGuessedToasts(prev => [...prev, { id, name: playerName }]);
      setTimeout(() => {
        setGuessedToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };

    const onPlayersUpdated = ({ players }) => {
      setPlayers(players);
    };

    const onGameStarted = ({ totalRounds, players }) => {
      setTotalRounds(totalRounds);
      setPlayers(players);
      setPhase('choosing');
    };

    const onTurnEnded = ({ word, players }) => {
      setRevealedWord(word);
      setPlayers(players);
      setPhase('turn-end');
      setCurrentWord('');
      setMaskedWord('');
      setHintWord('');
      setYouGuessed(false);
      setTurn('spectator');
    };

    const onGameOver = ({ leaderboard }) => {
      setLeaderboard(leaderboard);
      setPhase('game-over');
    };

    const onRoomJoined = ({ players }) => {
      if (players) setPlayers(players);
    };

    socket.on('timer', onTimer);
    socket.on('new-turn', onNewTurn);
    socket.on('word-choices', onWordChoices);
    socket.on('your-turn', onYourTurn);
    socket.on('drawing-started', onDrawingStarted);
    socket.on('hint', onHint);
    socket.on('correct-guess', onCorrectGuess);
    socket.on('player-guessed', onPlayerGuessed);
    socket.on('players-updated', onPlayersUpdated);
    socket.on('game-started', onGameStarted);
    socket.on('turn-ended', onTurnEnded);
    socket.on('game-over', onGameOver);
    socket.on('room-joined', onRoomJoined);

    return () => {
      socket.off('timer', onTimer);
      socket.off('new-turn', onNewTurn);
      socket.off('word-choices', onWordChoices);
      socket.off('your-turn', onYourTurn);
      socket.off('drawing-started', onDrawingStarted);
      socket.off('hint', onHint);
      socket.off('correct-guess', onCorrectGuess);
      socket.off('player-guessed', onPlayerGuessed);
      socket.off('players-updated', onPlayersUpdated);
      socket.off('game-started', onGameStarted);
      socket.off('turn-ended', onTurnEnded);
      socket.off('game-over', onGameOver);
      socket.off('room-joined', onRoomJoined);
    };
  }, [socket]);

  const handlePickWord = (word) => {
    socket.emit('pick-word', { roomId, word });
    setWordChoices(null);
  };

  const handleStartGame = () => {
    socket.emit('start-game', { roomId });
  };

  return {
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
  };

}