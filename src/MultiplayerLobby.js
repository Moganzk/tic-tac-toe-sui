import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import MultiplayerGame from './MultiplayerGame';

export default function MultiplayerLobby({ onBack }) {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  
  // Track actual player in current game
  const [playerName, setPlayerName] = useState('');

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
    setPlayerName(newPlayerName.trim()); // Set actual player name here
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
    setPlayerName(newPlayerName.trim()); // Set actual player name here
  }

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
                // Store the id of the room user wants to join, join after entering name
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
              className="w-full max-w-xs px-5 py-3 mb-5 text-white bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-75 placeholder-gray-400 placeholder-opacity-75 transition duration-300 ease-in-out transform hover:scale-105"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
            />
            {!window.pendingJoinRoomId && (
              <input
                type="text"
                placeholder="Room Name"
                className="w-full max-w-xs px-4 py-3 mb-4 text-white bg-gray-800 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 transition"
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
                    // Join the selected room after entering name
                    await joinRoom(window.pendingJoinRoomId);
                    window.pendingJoinRoomId = null;
                    setShowCreateModal(false);
                  } else {
                    // Create a new room
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
    </div>
  );
}
