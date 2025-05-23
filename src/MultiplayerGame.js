import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function MultiplayerGame({ room, playerName, onBack }) {
  const [board, setBoard] = useState(room.board || Array(9).fill(null));
  const [turn, setTurn] = useState(room.current_turn || 'X');
  const [winner, setWinner] = useState(null);
  const [status, setStatus] = useState(room.status);
  const [showModal, setShowModal] = useState(false);

  const isPlayerX = playerName === room.player1;
  const isPlayerO = playerName === room.player2;

  useEffect(() => {
    const gameChannel = supabase
      .channel('public:tic_tac_toe_games')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tic_tac_toe_games',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const updatedRoom = payload.new;
          setBoard(updatedRoom.board);
          setTurn(updatedRoom.current_turn || 'X');
          setStatus(updatedRoom.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
    };
  }, [room.id]);

  useEffect(() => {
    const win = calculateWinner(board);
    if (win) {
      setWinner(win);
      setStatus('finished');
      setShowModal(true);
    } else if (board.every(Boolean)) {
      setWinner(null);
      setStatus('finished');
      setShowModal(true);
    }
  }, [board]);

  async function makeMove(i) {
    if (board[i] || winner || status !== 'playing') return;
    if ((turn === 'X' && !isPlayerX) || (turn === 'O' && !isPlayerO)) return;

    const newBoard = board.slice();
    newBoard[i] = turn;
    const nextTurn = turn === 'X' ? 'O' : 'X';

    const { error } = await supabase
      .from('tic_tac_toe_games')
      .update({ board: newBoard, current_turn: nextTurn })
      .eq('id', room.id);

    if (error) console.error(error);
  }

  async function rematch() {
    setBoard(Array(9).fill(null));
    setTurn('X');
    setWinner(null);
    setStatus('playing');
    setShowModal(false);

    const { error } = await supabase
      .from('tic_tac_toe_games')
      .update({
        board: Array(9).fill(null),
        current_turn: 'X',
        status: 'playing',
      })
      .eq('id', room.id);

    if (error) console.error(error);
  }

  function winnerName() {
    if (!winner) return null;
    if (winner === 'X') return room.player1;
    if (winner === 'O') return room.player2;
  }

  return (
    <div className="game">
      <h1>Online Multiplayer Game</h1>
      <p>
        You are playing as: <strong>{isPlayerX ? 'X' : isPlayerO ? 'O' : 'Spectator'}</strong>
      </p>
      <Board squares={board} onClick={makeMove} disabled={status !== 'playing' || winner} />

      <div className="game-buttons">
        <button className="undo-button" onClick={onBack}>
          Back to Lobby
        </button>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{winner ? `🎉 ${winnerName()} wins!` : '🤝 It’s a draw!'}</h2>
            <button className="start-btn" onClick={rematch}>
              Rematch
            </button>
            <button className="start-btn" onClick={onBack} style={{ marginLeft: '10px' }}>
              Back to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Board({ squares, onClick, disabled }) {
  function handleClick(i) {
    if (disabled) return;
    onClick(i);
  }

  return (
    <div className="board">
      {squares.map((val, i) => (
        <button key={i} className={`square ${val ? 'animate' : ''}`} onClick={() => handleClick(i)}>
          {val}
        </button>
      ))}
    </div>
  );
}

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
