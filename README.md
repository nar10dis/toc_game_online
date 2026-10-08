*This project has been created as part of the 42 curriculum by nadeluge, elaudrez, jazema, barmarti.*

# TocGameOnline

## Table of contents

1. [Description](#description)
2. [Instructions](#instructions)
3. [Team information](#team-information)
4. [Project management](#project-management)
5. [Technical stack](#technical-stack)
6. [Architecture](#architecture)
7. [Database schema](#database-schema)
8. [Features](#features)
9. [Modules](#modules)
10. [Game engine](#game-engine)
11. [Real time: WebSockets](#real-time-websockets)
12. [Visual identity and design system](#visual-identity-and-design-system)
13. [Error handling and logs](#error-handling-and-logs)
14. [Individual contributions](#individual-contributions)
15. [Challenges and trade-offs](#challenges-and-trade-offs)
16. [Resources](#resources)
17. [Known limitations](#known-limitations)

---

## Description

**TocGameOnline** is an online version of **Tock** (le jeu de Toc), a French board game played with pawns and a standard 52-card deck. Four players race their four pawns around the board and into their home. Cards decide the moves: the 4 goes backwards, the Jack swaps two pawns, the 7 can be split between several pawns, and landing on a pawn sends it back to its spawn.

The goal of the project was to build a complete real-time multiplayer web game, from the rules engine to the hand-drawn interface.

**Key features**

- Real-time games for **4 players**, created and joined with an invite code.
- Empty seats are taken by **AI opponents**, with three levels (easy, medium, hard).
- A player who leaves is **replaced by a bot** and can come back to the game at any time.
- **Global chat** on the main menu, shared by every logged-in player.
- **In-game chat**, game log, move previews, and explanations of why a card cannot be played.
- **User accounts**: sign up, log in, profile with bio and avatar, password change, log out, account deletion.
- **Friends** with live online status.
- A custom **hand-drawn design system** (paper, ink and worn lines) and animated illustrations.
- Centralised **logs** in an ELK stack.

---

## Instructions

### Prerequisites

| Tool | Version |
|---|---|
| Docker + Docker Compose, or Podman + podman-compose | tested with Podman 5.8 and podman-compose 1.6 |
| Firefox, Google Chrome or any browser | latest stable |

Nothing else needs to be installed on the host: Node, PostgreSQL, nginx and the ELK stack all run in containers.

### Environment

Credentials are never committed. Two example files are provided; copy them and fill in your own values:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

| File | Variables | Used by |
|---|---|---|
| `.env` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | postgres, frontend, nginx |
| `backend/.env` | `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT` (optional, 3001 by default) | backend |

`DATABASE_URL` must use the same user, password and database as `.env`, with `postgres` (the Docker service name) as host:
`postgresql://<user>:<password>@postgres:5432/<db>`.

### Run

```bash
docker compose up --build
```

Then open **https://localhost:8443**. The certificate is self-signed, so the browser shows a warning that has to be accepted once.

On start-up the backend applies the database migrations (`prisma migrate deploy`) and generates the Prisma client by itself: there is no manual step.

| Command | Effect |
|---|---|
| `docker compose up --build -d` | start everything in the background |
| `docker compose logs -f backend` | follow the logs of one service |
| `docker compose down` | stop everything (data stays in the `db_data` volume) |
| `docker compose down -v` | stop everything and **erase** the database |

---

## Team information

| Member | Role(s) | Responsibilities |
|---|---|---|
| **elaudrez** | Tech Lead, Developer | Chose the technical stack (the team aligned on it, given a DevOps profile). Owns the infrastructure: Docker Compose, nginx and HTTPS, PostgreSQL and Prisma set-up, ELK. Worked on authentication and profile. |
| **nadeluge** | Project Manager, Developer | Brought the team together and coordinated the work, present on site from August to the end. Owns the game: rules engine, AI, game service and WebSockets. Also profile, friends, design system and error handling. |
| **jazema** | Product Owner, Developer | Brought experience from large web projects at Epitech and set the product priorities. Owns most of the front end of the game: board and pawn animations, in-game chat, turn feedback, card hints. Helped wherever needed ("joker"). |
| **barmarti** | Developer | General-purpose developer: authentication, profile and friends, tests. Being a dad too. |


---

## Project management

- **Organisation.** Work was split by area: infrastructure and DevOps (elaudrez), game engine and real time (nadeluge), game front end (jazema),  cross-cutting work (barmarti). Everyone could take tasks in other areas when needed.
- **Task tracking.** We started with GitHub Issues, but it didn't stick. We moved to a shared **Notion** page and plain to-do lists.txt.
- **Communication.** **Discord** for daily messages and for meetings. Meetings were screen-sharing sessions where someone walked the others through their code. As we kept each other informed every day, few formal meetings were needed.
- **Git workflow.** One branch per person (`nardis_dev`, `elsa`, `dev_barn`…) → merged into **`dev`** → tested and reviewed → merged into **`main`** once stable.

---

## Technical stack

| Layer | Technology | Why we chose it |
|---|---|---|
| Front end | **Next.js 16** (Pages Router), **React 19** | React's component model fits a game UI made of many small animated pieces. Next.js gives routing, server rendering and image optimisation out of the box. |
| Front end | **Tailwind CSS 4**, shadcn/ui (as a base, restyled) | Design tokens defined once and reused everywhere as classes. shadcn gives accessible primitives that we own and can restyle. |
| Front end | **motion** | Spring animations for pawns, cards and illustrations, declared in React. |
| Back end | **NestJS 11** (TypeScript) | A structured framework with modules, guards, pipes and WebSocket gateways. TypeScript on both sides lets the front and the back share the same game types. |
| Real time | **socket.io** | Rooms, automatic reconnection and acknowledgements, which a turn-based game needs. |
| Database | **PostgreSQL 18** | Our data is relational: users, profiles, friendships, games and players are linked by foreign keys, and we need uniqueness and cascades enforced by the database. |
| ORM | **Prisma 7** | A readable schema, versioned migrations and a fully typed client. |
| Auth | JWT in **httpOnly cookies**, **bcrypt** | Tokens unreadable by JavaScript (protected from XSS), passwords hashed and salted. |
| Reverse proxy | **nginx** | Single HTTPS entry point: front end, API and WebSockets on the same origin, so no CORS. |
| Logs | **Elasticsearch, Logstash, Kibana**, pino | Structured JSON logs from the backend and nginx, searchable in one place. |
| Containers | **Docker Compose** | The whole project starts with one command. |

---

## Architecture

```
                              browser
                                 │
                                 │  https://localhost:8443
                                 ▼
                  ┌──────────────────────────────┐
                  │            nginx             │
                  │   TLS, single entry point    │
                  └──────────────────────────────┘
                     │            │            │
                    "/"        "/api/"       "/ws/"
                  (pages)      (HTTP)     (WebSocket)
                     │            │            │
                     ▼            └─────┬──────┘
        ┌──────────────────┐            ▼
        │     frontend     │  ┌──────────────────────────────┐
        │  Next.js  :3000  │  │           backend            │
        └──────────────────┘  │         NestJS :3001         │
                              │                              │
                              │  AuthModule     (HTTP)       │
                              │  ProfileModule  (HTTP)       │
                              │  FriendsModule  (HTTP + WS)  │
                              │  GameModule     (HTTP + WS)  │
                              │     └── engine/ (pure, no    │
                              │         Nest, no database)   │
                              └──────────────┬───────────────┘
                                             │ Prisma
                                             ▼
                                    ┌─────────────────┐
                                    │   PostgreSQL    │
                                    └─────────────────┘
```

**Key principles**

- **One entry point: nginx.** The browser never talks to the front end or the back end directly. `/api/` and `/ws/` go to the backend, everything else goes to Next.js.
- **The server is the authority.** The front end applies no rule: it sends an intention ("I play this card on this pawn"), and the server checks it and accepts or refuses it.
- **A running game lives in memory** (a `Map` in `GameService`). The database stores only what must last: users, profiles, friendships, games and who played them.
- **The rules engine is pure.** `backend/src/game/engine/` only contains functions of the form `(state, action) → new state`, with no Nest, no Prisma and no mutation. This makes it easy to read, test and reuse.

### Main HTTP routes

All routes are prefixed with `/api`. ✔ = needs a logged-in user (`AuthGuard`).

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | — | create an account and an empty profile |
| POST | `/auth/login` | — | set the `jwt` and `refresh_token` cookies |
| POST | `/auth/refresh` | refresh cookie | new pair of tokens (rotation) |
| GET | `/auth/session` | — | who is logged in (`{ user }` or `{ user: null }`) |
| PATCH | `/auth/password` | ✔ | change password, other devices are logged out |
| POST | `/auth/logout` | ✔ | revoke the refresh token, clear the cookies |
| GET · PATCH · DELETE | `/profile` | ✔ | read, edit (name, bio), delete the account |
| POST · DELETE | `/profile/avatar` | ✔ | upload or remove the avatar |
| GET | `/friends` | ✔ | friends, incoming and outgoing requests |
| POST | `/friends/requests` | ✔ | send a friend request |
| POST | `/friends/requests/:userId/accept` | ✔ | accept a request |
| DELETE | `/friends/:userId` | ✔ | remove a friend, decline or cancel a request |
| POST | `/game` | ✔ | create a game (the creator is the host, seat 0) |
| POST | `/game/join/:inviteCode` | ✔ | join a waiting game |
| POST | `/game/:gameId/start` | ✔ | the host starts the game, bots fill the empty seats |
| POST | `/game/ai-level/:gameId/:seat/:level` | ✔ | the host sets a bot's level |

---

## Database schema

Schema: `backend/prisma/schema.prisma`, with one migration per change in `backend/prisma/migrations/`.

```
                 ┌──────────────────────┐
                 │         User         │
                 │ id            Int PK │
                 │ name       String UQ │
                 │ email      String UQ │
                 │ password      String │  (bcrypt hash)
                 │ hashedRefreshToken ? │  (SHA-256 hash)
                 │ createdAt / updatedAt│
                 └──────────────────────┘
          1 │ 1            1 │ *              1 │ *  (twice)
            ▼                ▼                  ▼
 ┌──────────────────┐ ┌───────────────────┐ ┌─────────────────────────────┐
 │     Profile      │ │    GamePlayer     │ │         Friendship          │
 │ userId Int FK UQ │ │ idPlayer   Int PK │ │ id               Int PK     │
 │ bio      String? │ │ userId     Int FK │ │ requesterId      Int FK     │
 │ avatarUrl String?│ │ gameId     Int FK │ │ addresseeId      Int FK     │
 └──────────────────┘ │ seat          Int │ │ status  pending | accepted  │
                      │ joindedAt         │ │ createdAt                   │
                      └───────────────────┘ │ UQ(requesterId,addresseeId) │
                               * │          └─────────────────────────────┘
                                 ▼ 1
                      ┌─────────────────────────────────┐
                      │              Game               │
                      │ idGame         Int PK           │
                      │ inviteCode     String UQ        │
                      │ phase  waiting|playing|finished │
                      │ winnerSeat     Int?             │
                      │ createdAt / finishedAt?         │
                      └─────────────────────────────────┘
```

| Table | Role |
|---|---|
| `User` | an account. The password and the refresh token are only stored as hashes. |
| `Profile` | public information, created empty at sign-up. |
| `Friendship` | one row per pair of users: a pending request or an accepted friendship. |
| `Game` | one game: invite code, phase, winner. |
| `GamePlayer` | a human sitting on a seat of a game. Bots are not stored. |

Deleting a `User` deletes their `Profile`, `Friendship` and `GamePlayer` rows (`onDelete: Cascade`).

> The database does **not** store the state of a running game (pawns, cards): it lives in memory in `GameService`. If the backend restarts, games in progress are lost.

---

## Features

| Feature | Description |
|---|---|
| Sign up / log in | Email and password, server-side checks, bcrypt hash, JWT in httpOnly cookies |
| Session refresh | 15-minute access token, 7-day refresh token with rotation, stored as a hash and revocable |
| Private pages | Every page except login, register, rules and legal pages sends to `/login` when nobody is logged in |
| Profile | Name, bio, avatar upload (checked on the real file bytes, with initials by default), statistics |
| Account | Change password, log out, delete the account (password asked again) |
| Friends | Send, accept, decline, remove; online status updated live |
| Create / join a game | Invite code, live waiting room, the host sets the bot levels |
| Rules engine | All Tock rules: exit, move, enter home, swap (Jack), back (4), split (7), captures, blocking, discard |
| AI opponents | Three levels (easy, medium, hard), human-like delay between moves |
| Disconnections | Grace delay, a bot plays for the missing player, the player can reconnect at any time |
| Game board | Board seen from your own seat, animated pawns, move previews, card hand, played-card colours |
| Turn feedback | Turn banner, game log, card hints and reasons why a card cannot be played |
| In-game chat | Messages between the players of a game, history kept for players who reconnect |
| Win screen | Winner announcement with confetti |
| Rules page | Every card explained, with tilting cards |
| Privacy Policy / Terms of Service | Real content, linked from the footer |
| Infrastructure | Docker Compose, nginx (HTTPS), PostgreSQL, Prisma migrations |
| Logs | ELK stack, structured logs, error-handling layers |

---

## Modules

**Total claimed: 20 points** (14 required, the bonus is capped at 5).

| # | Module | Type | Points | Member(s) |
|---|---|---|---|---|
| 1 | Web — Use a framework for both the front end and the back end | Major | 2 | everyone |
| 2 | Web — Real-time features using WebSockets | Major | 2 | nadeluge, jazema |
| 3 | Web — Allow users to interact with other users | Major | 2 | nadeluge, jazema |
| 4 | Web — Use an ORM for the database | Minor | 1 | elaudrez |
| 5 | Web — Custom-made design system | Minor | 1 | nadeluge, jazema |
| 6 | User Management — Standard user management and authentication | Major | 2 | nadeluge, elaudrez, barmarti |
| 7 | Gaming — Complete web-based game | Major | 2 | nadeluge, jazema |
| 8 | Gaming — Remote players | Major | 2 | nadeluge, jazema |
| 9 | Gaming — Multiplayer game (more than two players) | Major | 2 | nadeluge |
| 10 | AI — AI opponent | Major | 2 | nadeluge |
| 11 | DevOps — Log management with ELK | Major | 2 | elaudrez |
| | **Total** | | **20** | |

### 1. Frameworks (Major, 2 pts)
- **Why:** we wanted to learn the frameworks used in companies rather than reinvent routing, validation and dependency injection.
- **How:** Next.js 16 / React 19 for the front end, NestJS 11 for the back end (modules, guards, gateways, exception filters).
- **Demo:** `frontend/src/pages/` (one file = one route), `backend/src/*/*.module.ts`.

### 2. Real-time features with WebSockets (Major, 2 pts)
- **Why:** a board game where four people play together needs every move to reach everyone instantly.
- **How:** socket.io on `/ws/socket.io`, authenticated with the JWT cookie at the handshake. One room per user, so every tab of a player stays in sync. Every change of a game is broadcast to all its players; friends' online status is pushed live. Disconnections are handled: grace delay, then a bot takes over until the player comes back.
- **Demo:** two browsers in the same waiting room, then a game: every move, chat message and seat change appears on both screens.

### 3. User interaction (Major, 2 pts)
<!-- TODO before the defense: public profile page of another user (e.g. /profile/[name], reachable from the friends list) and, if possible, chat between friends outside a game. Update this paragraph once done. -->
- **Why:** a game is more fun with people you know: you find them, add them, and talk to them.
- **How:** chat between the players of a game (history kept for reconnecting players), profile pages showing a user's information, and a friends system (add, accept, remove, friends list with live online status).
- **Demo:** add a friend from `/friends`, see them come online, open their profile, chat with them during a game.

### 4. ORM (Minor, 1 pt)
- **Why:** typed queries and versioned database changes that every team member can apply.
- **How:** Prisma 7 with the `pg` adapter, schema in `schema.prisma`, migrations applied automatically on start-up.
- **Demo:** `backend/prisma/schema.prisma`, `backend/prisma/migrations/`.

### 5. Custom-made design system (Minor, 1 pt)
- **Why:** we wanted the game to have its own identity, not the look of a component library.
- **How:** colour palette, type scale, icons and more than 10 reusable components built by us. See [Visual identity and design system](#visual-identity-and-design-system).
- **Demo:** the components listed in that section, used on every page.

### 6. Standard user management (Major, 2 pts)
- **Why:** players need an identity to find friends and to be recognised in a game.
- **How:** users update their name and bio, upload an avatar (initials are shown when there is none), add friends and see their online status, and have a profile page with their information. They can also change their password, log out and delete their account.
- **Demo:** `/profile` and `/friends`.

### 7. Complete web-based game (Major, 2 pts)
- **Why:** Tock is a game we play in real life, with rich rules (split 7, swaps, captures) that make a real engine necessary.
- **How:** a pure rules engine on the server, the board and cards drawn in React, clear win condition (all four pawns home), and a rules page.
- **Demo:** create a game, start it with bots, play until the win screen.

### 8. Remote players (Major, 2 pts)
- **Why:** friends play from their own computers.
- **How:** the game is fully server-side, players join with an invite code from any computer. A lost connection is detected; after a grace delay a bot plays for the player, and on reconnection the client asks for the current state (`sync`) and the chat history.
- **Demo:** two computers in the same game; close one tab, watch the bot play, reopen it and continue.

### 9. Multiplayer, more than two players (Major, 2 pts)
- **Why:** Tock is played by four.
- **How:** four seats synchronised in real time. Each player only receives what they are allowed to see (`viewFor` hides the other hands and the draw pile) and sees the board from their own seat.
- **Demo:** three or four browsers (or private windows) with different accounts in the same game.

### 10. AI opponent (Major, 2 pts)
- **Why:** you should always be able to play, even without three friends available.
- **How:** see [The bots](#the-bots). The host chooses the level of each bot in the waiting room; bots wait a random 1 to 3 seconds before playing, like a human.
- **Demo:** start a game alone with three hard bots, then with easy bots, and compare.

### 11. Log management with ELK (Major, 2 pts)
<!-- TODO before the defense: log retention policy (ILM) and secured access to Kibana / Elasticsearch. Update this paragraph once done. -->
- **Why:** with a backend, WebSockets, background bots and nginx, we needed one place to understand what happened during a game.
- **How:** see [Error handling and logs](#error-handling-and-logs). Logs from the backend (pino) and nginx go through Logstash into Elasticsearch, with a retention policy, and are explored in Kibana with secured access.
- **Demo:** play a move, then find it in Kibana with `context : "GameService" and gameId : <id>`.

---

## Game engine

All game types are in `backend/src/game/game.types.ts`. Every engine function takes a state and returns a **new** state, without changing it.

### Board and cards

```
BOARD_CELLS_COUNT = 72     cells 0 → 71, ABSOLUTE numbering (the same for everyone)
CELLS_PER_SEAT    = 18     distance between two start cells
HOME_CELLS_COUNT  = 4      home: 0 = entrance, 3 = end

seat 0: start cell  0    home entrance after cell 69
seat 1: start cell 18    home entrance after cell 15
seat 2: start cell 36    home entrance after cell 33
seat 3: start cell 54    home entrance after cell 51
```

| Card | Effect |
|---|---|
| Ace (1), King (13) | bring a pawn out of the spawn, or move forward |
| 4 | move **backwards** 4 cells |
| 7 | split 7 steps between several pawns; the player may stop before using all 7 |
| Jack (11) | swap two pawns on the board |
| others | move forward by the card value |

- **Capture:** a pawn that ends its move on an occupied cell sends the occupant back to its spawn.
- **Blocking:** a pawn on its **own** start cell cannot be passed.
- **Deal:** 5 cards per player per round; the discard pile is reshuffled when the draw pile runs out.

### Actions and files

```ts
type GameAction =
  | { type: 'move';    cardId, pawnId }            // forward / backward
  | { type: 'enter';   cardId, pawnId }            // into the home
  | { type: 'exit';    cardId, pawnId }            // out of the spawn
  | { type: 'swap';    cardId, pawnIdA, pawnIdB }  // Jack
  | { type: 'split';   cardId, steps[] }           // one part of a 7
  | { type: 'discard'; cardId }                    // no legal move with this card
```

Actions only contain ids, never cells: the server computes everything itself.

| File | Content |
|---|---|
| `board.ts` | geometry: start cells, home entrances, paths, distances |
| `deck.ts` | deck, shuffle, deal, the value of each card (the 4 is −4) |
| `rules.ts` | can this pawn exit, move, enter home, swap…? |
| `split.ts` | the 7 played in several parts |
| `legalMoves.ts` | `getLegalActions` (every legal move) and `isLegal` |
| `apply.ts` | applies a validated move: pawns, captures |
| `state.ts` | game life cycle: create, add players, deal, play a turn, winner |
| `view.ts` | `viewFor(game, seat)`: what one player is allowed to see |
| `AI/` | the three bot levels |

### One list of legal moves, used three times

`getLegalActions` computes once the list of every legal move for a hand. It is the backbone of the project:

- **validation:** the server refuses any action that is not in the list, so a modified client cannot cheat;
- **the bots** only ever choose inside this list;
- **the front end** gets the same rules to show which pawns can move, preview the moves, and explain why a card is dead.

### The bots

| Level | Strategy |
|---|---|
| **easy** | a random legal move |
| **medium** | scores the board after each legal move (progress of its pawns, bonus for exiting and entering home, malus when an opponent is just behind) and plays the best one |
| **hard** | medium's evaluation, plus: it counts the cards not seen yet to estimate the real danger of each cell, plans the whole 7 (every way to split it, with a cache so it stays fast), and keeps special cards (4, 5, Jack, 7) for when they are worth the most by looking one move ahead |

None of them sees the other players' hands or the draw pile, so even the hard bot makes mistakes and can be beaten.

---

## Real time: WebSockets

socket.io is served on **`/ws/socket.io`**, which nginx forwards with the WebSocket upgrade.

**Connection**

1. The browser sends the `jwt` cookie with the handshake.
2. The gateway checks the token. If it is invalid or expired, the socket is closed; the client refreshes its session and reconnects.
3. The socket joins the room **`user-<userId>`**, so all the tabs of a player receive the state.

**Protocol**

| Direction | Message | Content | When |
|---|---|---|---|
| server → client | `state` | `{ state: GameView, event: GameEvent \| null }` | after every change, and in reply to `sync` |
| server → client | `no-game` | — | reply to `sync` when the player is in no game |
| server → client | `chat` / `chat-history` | a message / the last 50 messages | a message is sent / reply to `chat-sync` |
| client → server | `sync` | — | arriving on a game page, reconnecting |
| client → server | `action` | `{ gameId, action }` + ack `{ ok } \| { error }` | the player plays |
| client → server | `chat` | `{ gameId, text }` (1 to 200 characters) | the player sends a message |

- **`state` is the truth.** The front end displays exactly that.
- **`event` is a hint for animations:** who played what, which pawns were captured, whether a new round was dealt.
- The server works in **absolute** cells; the front end rotates the board so that each player sees their own seat at the bottom.

**Path of one move**

```
click a card, then a pawn (front end, useTurnChoice)
  → socket.emit('action', { gameId, action }, ack)
  → GameGateway.handleAction
  → GameService.playAction     (game exists? player in it? their turn?)
  → playTurn (engine)          → { game, event }
  → commit                     → Map + broadcast
  → for each human: emit('state', { state: viewFor(game, seat), event })
  → useGame (front end) → React redraws, motion animates
  → the bots play, one commit per move
```

Every visible change goes through **one** `commit` (save in the `Map`, then broadcast): there is never a half-applied state.

**Global chat** (namespace **`/chat`**, same path and same jwt check)

| Direction | Message | Content | When |
|---|---|---|---|
| server → client | `history` | the last 50 messages | on every connection |
| server → client | `message` | `{ id, userId, pseudo, text, sentAt }` | someone sends a message |
| client → server | `message` | `{ text }` (1 to 200 characters) + ack `{ ok } \| { error }` | the player sends a message |

The menu opens this socket when it mounts and closes it when it unmounts, so each visit gets the history again. Like the game chat, messages are kept in memory only.

---

## Visual identity and design system

The site has its own identity: **beige paper**, **midnight-blue ink** and **worn, hand-drawn lines**, like an old scribbled card game. Everything starts from a few tokens defined once and reused by every component.

The images of this section are in `docs/design-system/`.

### Colours

![Palette](docs/design-system/palette.png)

Every colour is a CSS variable in `frontend/src/styles/globals.css` (`:root`). Tailwind exposes them as classes (`bg-primary`, `text-muted-foreground`…): no component writes a colour by hand.

| Role | Tokens | Use |
|---|---|---|
| Paper | `--background`, `--card`, `--muted`, `--border` | page background, cards laid on it, borders |
| Ink | `--foreground`, `--muted-foreground` | text, lines, drawings |
| Blues | `--primary`, `--accent`, `--secondary` | buttons, links, focus |
| Teams | `--team-0` to `--team-3` | the four players on the board (pawns, avatars, badges) |

### Typography

![Typography](docs/design-system/typography.png)

- **Fraunces** (`font-heading`): titles, names, big buttons. A serif with character, which recalls playing cards.
- **Public Sans** (`font-body`): body text and forms. Plain and readable.
- Both are loaded with `next/font` in `_app.tsx`.
- Sizes follow a **modular scale with a 1.333 ratio** (`@theme` in `globals.css`), from `text-sm` (0.75 rem) to `text-5xl` (4.21 rem).

### The worn line

This is the visual signature of the site. Every line (frames, separators, underlines, header, footer) uses two custom CSS utilities:

- **`worn-line`**: an SVG noise (`feTurbulence`) is used as a mask and erases the line in places, like worn ink.
- **`worn-underline`**: the same for link underlines, without damaging the text.

Round shapes (board cells, pawns, badges) use `lib/game/handDrawn.ts`, which draws slightly shaky circles and lines. The shake depends on a fixed seed: the drawing never changes from one render to the next.

### Illustrations

The demons, the cards and the logo (`frontend/public/`) share the same ink style as the rest of the site.

<p>
  <img src="frontend/public/demons/heart_demon.png" height="90" alt="Heart demon">
  <img src="frontend/public/demons/spade_demon.png" height="90" alt="Spade demon">
  <img src="frontend/public/demons/diamond_demon.png" height="90" alt="Diamond demon">
  <img src="frontend/public/demons/club_demon.png" height="90" alt="Club demon">
  &nbsp;&nbsp;
  <img src="frontend/public/cards/card_heart_1.png" height="90" alt="Ace of hearts">
  <img src="frontend/public/cards/card_spade_13.png" height="90" alt="King of spades">
  <img src="frontend/public/cards/card_diamond_11.png" height="90" alt="Jack of diamonds">
</p>

Small interface icons come from `lucide-react` and follow the text colour (`currentColor`).

### Reusable components

These components are written by us. They get their content through their props and depend on no page: they can be used anywhere.

#### Layout

| Component | Role |
|---|---|
| `PageLayout` | the structure shared by every page: header, centred content, footer |
| `Header` / `Footer` | the site banners, separated from the content by a worn line |
| `Title` / `Subtitle` | page titles, on the type scale |
| `WornFrame` | the "card" of the site: a double frame in worn lines, each line worn in different places |

![Header](docs/design-system/header.png)

<img src="docs/design-system/worn-frame.png" width="320" alt="WornFrame">

`WornFrame` is used for login, sign-up, every section of the rules, the profile, the join page, the Privacy Policy and the Terms of Service.

Buttons and the separator start from shadcn/ui but are restyled with our tokens and typography; the separator and the `link` button variant use the worn line:

![Buttons and separator](docs/design-system/buttons.png)

#### Cards

| Component | Props | Role |
|---|---|---|
| `TiltCard` | `imagePath`, `label` | a card that tilts towards the pointer and grows on hover (`motion` spring) |
| `CardRule` | `name`, `imagePath`, `children` | a `TiltCard` with its name and explanation |

<img src="docs/design-system/tilt-card.gif" width="450" alt="TiltCard on hover">

![CardRule in a WornFrame](docs/design-system/card-rules.png)

#### Demons and animations

| Component | Props | Role |
|---|---|---|
| `DemonCircle` | `children`, `variant` | a ring of demons turning around (or over) any content |
| `DemonDrawing` | `image` | any demon drawing, inked with the palette |
| `SparkleTrail` | `getSpots` | a trail of sparkles behind what moves (the demons of the ring) |
| `DemonCampfire` | — | the four demons dancing around the fire (menu) |
| `CracklingFire` | — | the animated fire, made entirely in code |
| `AngerMarks` | `isVisible` | small anger marks above a character |

<p>
  <img src="docs/design-system/demon-circle.gif" width="380" alt="DemonCircle">
  <img src="docs/design-system/campfire.gif" width="440" alt="DemonCampfire and CracklingFire">
</p>

#### Game

| Component | Props | Role |
|---|---|---|
| `SeatBadge` | `seat`, `isTaken` | a seat's demon in a shaky circle in the team colour; greyed and dotted when the seat is free |
| `Pawn` | `color`, `position`, `path`, `isSelectable`, `onClick`… | a hand-drawn pawn that walks cell by cell along `path` |
| `TurnBanner` | `isMyTurn`, `mySeat` | "Your turn!" written for a moment across the board |
| `WinScreen` | `winnerSeat`, `winnerName`, `isMe` | the win screen with confetti |
| `PasswordInput` | the props of an `input` | a password field with a show / hide button |

---

## Error handling and logs

The logs of the backend and nginx are centralised in the ELK stack: **Kibana**, index `app-logs-*`. The full guide (levels, fields, filters, tests) is in [`docs/logs-guide.md`](docs/logs-guide.md).

### Path of a log

```
NestJS (nestjs-pino) ──tcp:5000───► Logstash ──► Elasticsearch ──► Kibana
nginx                ──syslog:5140─►
```

Every log is a JSON object. The `service` field (`backend` / `nginx`) is added by Logstash, `context` is the name given to `new Logger('...')`, and `level` is 20 (debug), 30 (info), 40 (warn) or 50 (error).

### Three layers of error handling

| Layer | File | What it catches |
|---|---|---|
| **pino-http** | `config/logger.config.ts` | Every HTTP request: method, URL, status, duration. 5xx → error, 4xx → warn, otherwise info. |
| **`AllExceptionFilter`** | `config/all-exceptions.filter.ts` | Any exception thrown during an HTTP request. `HttpException` (< 500) → warn `request refused`, anything else → error `unhandled error`. It then hands back to Nest, which sends the response to the client. |
| **Manual logs** | `game.gateway.ts`, `friends.gateway.ts`, `game.service.ts` | Everything that is **not** an HTTP request: WebSocket events, bots playing in the background, disconnection timers. |

**The same rule applies everywhere:** an **expected** error (wrong invite code, illegal move, expired JWT) is an `HttpException`, logged as **warn**. An **unexpected** error (JavaScript exception, database down, stuck bot) is a bug, logged as **error**.

### Conventions

- Business errors are thrown with Nest exceptions (`NotFoundException`, `ConflictException`…), never with `new Error`. That is what gives the right HTTP status and the right log level.
- On WebSockets, the error is sent back in the client's ack (`{ error: message }`) **and** logged by `logWsError`.
- A promise started without `await` must have its `.catch(err => this.logger.error(...))`, otherwise its error is lost.
- No `console.log` / `console.error`: they never reach Kibana.
- Never log a password, token or cookie: `redact` already hides them in HTTP requests (`logger.config.ts`).

### Finding an error

```
service : "backend" and level >= 50     # the bugs
context : "GameService" and gameId : 3   # the story of game 3
req.id : 21                              # the lines of one HTTP request
```

---

## Individual contributions

### elaudrez — Tech Lead
- Chose the technical stack and set up the project skeleton.
- Docker Compose, nginx with HTTPS (self-signed certificate), PostgreSQL and the first Prisma schema and migrations.
- Authentication: sign-up, login, JWT and refresh tokens.
- The ELK stack: Elasticsearch, Logstash pipeline, Kibana, log retention.

### nadeluge — Project Manager
- Brought the team together and coordinated the work.
- The rules engine (board, cards, legal moves, the split 7, captures) and the three bot levels.
- The game service and WebSockets: games in memory, broadcast, reconnection and grace delay, bots taking over.
- Profile (avatar upload, password, account deletion), friends and online status, private pages.
- The design system, the illustrations and most pages; Privacy Policy and Terms of Service.
- The error-handling layers and structured logs.

### jazema — Product Owner
- Set the product priorities, drawing on experience from large web projects.
- The game front end: board display and animations, pawns, spawns and homes, turn feedback, card hints.
- In-game chat, game log, turn banner and win screen.
- Bots playing for disconnected players; restructured the front-end folders.

### barmarti — Developer
- Authentication work and error management on the profile and friends routes.
- Tests of the overall architecture and of edge cases.

---

## Challenges and trade-offs

### Challenges and how we solved them

| Challenge | Solution |
|---|---|
| At first it was hard to tell what came from TypeScript, from Prisma and from NestJS. | We learned step by step with the official documentation, used AI to explain concepts, and kept the rules engine in plain TypeScript, with no framework, so it stayed simple. |
| Connecting the front end to the back end: the front end was built first, on fake data. | We used AI to quickly wire the WebSockets in a `ws-test` branch so we could test end to end, then took the time to go back over that code by hand, understand it and clean it before merging. |
| The 7 can be split between several pawns, and the player does not have to use all 7 steps. | A dedicated `split.ts` and partial actions in the engine; the hard bot plans the whole split with a cache. |
| Games were too long to test (4 pawns × 4 players). | A test mode with one pawn per player (`QUICK_GAME=1`). |
| Podman prevented Filebeat from reading the containers' logs. | We dropped Filebeat: the backend sends its logs straight to Logstash over TCP and nginx over syslog, which is simpler and more reliable. |

### Trade-offs

| Choice | What we gain | What we give up |
|---|---|---|
| ELK only, Prometheus + Grafana dropped (too big for the time we had) | One observability stack that we master | No metrics or alerting |
| Running games kept in memory | Simple and fast | A game in progress is lost if the backend restarts |
| Bots replace missing players | You can always play, even alone | — |
| JWT in httpOnly cookies | Tokens out of reach of JavaScript (XSS) | Refresh has to be handled, including at the WebSocket handshake |
| One list of legal moves for validation, bots and front end | Rules written once, no cheating, consistent hints | The engine must stay pure and fast enough to be called often |

---

## Resources

### Documentation
- [Next.js](https://nextjs.org/docs) · [React](https://react.dev) · [Tailwind CSS](https://tailwindcss.com/docs) · [shadcn/ui](https://ui.shadcn.com) · [motion](https://motion.dev)
- [NestJS](https://docs.nestjs.com) (guards, gateways, exception filters) · [socket.io](https://socket.io/docs/v4/)
- [Prisma](https://www.prisma.io/docs) · [PostgreSQL](https://www.postgresql.org/docs/)
- [Elastic Stack](https://www.elastic.co/guide/index.html) · [pino](https://getpino.io) · [nginx](https://nginx.org/en/docs/)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) · [Introduction to JSON Web Tokens](https://jwt.io/introduction)
- The rules of Tock (jeu de Toc), as played in France.

### How AI was used
- **nadeluge** used **Claude Code** and **jazema** used **Windsurf** to understand the technologies (NestJS, Prisma, socket.io, ELK), to write documentation (in particular about WebSockets), to build some front-end components, and to audit the code.
- **elaudrez** and **barmarti** only used AI in a browser chat, to ask questions, with almost no generated code.
- The WebSocket connection between the front end and the back end was first wired with AI help in a test branch, then reviewed, rewritten where needed and understood before being merged.
- **Everything else was done without AI**, including the rules engine, the bots, the architecture and the illustrations.
- Any AI output we kept was reviewed, tested and is understood by the team member who integrated it.

---

## Known limitations

- A game in progress lives in memory: it is lost if the backend restarts.
- The certificate is self-signed, so the browser shows a warning on first visit.
- The interface of the game is partly in French.
