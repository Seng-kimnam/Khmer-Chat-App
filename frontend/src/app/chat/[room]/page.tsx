'use client';

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatRoom from '@/components/ChatRoom';

export default function ChatPage() {
  const params = useParams<{ room: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const name = searchParams.get('username');
    if (!name) {
      router.replace('/');
      return;
    }
    setUsername(name);
  }, [searchParams, router]);

  if (!username) return null;

  const room = decodeURIComponent(params.room);

  return <ChatRoom room={room} username={username} />;
}
