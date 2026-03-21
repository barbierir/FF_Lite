# FF_Lite

Minimal static browser version of **Fart & Furious Lite**.

## Run locally

Because this is a plain static app, you can run it with any simple file server. The canonical
local boot path is the root `index.html`, which loads `ff.config.js` and then the module
bootstrap in `app.js`.

Examples:

```bash
npm start
# or
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Shared matchmaking backend setup

Lite matchmaking now uses a **Supabase table as the shared source of truth** for:

- match creation
- invite-link join
- waiting → active transition
- final shared match result snapshot
- daily leaderboard stats keyed by UTC calendar day
- persistent global Elo-style player ratings

### 1. Create the table in Supabase

Run this SQL in the Supabase SQL editor:

```sql
create table if not exists public.ff_lite_matches (
  id text primary key,
  status text not null check (status in ('waiting', 'active', 'finished')),
  created_at timestamptz not null default timezone('utc', now()),
  player_a jsonb not null,
  player_b jsonb,
  shared_state jsonb not null default '{}'::jsonb
);

alter table public.ff_lite_matches enable row level security;

create policy "lite matches are readable"
  on public.ff_lite_matches
  for select
  using (true);

create policy "lite matches are insertable"
  on public.ff_lite_matches
  for insert
  with check (true);

create policy "lite matches are updatable"
  on public.ff_lite_matches
  for update
  using (true)
  with check (true);

create table if not exists public.ff_lite_daily_stats (
  day_bucket date not null,
  player_id text not null,
  display_name text not null,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  matches_played integer not null default 0,
  primary key (day_bucket, player_id)
);

alter table public.ff_lite_daily_stats enable row level security;

create policy "lite daily stats are readable"
  on public.ff_lite_daily_stats
  for select
  using (true);

create policy "lite daily stats are insertable"
  on public.ff_lite_daily_stats
  for insert
  with check (true);

create policy "lite daily stats are updatable"
  on public.ff_lite_daily_stats
  for update
  using (true)
  with check (true);


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
```

### 2. Add runtime config

Copy `ff.config.example.js` to `ff.config.js` and fill in your project values:

```bash
cp ff.config.example.js ff.config.js
```

Then edit `ff.config.js`:

```js
window.FF_LITE_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

### 3. Serve the static app

Run a static server and open the app from two different browsers/devices.

## What changed

The old local-only match coordination used browser storage and same-device messaging. That worked only when both players shared the same browser environment.

The Lite flow now stores match state in Supabase and polls the shared record while Player A waits on the invite screen. When Player B joins through the invite link, the shared record flips to `active` and both devices enter the same automatic battle flow.

## Placeholder assets to provide

Populate these files with the real Goblin art if they are not already present:

- `assets/goblin/idle_choose.png`
- `assets/goblin/idle1.png`, `idle2.png`, `idle3.png`, `idle4.png`
- `assets/goblin/charge1.png`, `charge2.png`, `charge3.png`, `charge4.png`
- `assets/goblin/attack1.png`, `attack2.png`, `attack3.png`, `attack4.png`
- `assets/goblin/backfire1.png`, `backfire2.png`, `backfire3.png`, `backfire4.png`
- `assets/goblin/hit1.png`, `hit2.png`, `hit3.png`, `hit4.png`
- `assets/goblin/victory1.png`, `victory2.png`
- `assets/goblin/defeat1.png`, `defeat2.png`

All battle animation sheets are expected to be **4x4 sprite sheets**.

## Placeholder audio and arena assets to provide

These placeholder files are now supported and can be added manually later. If any are missing, the game will keep running with silent/fallback behavior:

- `/audio/bgm.mp3`
- `/audio/attack.mp3`
- `/audio/recharge.mp3`
- `/audio/backfire.mp3`
- `/audio/hit.mp3`
- `/audio/victory.mp3`
- `/audio/defeat.mp3`
- `/audio/match_start.mp3` *(optional)*
- `/audio/match_end.mp3` *(optional)*
- `/images/match_bg.png`
