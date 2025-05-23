import { useState, useEffect } from 'react';
import './App.css';

function Square({ value, onSquareClick }) {
  return (
    <button className={`square ${value ? 'animate' : ''}`} onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay }) {
  function handleClick(i) {
    if (calculateWinner(squares) || squares[i]) return;

    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? 'X' : 'O';
    onPlay(nextSquares);
  }

  return (
    <div className="board">
      {squares.map((val, i) => (
        <Square key={i} value={val} onSquareClick={() => handleClick(i)} />
      ))}
    </div>
  );
}

export default function Game() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const currentSquares = history[currentMove];
  const xIsNext = currentMove % 2 === 0;
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

  function handleRematch() {
    setHistory([Array(9).fill(null)]);
    setCurrentMove(0);
    setShowModal(false);
  }

  function calculateStatus() {
    if (winner) return `Winner: ${winner}`;
    if (isDraw) return 'Game is a draw!';
    return `Next player: ${xIsNext ? 'X' : 'O'}`;
  }

  return (
    <div className="game">
      <div className="status">{calculateStatus()}</div>
      <div className="game-board">
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{winner ? `🎉 ${winner} wins!` : '🤝 It’s a draw!'}</h2>
            <button className="start-btn" onClick={handleRematch}>Rematch</button>
          </div>
        </div>
      )}
    </div>
  );
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (let [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
