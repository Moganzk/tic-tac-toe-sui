import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import MultiplayerGame from './MultiplayerGame';

export default function MultiplayerLobby({ onBack }) {
  // eslint-disable-next-line no-unused-vars
  const [roomId, setRoomId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);

  // Fetch rooms from DB
  async function fetchRooms() {
    const { data, error } = await supabase.from('rooms').select('*');
    if (!error) setRooms(data);
  }

  useEffect(() => {
    fetchRooms();

    // Use Supabase channel subscription for real-time updates
    const roomChannel = supabase
      .channel('public:rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
        },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, []);

  async function createRoom() {
    if (!playerName.trim()) return alert('Please enter your name.');
    const { data, error } = await supabase
      .from('rooms')
      .insert([{ player1: playerName.trim(), board: Array(9).fill(null), status: 'waiting' }])
      .select()
      .single();

    if (!error) {
      setCurrentRoom(data);
      setRoomId(data.id);
    }
  }

  async function joinRoom(id) {
    if (!playerName.trim()) return alert('Please enter your name.');
    const { data: room, error } = await supabase.from('rooms').select('*').eq('id', id).single();

    if (!error && room.status === 'waiting') {
      const { error: joinError } = await supabase
        .from('rooms')
        .update({ player2: playerName.trim(), status: 'playing' })
        .eq('id', id);

      if (!joinError) {
        setCurrentRoom({ ...room, player2: playerName.trim(), status: 'playing' });
        setRoomId(id);
      }
    } else {
      alert('Room is full or unavailable.');
      fetchRooms();
    }
  }

  if (currentRoom) {
    return <MultiplayerGame room={currentRoom} playerName={playerName} onBack={onBack} />;
  }

  return (
    <div className="start-screen">
      <h1>Online Multiplayer Lobby</h1>
      <input
        placeholder="Your Name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />
      <button className="start-btn" onClick={createRoom} disabled={!playerName.trim()}>
        Create Room
      </button>

      <h2>Available Rooms</h2>
      <ul>
        {rooms
          .filter((r) => r.status === 'waiting')
          .map((room) => (
            <li key={room.id}>
              Room {room.id} — Host: {room.player1}
              <button className="start-btn" onClick={() => joinRoom(room.id)}>
                Join
              </button>
            </li>
          ))}
      </ul>

      <button className="undo-button" onClick={onBack} style={{ marginTop: '20px' }}>
        Back to Mode Selection
      </button>
    </div>
  );
}
