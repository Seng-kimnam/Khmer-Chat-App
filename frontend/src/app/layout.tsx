import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Angkor Chat app ',
  description: 'Realtime chat app built with Next.js, NestJS, Socket.IO, Postgres, and Redis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
