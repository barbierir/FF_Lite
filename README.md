# FF_Lite

Minimal static browser version of **Fart & Furious Lite**.

## Run locally

Because this is a plain static app, you can run it with the included Node server. The server
boots `/` from `public/index.html`, serves the repo-root static assets (`app.js`, `styles.css`,
`assets/`, `audio/`, `images/`), and falls back to the homepage for SPA routes.

Examples:

```bash
npm start
# or
npm run serve
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

### 1. Create the tables and RPC in Supabase

Run the baseline schema plus the Phase 3 integrity migration in the Supabase SQL editor. The client now treats the database RPC as the **single authoritative match-result application path** for daily leaderboard stats and persistent ratings.

```bash
# Run these checked-in SQL files in the Supabase SQL editor, in order.
cat db/migrations/001_add_ff_lite_player_ratings.sql
cat db/migrations/002_phase3_atomic_match_result.sql
```

The Phase 3 migration adds:

- `ff_lite_applied_match_results` for idempotent bookkeeping keyed by `match_id`
- indexes/constraints/defaults for leaderboard and rating rows
- the `apply_match_result(...)` RPC, which atomically updates daily stats and both rating rows in one transaction
- RLS tightening so leaderboard tables stay publicly readable but should no longer accept raw anonymous inserts/updates


### Authoritative result flow

`apply_match_result(...)` now owns all critical progression writes:

- verifies the `match_id` has not already been processed
- inserts a bookkeeping row into `ff_lite_applied_match_results`
- atomically upserts both players into `ff_lite_daily_stats`
- locks both rating rows, computes Elo from current ratings, and updates both players together
- returns `already_processed = true` for safe retries / duplicate client calls

The client still determines the battle outcome and persists the shared match snapshot, but it **no longer reads current leaderboard/rating rows to merge increments locally**.

### Security note

For this prototype, public reads stay open for leaderboard rendering, while direct public insert/update access to `ff_lite_daily_stats` and `ff_lite_player_ratings` should be removed in favor of the RPC above. That shrinks the anonymous write surface without forcing a full auth redesign yet.

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
