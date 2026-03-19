# FF_Lite

Minimal static browser version of **Fart & Furious Lite**.

## Run locally

Because this is a plain static app, you can run it with any simple file server.

Examples:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open <http://localhost:8000>.

## Shared matchmaking backend setup

Lite matchmaking now uses a **Supabase table as the shared source of truth** for:

- match creation
- invite-link join
- waiting → active transition
- final shared match result snapshot

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
```

### 2. Add runtime config

The repo now includes a placeholder `ff.config.js`. Edit it directly with your project values:
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
- `assets/goblin/idle.png`
- `assets/goblin/charge.png`
- `assets/goblin/attack.png`
- `assets/goblin/backfire.png`
- `assets/goblin/hit.png`
- `assets/goblin/victory.png`
- `assets/goblin/defeat.png`

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
