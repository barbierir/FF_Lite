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
