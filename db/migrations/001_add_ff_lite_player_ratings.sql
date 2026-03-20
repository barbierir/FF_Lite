create table if not exists public.ff_lite_player_ratings (
  player_id text primary key,
  display_name text not null,
  rating integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  matches_played integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.ff_lite_player_ratings enable row level security;

create policy "lite player ratings are readable"
  on public.ff_lite_player_ratings
  for select
  using (true);

create policy "lite player ratings are insertable"
  on public.ff_lite_player_ratings
  for insert
  with check (true);

create policy "lite player ratings are updatable"
  on public.ff_lite_player_ratings
  for update
  using (true)
  with check (true);
