import './globals.css';
import type { Metadata } from 'next';
// import { Geist, Geist_Mono } from 'next/font/google';
import { cn } from "@/lib/utils";

// const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Private Chat app ',
  description: 'Realtime chat app built with Next.js, NestJS, Socket.IO, Postgres, and Redis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans")}>
      <body>{children}</body>
    </html>
  );
}
