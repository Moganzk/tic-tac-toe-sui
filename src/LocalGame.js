import { useState, useEffect } from 'react';

export default function LocalGame({ player1: initialP1, player2: initialP2, startLocalGame, onBack }) {
  const [player1, setPlayer1] = useState(initialP1 || '');
  const [player2, setPlayer2] = useState(initialP2 || '');
  const [gameStarted, setGameStarted] = useState(Boolean(initialP1 && initialP2));

  function startGame() {
    if (player1.trim() && player2.trim()) {
      setGameStarted(true);
      startLocalGame(player1.trim(), player2.trim());
    }
  }

  function restartGame() {
    setGameStarted(false);
    setPlayer1('');
    setPlayer2('');
  }

  function Game({ player1, player2, onRestart }) {
    const [history, setHistory] = useState([Array(9).fill(null)]);
    const [currentMove, setCurrentMove] = useState(0);
    const [showModal, setShowModal] = useState(false);

    const xIsNext = currentMove % 2 === 0;
    const currentSquares = history[currentMove];
    const winner = calculateWinner(currentSquares);
    const isDraw = !winner && currentSquares.every(Boolean);

    useEffect(() => {
      if (winner || isDraw) {
        setShowModal(true);
      }
    }, [winner, isDraw]);

    function handlePlay(nextSquares) {
      const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
      setHistory(nextHistory);
      setCurrentMove(nextHistory.length - 1);
    }

    function handleUndo() {
      if (currentMove > 0) setCurrentMove(currentMove - 1);
    }

    function handleRematch() {
      setHistory([Array(9).fill(null)]);
      setCurrentMove(0);
      setShowModal(false);
    }

    const winnerName = winner === 'X' ? player1 : winner === 'O' ? player2 : null;

    return (
      <div className="game">
        <div className="game-board">
          <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
          <div className="game-buttons">
            <button className="undo-button" onClick={handleUndo} disabled={currentMove === 0}>
              Undo Move
            </button>
            <button className="undo-button" onClick={onRestart}>
              Restart Game
            </button>
            <button className="undo-button" onClick={onBack}>
              Back to Start
            </button>
          </div>
        </div>

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>{winner ? `🎉 ${winnerName} wins!` : '🤝 It’s a draw!'}</h2>
              <button className="start-btn" onClick={handleRematch}>
                Rematch
              </button>
              <button className="start-btn" onClick={onRestart} style={{ marginLeft: '10px' }}>
                Return to Player Names
              </button>
              <button className="start-btn" onClick={onBack} style={{ marginLeft: '10px' }}>
                Back to Start
              </button>
            </div>
          </div>
        )}

        <div className="game-info">
          <p>{player1} (X) vs {player2} (O)</p>
          <p>Move #{currentMove}</p>
        </div>
      </div>
    );
  }

  function Board({ xIsNext, squares, onPlay }) {
    function handleClick(i) {
      if (calculateWinner(squares) || squares[i]) return;
      const nextSquares = squares.slice();
      nextSquares[i] = xIsNext ? 'X' : 'O';
      onPlay(nextSquares);
    }

    const winner = calculateWinner(squares);
    const status = winner
      ? `Winner: ${winner}`
      : `Next player: ${xIsNext ? 'X' : 'O'}`;

    return (
      <>
        <div className="status">{status}</div>
        <div className="board">
          {squares.map((val, i) => (
            <button key={i} className={`square ${val ? 'animate' : ''}`} onClick={() => handleClick(i)}>
              {val}
            </button>
          ))}
        </div>
      </>
    );
  }

  return !gameStarted ? (
    <div className="start-screen">
      <h1>Tic Tac Toe (Local)</h1>
      <input
        placeholder="Player 1 Name"
        value={player1}
        onChange={(e) => setPlayer1(e.target.value)}
      />
      <input
        placeholder="Player 2 Name"
        value={player2}
        onChange={(e) => setPlayer2(e.target.value)}
      />
      <button className="start-btn" onClick={startGame} disabled={!player1.trim() || !player2.trim()}>
        Start Game
      </button>
      <button className="undo-button" onClick={onBack} style={{ marginTop: '10px' }}>
        Back to Mode Selection
      </button>
    </div>
  ) : (
    <Game player1={player1} player2={player2} onRestart={restartGame} />
  );
}

// Winning logic reused here:
function calculateWinner(squares) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let [a,b,c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
