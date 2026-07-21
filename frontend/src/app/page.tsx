'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('general');
  const router = useRouter();

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimmedUser = username.trim();
    const trimmedRoom = room.trim() || 'general';
    if (!trimmedUser) return;

    const params = new URLSearchParams({ username: trimmedUser });
    router.push(`/chat/${encodeURIComponent(trimmedRoom)}?${params.toString()}`);
  }

  return (
    <main style={styles.main}>
      <form style={styles.card} onSubmit={handleJoin}>
        <h1 style={styles.title}>Enjoyable Chat</h1>
        <p style={styles.subtitle}>
          Take your time to chat with your friends
        </p>

        <label style={styles.label}>
          Display name
          <input
            style={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. kimnam"
            maxLength={50}
            required
          />
        </label>

        <label style={styles.label}>
          Room
          <input
            style={styles.input}
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="general"
            maxLength={50}
          />
        </label>

        <button style={styles.button} type="submit">
          Join chat
        </button>
      </form>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: '#171a21',
    border: '1px solid #262b36',
    borderRadius: 12,
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  title: { margin: 0, fontSize: '1.5rem' },
  subtitle: { margin: 0, color: '#9aa2b1', fontSize: '0.9rem' },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    fontSize: '0.85rem',
    color: '#c3c9d4',
  },
  input: {
    background: '#0f1115',
    border: '1px solid #2c3140',
    borderRadius: 8,
    padding: '0.6rem 0.75rem',
    color: '#e6e6e6',
    fontSize: '1rem',
  },
  button: {
    marginTop: '0.5rem',
    background: '#4f7cff',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '0.7rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
