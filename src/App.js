import { useState } from 'react';
import LocalGame from './LocalGame';
import MultiplayerLobby from './MultiplayerLobby';
import './App.css';

export default function App() {
  const [mode, setMode] = useState(null); // null = choose mode, 'local', 'online'
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');

  function startLocalGame(p1, p2) {
    setPlayer1(p1);
    setPlayer2(p2);
    setMode('local');
  }

  function backToStart() {
    setMode(null);
    setPlayer1('');
    setPlayer2('');
  }

  if (!mode) {
    return (
      <div className="start-screen">
        <h1>Tic Tac Toe</h1>
        <button className="start-btn" onClick={() => setMode('local')}>
          Local 2 Player Game
        </button>
        <button className="start-btn" onClick={() => setMode('online')}>
          Online Multiplayer
        </button>
      </div>
    );
  }

  if (mode === 'local') {
    return (
      <LocalGame
        player1={player1}
        player2={player2}
        startLocalGame={startLocalGame}
        onBack={backToStart}
      />
    );
  }

  if (mode === 'online') {
    return <MultiplayerLobby onBack={backToStart} />;
  }

  return null;
}
