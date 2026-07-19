'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';

interface ChatMessage {
  id?: string;
  username: string;
  content: string;
  createdAt: string | Date;
}

interface ChatRoomProps {
  room: string;
  username: string;
}

export default function ChatRoom({ room, username }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [presence, setPresence] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      setConnected(true);
      socket.emit('joinRoom', { room, username });
    }

    function onDisconnect() {
      setConnected(false);
    }

    function onHistory(history: ChatMessage[]) {
      setMessages(history);
    }

    function onNewMessage(message: ChatMessage) {
      setMessages((prev) => [...prev, message]);
    }

    function onPresence(data: { room: string; users: string[] }) {
      if (data.room === room) setPresence(data.users);
    }

    function onUserTyping(data: { username: string; isTyping: boolean }) {
      setTypingUsers((prev) => {
        if (data.isTyping) {
          return prev.includes(data.username) ? prev : [...prev, data.username];
        }
        return prev.filter((u) => u !== data.username);
      });
    }

    function onSystemJoin(data: { username: string }) {
      setMessages((prev) => [
        ...prev,
        {
          username: 'system',
          content: `${data.username} joined the room`,
          createdAt: new Date(),
        },
      ]);
    }

    function onSystemLeave(data: { username: string }) {
      setMessages((prev) => [
        ...prev,
        {
          username: 'system',
          content: `${data.username} left the room`,
          createdAt: new Date(),
        },
      ]);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('roomHistory', onHistory);
    socket.on('newMessage', onNewMessage);
    socket.on('presence', onPresence);
    socket.on('userTyping', onUserTyping);
    socket.on('userJoined', onSystemJoin);
    socket.on('userLeft', onSystemLeave);

    if (socket.connected) onConnect();

    return () => {
      socket.emit('leaveRoom', { room, username });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('roomHistory', onHistory);
      socket.off('newMessage', onNewMessage);
      socket.off('presence', onPresence);
      socket.off('userTyping', onUserTyping);
      socket.off('userJoined', onSystemJoin);
      socket.off('userLeft', onSystemLeave);
    };
  }, [room, username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;

    const socket = getSocket();
    socket.emit('sendMessage', { room, username, content });
    socket.emit('typing', { room, username, isTyping: false });
    setDraft('');
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    const socket = getSocket();
    socket.emit('typing', { room, username, isTyping: true });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', { room, username, isTyping: false });
    }, 1500);
  }

  const othersTyping = typingUsers.filter((u) => u !== username);

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.roomName}>#{room}</h2>
          <span style={styles.status}>
            {connected ? 'Connected' : 'Connecting...'} · {presence.length}{' '}
            online
          </span>
        </div>
        <button style={styles.leaveButton} onClick={() => router.push('/')}>
          Leave
        </button>
      </header>

      <div style={styles.messages}>
        {messages.map((m, i) => (
          <div
            key={m.id ?? i}
            style={{
              ...styles.messageRow,
              justifyContent:
                m.username === username ? 'flex-end' : 'flex-start',
            }}
          >
            {m.username === 'system' ? (
              <div style={styles.systemMessage}>{m.content}</div>
            ) : (
              <div
                style={{
                  ...styles.bubble,
                  background: m.username === username ? '#4f7cff' : '#222735',
                }}
              >
                {m.username !== username && (
                  <div style={styles.bubbleAuthor}>{m.username}</div>
                )}
                <div>{m.content}</div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={styles.typingRow}>
        {othersTyping.length > 0 &&
          `${othersTyping.join(', ')} ${
            othersTyping.length === 1 ? 'is' : 'are'
          } typing...`}
      </div>

      <form style={styles.inputRow} onSubmit={sendMessage}>
        <input
          style={styles.input}
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          placeholder="Type a message"
          maxLength={2000}
        />
        <button style={styles.sendButton} type="submit" disabled={!connected}>
          Send
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: 720,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #262b36',
  },
  roomName: { margin: 0, fontSize: '1.1rem' },
  status: { fontSize: '0.75rem', color: '#9aa2b1' },
  leaveButton: {
    background: 'transparent',
    border: '1px solid #2c3140',
    color: '#e6e6e6',
    borderRadius: 8,
    padding: '0.4rem 0.8rem',
    cursor: 'pointer',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  messageRow: { display: 'flex' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 12,
    padding: '0.5rem 0.75rem',
    fontSize: '0.95rem',
    lineHeight: 1.4,
  },
  bubbleAuthor: {
    fontSize: '0.7rem',
    color: '#9aa2b1',
    marginBottom: '0.15rem',
  },
  systemMessage: {
    margin: '0 auto',
    fontSize: '0.75rem',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  typingRow: {
    minHeight: '1.25rem',
    padding: '0 1.25rem',
    fontSize: '0.75rem',
    color: '#9aa2b1',
  },
  inputRow: {
    display: 'flex',
    gap: '0.5rem',
    padding: '1rem 1.25rem',
    borderTop: '1px solid #262b36',
  },
  input: {
    flex: 1,
    background: '#0f1115',
    border: '1px solid #2c3140',
    borderRadius: 8,
    padding: '0.6rem 0.75rem',
    color: '#e6e6e6',
    fontSize: '1rem',
  },
  sendButton: {
    background: '#4f7cff',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '0.6rem 1.1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
