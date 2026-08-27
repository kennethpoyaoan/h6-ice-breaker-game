create extension if not exists pgcrypto;

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  host_name text not null check (char_length(host_name) between 2 and 24),
  host_token_hash text not null,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 24),
  token_hash text not null,
  score integer not null default 0,
  joined_at timestamptz not null default now()
);

create unique index players_room_nickname_unique
  on public.players (room_id, lower(nickname));
create index players_room_joined_idx on public.players (room_id, joined_at);
create index rooms_created_at_idx on public.rooms (created_at);

alter table public.rooms enable row level security;
alter table public.players enable row level security;

-- No browser database policies are intentional. All durable reads and writes go
-- through authenticated Next.js Route Handlers using the server-only secret key.
-- Realtime Broadcast is used only as a refresh signal; it contains no game data.
