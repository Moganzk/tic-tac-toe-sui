import { useState, useEffect } from 'react';
import { useWallet } from './WalletProvider';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import toast, { Toaster } from 'react-hot-toast';

const SUI_RPC = 'https://fullnode.devnet.sui.io';

export default function MultiplayerGame({ gameId, packageAddress, onBack }) {
  const wallet = useWallet();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [makingMove, setMakingMove] = useState(false);
  const [error, setError] = useState('');
  const [txDigest, setTxDigest] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Fetch game state from chain
  useEffect(() => {
    fetchGame();
    const interval = setInterval(fetchGame, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [gameId, packageAddress, txDigest]);

  useEffect(() => {
    if (game && game.status === 2) setShowModal(true);
  }, [game]);

  async function fetchGame() {
    setLoading(true);
    setError('');
    try {
      const client = new SuiClient({ url: SUI_RPC });
      const resp = await client.getObject({
        id: gameId,
        options: { showContent: true },
      });
      if (resp.data && resp.data.content && resp.data.content.fields) {
        setGame(resp.data.content.fields);
      } else {
        setError('Game not found or invalid format');
      }
    } catch (e) {
      setError('Failed to fetch game');
    }
    setLoading(false);
  }

  async function makeMove(i) {
    if (!game || makingMove || game.status !== 1) return;
    const isX = wallet.account?.address === game.player_x;
    const isO = wallet.account?.address === game.player_o;
    const isMyTurn = (game.turn === 1 && isX) || (game.turn === 2 && isO);
    if (!isMyTurn) return;
    if (game.board[i] !== 0) return;
    setMakingMove(true);
    setError('');
    setTxDigest('');
    try {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const tx = new TransactionBlock();
      tx.moveCall({
        target: `${packageAddress}::tic_tac_toe_sui::make_move`,
        arguments: [
          tx.object(gameId),
          tx.pure.u8(row),
          tx.pure.u8(col),
        ],
      });
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: { showEffects: true },
      });
      setTxDigest(result.digest);
      setShowModal(false);
      toast.success('Move submitted!');
    } catch (e) {
      setError(e.message || 'Failed to make move');
      toast.error(e.message || 'Failed to make move');
    }
    setMakingMove(false);
  }

  function renderStatus() {
    if (!game) return '';
    if (game.status === 0) return 'Waiting for second player...';
    if (game.status === 1) {
      const isX = wallet.account?.address === game.player_x;
      const isO = wallet.account?.address === game.player_o;
      const turn = game.turn === 1 ? 'X' : 'O';
      let yourTurn = '';
      if ((game.turn === 1 && isX) || (game.turn === 2 && isO)) {
        yourTurn = ' (Your turn)';
      }
      return `Turn: ${turn}${yourTurn}`;
    }
    if (game.status === 2) {
      if (game.result === 1) return 'X wins!';
      if (game.result === 2) return 'O wins!';
      if (game.result === 3) return 'Draw!';
    }
    return '';
  }

  function renderBoard() {
    if (!game) return null;
    const isX = wallet.account?.address === game.player_x;
    const isO = wallet.account?.address === game.player_o;
    const isMyTurn = (game.turn === 1 && isX) || (game.turn === 2 && isO);

    return (
      <div className="board">
        {game.board.map((cell, i) => (
          <button
            key={i}
            className={`square ${cell ? 'animate' : ''}`}
            onClick={() => makeMove(i)}
            disabled={
              makingMove ||
              game.status !== 1 ||
              cell !== 0 ||
              !isMyTurn
            }
          >
            {cell === 1 ? 'X' : cell === 2 ? 'O' : ''}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="game">
      <Toaster />
      <h1>On-Chain Multiplayer Game</h1>
      <div className="status">{renderStatus()}</div>
      {game && (
        <div style={{ marginBottom: 8 }}>
          <div><strong>X:</strong> {game.player_x}</div>
          <div><strong>O:</strong> {game.player_o || '(waiting...)'}</div>
          <div><strong>You:</strong> {wallet.account?.address}</div>
        </div>
      )}
      <button className="start-btn" onClick={fetchGame} disabled={loading}>
        Refresh
      </button>
      {(loading || makingMove) && <div className="spinner">Loading...</div>}
      {loading ? (
        <div>Loading game...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        renderBoard()
      )}

      <div className="game-buttons">
        <button className="undo-button" onClick={onBack}>
          Back to Lobby
        </button>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Game Over</h2>
            <div>
              {game.result === 1 && 'X wins!'}
              {game.result === 2 && 'O wins!'}
              {game.result === 3 && 'Draw!'}
            </div>
            <button className="start-btn" onClick={onBack}>
              Back to Lobby
            </button>
          </div>
        </div>
      )}
      {txDigest && (
        <div>
          Last Tx: <a href={`https://suiexplorer.com/txblock/${txDigest}?network=devnet`} target="_blank" rel="noopener noreferrer">{txDigest}</a>
        </div>
      )}
    </div>
  );
}
