# Realtime Chat App

Next.js + NestJS + Socket.IO + PostgreSQL + Redis, all wired up with
Docker Compose.

## Architecture

```
┌──────────────┐   WebSocket    ┌───────────────┐
│   Next.js    │ ◄────────────► │    NestJS     │
│  (frontend)  │   Socket.IO    │  (backend +   │
│  port 3000   │                │  gateway)     │
└──────────────┘                │  port 4000    │
                                 └───────┬───────┘
                                    │         │
                          ┌─────────┘         └─────────┐
                          ▼                             ▼
                  ┌───────────────┐            ┌───────────────┐
                  │  PostgreSQL   │            │     Redis     │
                  │ (chat history)│            │ (Socket.IO    │
                  │  port 5432    │            │  pub/sub      │
                  └───────────────┘            │  adapter)     │
                                                └───────────────┘
```

- **Frontend (Next.js, TypeScript)** — a join screen and a chat room page.
  Connects to the backend over Socket.IO, shows message history, live
  messages, presence (who's online), and typing indicators.
- **Backend (NestJS)** — a `ChatGateway` handles the Socket.IO events
  (`joinRoom`, `sendMessage`, `typing`, `leaveRoom`). Messages are persisted
  via TypeORM to Postgres. A small REST controller also exposes
  `GET /chat/rooms` and `GET /chat/rooms/:name/messages` if you want to pull
  history outside of a socket connection.
- **PostgreSQL** — stores `rooms` and `messages` tables (auto-created via
  TypeORM `synchronize: true`, fine for a project like this — swap for
  migrations if you productionize it).
- **Redis** — used as the Socket.IO adapter's pub/sub backbone. This is what
  lets you scale the backend to multiple instances/containers and still have
  a message sent from one instance reach clients connected to another.

## Running it

```bash
docker compose up --build
```

Then open:
- Frontend: http://localhost:3000
- Backend health/API: http://localhost:4000/chat/rooms

Open the frontend in two browser tabs (or two browsers), join the same room
with different display names, and start chatting — messages, join/leave
notices, presence count, and typing indicators all sync live.

## Running without Docker (local dev)

You'll need Postgres and Redis running locally (or point `DB_HOST`/`REDIS_HOST`
at any running instances).

```bash
# Backend
cd backend
cp .env.example .env   # adjust host/ports if not using Docker
npm install
npm run start:dev

# Frontend (separate terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

## Project layout

```
chat-app/
├── docker-compose.yml
├── backend/                  # NestJS
│   ├── src/
│   │   ├── main.ts           # bootstrap + Redis Socket.IO adapter
│   │   ├── app.module.ts     # TypeORM + config wiring
│   │   ├── redis-io.adapter.ts
│   │   └── chat/
│   │       ├── chat.gateway.ts     # Socket.IO event handlers
│   │       ├── chat.service.ts     # DB access (rooms/messages)
│   │       ├── chat.controller.ts  # REST endpoints
│   │       ├── chat.module.ts
│   │       ├── entities/            # Room, Message (TypeORM)
│   │       └── dto/                 # validated payloads
│   └── Dockerfile
└── frontend/                 # Next.js (App Router)
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx              # join screen
    │   │   └── chat/[room]/page.tsx  # chat route
    │   ├── components/ChatRoom.tsx   # socket client + chat UI
    │   └── lib/socket.ts              # socket.io-client singleton
    └── Dockerfile
```

## Socket.IO events reference

| Event          | Direction        | Payload                                         |
|----------------|------------------|--------------------------------------------------|
| `joinRoom`     | client → server  | `{ room, username }`                              |
| `roomHistory`  | server → client  | `Message[]` (sent right after joining)            |
| `sendMessage`  | client → server  | `{ room, username, content }`                     |
| `newMessage`   | server → room    | `{ id, username, content, createdAt }`             |
| `typing`       | client → server  | `{ room, username, isTyping }`                    |
| `userTyping`   | server → room    | `{ username, isTyping }`                          |
| `userJoined`   | server → room    | `{ username, room }`                              |
| `userLeft`     | server → room    | `{ username, room }`                              |
| `presence`     | server → room    | `{ room, users: string[] }`                        |
| `leaveRoom`    | client → server  | `{ room, username }`                              |

## Ideas for extending this

- Add real authentication (you've already done Auth.js/NextAuth — swap the
  plain username field for a real login and pass a session token to the
  socket handshake for verification in `handleConnection`).
- Add per-message read receipts or reactions (new table + gateway events).
- Add a "rooms" REST endpoint on the frontend so users can browse/create
  rooms instead of typing a name.
- Rate-limit `sendMessage` per socket to prevent spam.
- Swap `synchronize: true` for TypeORM migrations before deploying anywhere real.
