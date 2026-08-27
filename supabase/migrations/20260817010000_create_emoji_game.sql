create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_number integer not null check (round_number between 1 and 5),
  prompt text not null,
  answer text not null,
  accepted_answers text[] not null default '{}',
  status text not null default 'briefing' check (status in ('briefing', 'answering', 'reveal')),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique (room_id, round_number)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  answer text not null check (char_length(answer) between 1 and 80),
  is_correct boolean not null default false,
  points integer not null default 0,
  submitted_at timestamptz not null default now(),
  unique (round_id, player_id)
);

create index rounds_room_created_idx on public.rounds (room_id, created_at desc);
create index submissions_round_idx on public.submissions (round_id);

alter table public.rounds enable row level security;
alter table public.submissions enable row level security;
