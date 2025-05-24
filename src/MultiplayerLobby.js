import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import MultiplayerGame from './MultiplayerGame';
import './App.css';
import { useWallet } from './WalletProvider';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';

const SUI_RPC = 'https://fullnode.devnet.sui.io';

export default function MultiplayerLobby({ onBack }) {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [packageAddress, setPackageAddress] = useState('');
  const [addressInput, setAddressInput] = useState('');

  // Track actual player in current game
  const [playerName, setPlayerName] = useState('');

  const wallet = useWallet();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [txDigest, setTxDigest] = useState('');

  // On-chain games
  const [onChainGames, setOnChainGames] = useState([]);
  const [fetchingOnChain, setFetchingOnChain] = useState(false);
  const [onChainGameId, setOnChainGameId] = useState(null);

  // Fetch rooms on mount and real-time updates
  useEffect(() => {
    fetchRooms();

    const channel = supabase
      .channel('public:tic_tac_toe_games')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tic_tac_toe_games' },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchRooms() {
    const { data, error } = await supabase
      .from('tic_tac_toe_games')
      .select('*')
      .eq('status', 'waiting');
    if (!error) setRooms(data);
  }

  async function createRoom() {
    if (!newPlayerName.trim() || !newRoomName.trim()) {
      alert('Please enter both room name and your name.');
      return;
    }

    const { data, error } = await supabase
      .from('tic_tac_toe_games')
      .insert([
        {
          room_name: newRoomName.trim(),
          player1: newPlayerName.trim(),
          board: Array(9).fill(null),
          status: 'waiting',
          current_turn: 'X',
        },
      ])
      .select()
      .single();

    if (error) {
      alert('Error creating room: ' + error.message);
      return;
    }

    setCurrentRoom(data);
    setPlayerName(newPlayerName.trim());
    setShowCreateModal(false);
    setNewRoomName('');
    setNewPlayerName('');
  }

  async function joinRoom(id) {
    if (!newPlayerName.trim()) {
      alert('Please enter your name in the popup to join a room.');
      setShowCreateModal(true);
      return;
    }

    const { data: room, error } = await supabase
      .from('tic_tac_toe_games')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      alert('Error fetching room data');
      return;
    }

    if (room.status !== 'waiting') {
      alert('Room is full or unavailable.');
      fetchRooms();
      return;
    }

    const { error: joinError } = await supabase
      .from('tic_tac_toe_games')
      .update({ player2: newPlayerName.trim(), status: 'playing' })
      .eq('id', id);

    if (joinError) {
      alert('Error joining room: ' + joinError.message);
      return;
    }

    setCurrentRoom({ ...room, player2: newPlayerName.trim(), status: 'playing' });
    setPlayerName(newPlayerName.trim());
  }

  // On-chain integration

  // Fetch on-chain games when packageAddress or txDigest changes
  useEffect(() => {
    if (packageAddress && isValidSuiAddress(packageAddress)) {
      fetchOnChainGames();
    }
    // eslint-disable-next-line
  }, [packageAddress, txDigest]);

  async function fetchOnChainGames() {
    setFetchingOnChain(true);
    setError('');
    try {
      const client = new SuiClient({ url: SUI_RPC });
      // Query all objects of type Game for this package
      const resp = await client.getOwnedObjects({
        owner: packageAddress,
        filter: { StructType: `${packageAddress}::tic_tac_toe_sui::Game` },
        options: { showType: true, showContent: true },
      });
      setOnChainGames(resp.data || []);
    } catch (e) {
      setError('Failed to fetch on-chain games');
    }
    setFetchingOnChain(false);
  }

  async function createGameOnChain() {
    setCreating(true);
    setError('');
    setTxDigest('');
    try {
      const tx = new TransactionBlock();
      tx.moveCall({
        target: `${packageAddress}::tic_tac_toe_sui::create_game`,
        arguments: [],
      });
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: { showEffects: true },
      });
      setTxDigest(result.digest);
      // Get the new game objectId from the transaction result
      const created = result.effects?.created?.[0]?.reference?.objectId;
      if (created) setOnChainGameId(created);
    } catch (e) {
      setError(e.message || 'Failed to create game');
    }
    setCreating(false);
  }

  async function joinOnChainGame(gameId) {
    setCreating(true);
    setError('');
    setTxDigest('');
    try {
      const tx = new TransactionBlock();
      tx.moveCall({
        target: `${packageAddress}::tic_tac_toe_sui::join_game`,
        arguments: [tx.object(gameId)],
      });
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: { showEffects: true },
      });
      setTxDigest(result.digest);
      setOnChainGameId(gameId);
    } catch (e) {
      setError(e.message || 'Failed to join game');
    }
    setCreating(false);
  }

  // Only allow valid Sui addresses (starts with 0x and 64 hex chars)
  function isValidSuiAddress(addr) {
    return /^0x[a-fA-F0-9]{64}$/.test(addr);
  }

  // On-chain game view
  if (onChainGameId) {
    return (
      <MultiplayerGame
        gameId={onChainGameId}
        packageAddress={packageAddress}
        onBack={() => {
          setOnChainGameId(null);
          setTxDigest('');
        }}
      />
    );
  }

  // Supabase game view
  if (currentRoom) {
    return <MultiplayerGame room={currentRoom} playerName={playerName} onBack={onBack} />;
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Online Multiplayer Lobby</h1>

      <button
        className="start-btn"
        onClick={() => {
          setShowCreateModal(true);
          setNewRoomName('');
          setNewPlayerName('');
          window.pendingJoinRoomId = null;
        }}
      >
        Create Room
      </button>

      <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
      {rooms.length === 0 && <p className="text-gray-600">No rooms available. Create one!</p>}
      <ul className="space-y-3">
        {rooms.map((room) => (
          <li
            key={room.id}
            className="flex justify-between items-center border border-gray-300 rounded px-4 py-2"
          >
            <div>
              <strong>{room.room_name}</strong> — Host: {room.player1}
            </div>
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded"
              onClick={() => {
                setShowCreateModal(true);
                setNewRoomName('');
                setNewPlayerName('');
                window.pendingJoinRoomId = room.id;
              }}
            >
              Join
            </button>
          </li>
        ))}
      </ul>

      <button
        className="start-btn"
        onClick={onBack}
      >
        Back to Mode Selection
      </button>

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Enter Details</h3>

            <input
              type="text"
              placeholder="Your Name"
              className="start-screen"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
            />
            {!window.pendingJoinRoomId && (
              <input
                type="text"
                placeholder="Room Name"
                className="start-screen"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
            )}  

            <div className="flex justify-end space-x-3">
              <button
                className="undo-button"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRoomName('');
                  setNewPlayerName('');
                  window.pendingJoinRoomId = null;
                }}
              >
                Cancel
              </button>

              <button
                className="start-btn"
                onClick={async () => {
                  if (window.pendingJoinRoomId) {
                    await joinRoom(window.pendingJoinRoomId);
                    window.pendingJoinRoomId = null;
                    setShowCreateModal(false);
                  } else {
                    await createRoom();
                  }
                }}
              >
                {window.pendingJoinRoomId ? 'Join Room' : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4 mt-8">Or Create On-Chain Game</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter Sui Package Address (0x...)"
          className="start-screen"
          value={addressInput}
          onChange={e => {
            setAddressInput(e.target.value);
            setError('');
          }}
        />
        <button
          className="start-btn"
          style={{ marginLeft: 8 }}
          onClick={() => {
            if (isValidSuiAddress(addressInput)) {
              setPackageAddress(addressInput);
              setError('');
            } else {
              setError('Invalid Sui address. Must be 0x + 64 hex chars.');
            }
          }}
        >
          Set Address
        </button>
      </div>
      {packageAddress && !error && (
        <div className="mb-2 text-green-700">Using package: {packageAddress}</div>
      )}

      <button
        className="start-btn"
        onClick={createGameOnChain}
        disabled={creating || !wallet.account || !isValidSuiAddress(packageAddress)}
      >
        {creating ? 'Creating...' : 'Create On-Chain Game'}
      </button>
      {txDigest && <div>Game created! Tx: {txDigest}</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <h2 className="text-xl font-semibold mb-4 mt-8">On-Chain Games</h2>
      {fetchingOnChain && <div>Loading on-chain games...</div>}
      {!fetchingOnChain && onChainGames.length === 0 && (
        <div className="text-gray-600">No on-chain games found for this package.</div>
      )}
      <ul className="space-y-3">
        {onChainGames.map((gameObj) => (
          <li
            key={gameObj.objectId}
            className="flex justify-between items-center border border-blue-300 rounded px-4 py-2"
          >
            <div>
              <strong>Game ID:</strong> {gameObj.objectId}
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded"
              onClick={() => joinOnChainGame(gameObj.objectId)}
              disabled={creating}
            >
              Join On-Chain
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
