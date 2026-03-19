const STORAGE_KEYS = {
  leaderboard: 'ff-lite-leaderboard',
  playerName: 'ff-lite-player-name',
  playerTint: 'ff-lite-player-tint',
};

const SPRITES = {
  idle: 'assets/goblin/idle.png',
  recharge: 'assets/goblin/charge.png',
  attack: 'assets/goblin/attack.png',
  backfire: 'assets/goblin/backfire.png',
  hit: 'assets/goblin/hit.png',
  victory: 'assets/goblin/victory.png',
  defeat: 'assets/goblin/defeat.png',
};
const HOME_IMAGE = 'assets/goblin/idle_choose.png';
const HOME_ANIMATION = { src: HOME_IMAGE, rows: 4, cols: 4, loop: true, frameDuration: 150 };
const ARENA_BACKGROUND = '/images/match_bg.png'; // Placeholder image path: replace/add the real arena background manually later.
const AUDIO_CONFIG = {
  bgm: {
    src: '/audio/bgm.mp3', // Placeholder audio path: replace/add the real looping BGM manually later.
    volume: 0.32,
  },
  sfx: {
    attack: { src: '/audio/attack.mp3', volume: 0.8 }, // Placeholder audio path: replace/add the real SFX manually later.
    recharge: { src: '/audio/recharge.mp3', volume: 0.7 },
    backfire: { src: '/audio/backfire.mp3', volume: 0.78 },
    hit: { src: '/audio/hit.mp3', volume: 0.72 },
    victory: { src: '/audio/victory.mp3', volume: 0.82 },
    defeat: { src: '/audio/defeat.mp3', volume: 0.72 },
    matchStart: { src: '/audio/match_start.mp3', volume: 0.65 },
    matchEnd: { src: '/audio/match_end.mp3', volume: 0.65 },
  },
};
const ANIMATION_CONFIG = {
  idle: { loop: true, frameDuration: 180 },
  recharge: { loop: false, frameDuration: 90 },
  attack: { loop: false, frameDuration: 80 },
  backfire: { loop: false, frameDuration: 100 },
  hit: { loop: false, frameDuration: 80 },
  victory: { loop: true, frameDuration: 120 },
  defeat: { loop: false, frameDuration: 120, freezeLastFrame: true },
};
const NAME_PREFIXES = ['Stink', 'Bog', 'Snort', 'Muck', 'Grim', 'Snot', 'Burp', 'Fizzle', 'Crust', 'Toad'];
const NAME_SUFFIXES = ['nibbler', 'belch', 'toes', 'whiff', 'sniffer', 'rump', 'fizzle', 'gob', 'blast', 'morsel'];
const TINTS = ['#22c55e', '#84cc16', '#f59e0b', '#38bdf8', '#f472b6', '#a78bfa', '#fb7185'];
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('ff-lite-match') : null;

const state = {
  screen: 'home',
  me: loadLocalPlayer(),
  pendingMatch: null,
  match: null,
  logs: [],
  leaderboard: loadLeaderboard(),
  previewAnimators: [],
};

class BackgroundMusicManager {
  constructor(config) {
    this.config = config;
    this.audio = null;
    this.started = false;
    this.failed = false;
    this.boundStart = this.start.bind(this);
    this.isArmed = false;
  }
  ensureAudio() {
    if (this.audio || this.failed) return this.audio;
    try {
      const audio = new Audio(this.config.src);
      audio.loop = true;
      audio.preload = 'none';
      audio.volume = this.config.volume;
      audio.addEventListener('error', () => {
        this.failed = true;
        this.audio = null;
      });
      this.audio = audio;
    } catch {
      this.failed = true;
    }
    return this.audio;
  }
  armAutoStart() {
    if (this.isArmed || this.started || this.failed) return;
    this.isArmed = true;
    const options = { passive: true };
    window.addEventListener('pointerdown', this.boundStart, options);
    window.addEventListener('touchstart', this.boundStart, options);
    window.addEventListener('keydown', this.boundStart);
  }
  disarmAutoStart() {
    if (!this.isArmed) return;
    this.isArmed = false;
    window.removeEventListener('pointerdown', this.boundStart);
    window.removeEventListener('touchstart', this.boundStart);
    window.removeEventListener('keydown', this.boundStart);
  }
  async start() {
    if (this.started || this.failed) return;
    const audio = this.ensureAudio();
    if (!audio) return;
    try {
      audio.volume = this.config.volume;
      await audio.play();
      this.started = true;
      this.disarmAutoStart();
    } catch {
      // Browser autoplay or missing-file issue: keep the game running silently.
    }
  }
  sync() {
    if (this.failed) return;
    const audio = this.ensureAudio();
    if (!this.started) {
      this.armAutoStart();
    }
    if (!audio || !this.started) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    }
  }
}

class SoundEffectsManager {
  constructor(config) {
    this.config = config;
    this.cache = new Map();
    this.cooldowns = new Map();
    this.minInterval = 120;
  }
  getAudio(name) {
    if (this.cache.has(name)) return this.cache.get(name);
    const entry = this.config[name];
    if (!entry) return null;
    try {
      const audio = new Audio(entry.src);
      audio.preload = 'none';
      audio.volume = entry.volume;
      audio.addEventListener('error', () => {
        this.cache.set(name, null);
      }, { once: true });
      this.cache.set(name, audio);
      return audio;
    } catch {
      this.cache.set(name, null);
      return null;
    }
  }
  play(name) {
    const audio = this.getAudio(name);
    if (!audio) return;
    const now = performance.now();
    const last = this.cooldowns.get(name) || 0;
    if (now - last < this.minInterval) return;
    this.cooldowns.set(name, now);
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = this.config[name].volume;
      audio.play().catch(() => {});
    } catch {
      // Missing file or browser restriction: fail silently.
    }
  }
}

const bgmManager = new BackgroundMusicManager(AUDIO_CONFIG.bgm);
const sfxManager = new SoundEffectsManager(AUDIO_CONFIG.sfx);

function hashString(input) {
  let hash = 2166136261;
  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function pickDeterministic(list, seed) {
  return list[hashString(seed) % list.length];
}
function generateFunnyName(seed = crypto.randomUUID()) {
  const prefix = pickDeterministic(NAME_PREFIXES, `${seed}:p`);
  const suffix = pickDeterministic(NAME_SUFFIXES, `${seed}:s`);
  return `${prefix}${suffix}`;
}
function generateTint(seed = crypto.randomUUID()) {
  return pickDeterministic(TINTS, `${seed}:t`);
}
function loadLocalPlayer() {
  const name = localStorage.getItem(STORAGE_KEYS.playerName) || generateFunnyName();
  const tint = localStorage.getItem(STORAGE_KEYS.playerTint) || generateTint(name);
  localStorage.setItem(STORAGE_KEYS.playerName, name);
  localStorage.setItem(STORAGE_KEYS.playerTint, tint);
  return { id: crypto.randomUUID(), name, tint };
}
function loadLeaderboard() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.leaderboard) || '[]'); }
  catch { return []; }
}
function saveLeaderboard() {
  localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(state.leaderboard));
}
function upsertRecord(name, resultKey) {
  const existing = state.leaderboard.find((row) => row.name === name);
  const row = existing || { name, wins: 0, losses: 0, draws: 0 };
  row[resultKey] += 1;
  if (!existing) state.leaderboard.push(row);
}
function sortLeaderboard() {
  state.leaderboard.sort((a, b) => b.wins - a.wins || a.losses - b.losses || b.draws - a.draws || a.name.localeCompare(b.name));
}

class SpriteSheetAnimator {
  constructor(host, opts = {}) {
    this.host = host;
    this.canvas = host.querySelector('.sprite-canvas');
    this.fallback = host.querySelector('.sprite-fallback');
    this.rows = opts.rows || 4;
    this.cols = opts.cols || 4;
    this.current = null;
    this.frame = 0;
    this.timer = null;
    this.ended = null;
    this.image = null;
    this.imageCache = new Map();
    this.tint = opts.tint || '#22c55e';
    this.flip = opts.flip ?? 1;
    this.frameWidth = 0;
    this.frameHeight = 0;
    this.ctx = this.canvas?.getContext('2d', { willReadFrequently: true });
    this.sourceBuffer = document.createElement('canvas');
    this.sourceBufferCtx = this.sourceBuffer.getContext('2d', { willReadFrequently: true });
    this.tintBuffer = document.createElement('canvas');
    this.tintBufferCtx = this.tintBuffer.getContext('2d', { willReadFrequently: true });
    this.setTint(this.tint);
    this.setFlip(this.flip);
  }
  setTint(tint) {
    this.tint = tint;
    if (this.current && this.image) this.drawFrame();
  }
  setFlip(flip) {
    this.flip = flip;
    this.host.style.setProperty('--flip', String(flip));
    if (this.current && this.image) this.drawFrame();
  }
  play(stateName, onEnd) {
    return this.playSheet({
      stateName,
      src: SPRITES[stateName],
      rows: this.rows,
      cols: this.cols,
      ...ANIMATION_CONFIG[stateName],
    }, onEnd);
  }
  playSheet(sheet, onEnd) {
    this.current = {
      stateName: sheet.stateName || 'custom',
      src: sheet.src,
      config: {
        loop: Boolean(sheet.loop),
        frameDuration: sheet.frameDuration || ANIMATION_CONFIG.idle.frameDuration,
        freezeLastFrame: Boolean(sheet.freezeLastFrame),
      },
    };
    this.rows = sheet.rows || 4;
    this.cols = sheet.cols || 4;
    this.frame = 0;
    this.ended = onEnd || null;
    clearTimeout(this.timer);
    this.host.dataset.state = this.current.stateName;
    this.preloadAndStart();
  }
  preloadAndStart() {
    const cached = this.imageCache.get(this.current.src);
    if (cached?.complete) {
      this.handleImageLoad(cached);
      return;
    }
    const img = cached || new Image();
    img.onload = () => this.handleImageLoad(img);
    img.onerror = () => {
      this.imageCache.delete(this.current.src);
      this.image = null;
      if (this.canvas) this.canvas.hidden = true;
      this.fallback.hidden = false;
      this.fallback.textContent = `Missing sprite sheet:\n${this.current.src}`;
      if (!this.current.config.loop && this.ended) this.ended();
    };
    this.imageCache.set(this.current.src, img);
    if (!img.src) img.src = this.current.src;
  }
  handleImageLoad(img) {
    this.image = img;
    this.frameWidth = Math.max(1, Math.floor(img.naturalWidth / this.cols));
    this.frameHeight = Math.max(1, Math.floor(img.naturalHeight / this.rows));
    this.resizeCanvases();
    this.fallback.hidden = true;
    if (this.canvas) this.canvas.hidden = false;
    this.drawFrame();
    this.tick();
  }
  resizeCanvases() {
    for (const canvas of [this.canvas, this.sourceBuffer, this.tintBuffer]) {
      if (!canvas) continue;
      canvas.width = this.frameWidth;
      canvas.height = this.frameHeight;
    }
  }
  drawFrame() {
    if (!this.ctx || !this.sourceBufferCtx || !this.tintBufferCtx || !this.image) return;
    const col = this.frame % this.cols;
    const row = Math.floor(this.frame / this.cols);
    const sx = col * this.frameWidth;
    const sy = row * this.frameHeight;

    this.sourceBufferCtx.clearRect(0, 0, this.frameWidth, this.frameHeight);
    this.sourceBufferCtx.drawImage(this.image, sx, sy, this.frameWidth, this.frameHeight, 0, 0, this.frameWidth, this.frameHeight);

    const frame = this.sourceBufferCtx.getImageData(0, 0, this.frameWidth, this.frameHeight);
    const { data } = frame;
    const tint = hexToRgb(this.tint);

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) continue;
      data[i] = Math.round((data[i] * 0.55) + (tint.r * 0.45));
      data[i + 1] = Math.round((data[i + 1] * 0.55) + (tint.g * 0.45));
      data[i + 2] = Math.round((data[i + 2] * 0.55) + (tint.b * 0.45));
    }

    this.tintBufferCtx.clearRect(0, 0, this.frameWidth, this.frameHeight);
    this.tintBufferCtx.putImageData(frame, 0, 0);

    this.ctx.clearRect(0, 0, this.frameWidth, this.frameHeight);
    this.ctx.save();
    if (this.flip === -1) {
      this.ctx.translate(this.frameWidth, 0);
      this.ctx.scale(-1, 1);
    }
    this.ctx.drawImage(this.tintBuffer, 0, 0);
    this.ctx.restore();
  }
  tick() {
    const { config } = this.current;
    this.timer = setTimeout(() => {
      const next = this.frame + 1;
      if (next >= this.rows * this.cols) {
        if (config.loop) {
          this.frame = 0;
          this.drawFrame();
          this.tick();
          return;
        }
        this.frame = config.freezeLastFrame ? this.rows * this.cols - 1 : 0;
        this.drawFrame();
        if (this.ended) this.ended();
        return;
      }
      this.frame = next;
      this.drawFrame();
      this.tick();
    }, config.frameDuration);
  }
  stop() { clearTimeout(this.timer); }
}

function hexToRgb(hex) {
  const normalized = (hex || '').replace('#', '').trim();
  const full = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized.padEnd(6, '0').slice(0, 6);
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return { r: 34, g: 197, b: 94 };
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function makeMatchPayload(playerA = state.me) {
  const matchId = `match-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const hostSeed = `${matchId}:A:${playerA.name}`;
  return {
    id: matchId,
    createdAt: Date.now(),
    playerA: { id: playerA.id, name: playerA.name, tint: playerA.tint, seed: hostSeed },
  };
}
function getJoinLink(payload) {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  return `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(encoded)}`;
}
function parseJoinPayload() {
  const params = new URLSearchParams(window.location.search);
  const join = params.get('join');
  if (!join) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(join))));
  } catch {
    return null;
  }
}
function resetToHome() {
  window.history.replaceState({}, '', window.location.pathname);
  state.pendingMatch = null;
  state.match = null;
  state.logs = [];
  state.screen = 'home';
  bgmManager.sync();
  render();
}
function startCreateFlow() {
  const payload = makeMatchPayload();
  state.pendingMatch = { payload, link: getJoinLink(payload), opponentJoined: false };
  state.screen = 'create';
  bgmManager.sync();
  render();
}
function startJoinedFlow(payload) {
  const playerBSeed = `${payload.id}:B:${state.me.name}`;
  state.pendingMatch = {
    payload: {
      ...payload,
      playerB: { id: state.me.id, name: state.me.name, tint: state.me.tint, seed: playerBSeed },
    },
    link: getJoinLink(payload),
    opponentJoined: true,
  };
  state.screen = 'join';
  bgmManager.sync();
  render();
  channel?.postMessage({ type: 'joined', matchId: payload.id, playerB: state.pendingMatch.payload.playerB });
  queueMatchStart(state.pendingMatch.payload);
}
function queueMatchStart(payload) {
  if (state.match || state.screen === 'match' || state.screen === 'postmatch') return;
  window.setTimeout(() => {
    if (state.match || state.screen === 'match' || state.screen === 'postmatch') return;
    state.screen = 'match';
    state.match = createResolvedMatch(payload);
    state.logs = ['I goblini si annusano con sospetto...'];
    render();
    runMatchSequence();
  }, 900);
}
function createResolvedMatch(payload) {
  const playerA = payload.playerA;
  const playerB = payload.playerB || {
    id: 'auto-b', name: generateFunnyName(`${payload.id}:fallback`), tint: generateTint(`${payload.id}:fallback`), seed: `${payload.id}:fallback`,
  };
  return {
    id: payload.id,
    fighters: [
      { slot: 'A', side: 'left', ...playerA, hp: 100, state: 'idle' },
      { slot: 'B', side: 'right', ...playerB, hp: 100, state: 'idle' },
    ],
    turn: 0,
    finished: false,
    winner: null,
  };
}
function updateMatchUI() {
  if (!(state.screen === 'match' || state.screen === 'postmatch') || !state.match) return;
  state.match.fighters.forEach((fighter, index) => {
    const fill = document.querySelector(`[data-hp="${index}"]`);
    const label = document.querySelector(`[data-hp-label="${index}"]`);
    if (fill) fill.style.setProperty('--hp', `${fighter.hp}%`);
    if (label) label.textContent = `HP ${fighter.hp} · ${fighter.slot === 'A' ? 'Player A' : 'Player B'}`;
  });
  const logPanel = document.getElementById('log-lines');
  if (logPanel) logPanel.innerHTML = state.logs.map((line) => `<p class="log-line">${line}</p>`).join('');
}
function logLine(text) {
  state.logs = [text, ...state.logs].slice(0, 5);
  updateMatchUI();
}
function computeAction(attacker, defender, turn) {
  const seed = hashString(`${state.match.id}:${attacker.slot}:${turn}`);
  const roll = seed % 100;
  const intensity = 10 + turn * 2.75;
  if (roll < 18) {
    const selfDamage = Math.round(intensity * 0.75);
    return { type: 'backfire', amount: selfDamage, text: `${attacker.name} si autosabota con una scoreggia boomerang da ${selfDamage}!` };
  }
  const damage = Math.round(intensity + (roll % 8));
  return { type: 'attack', amount: damage, text: `${attacker.name} colpisce ${defender.name} per ${damage} danni aromatici!` };
}
function updateLeaderboardForResult(winner, loser, draw = false) {
  if (draw) {
    upsertRecord(state.match.fighters[0].name, 'draws');
    upsertRecord(state.match.fighters[1].name, 'draws');
  } else {
    upsertRecord(winner.name, 'wins');
    upsertRecord(loser.name, 'losses');
  }
  sortLeaderboard();
  saveLeaderboard();
}
async function playState(index, stateName, soundName = stateName) {
  const animator = state.match.animators[index];
  return new Promise((resolve) => {
    sfxManager.play(soundName);
    animator.play(stateName, resolve);
    if (ANIMATION_CONFIG[stateName].loop) {
      window.setTimeout(resolve, 600);
    }
  });
}
async function runMatchSequence() {
  const [a, b] = state.match.fighters;
  bgmManager.sync();
  sfxManager.play('matchStart');
  for (const animator of state.match.animators) animator.play('idle');
  while (!state.match.finished) {
    state.match.turn += 1;
    const attackerIndex = state.match.turn % 2 === 1 ? 0 : 1;
    const defenderIndex = attackerIndex === 0 ? 1 : 0;
    const attacker = state.match.fighters[attackerIndex];
    const defender = state.match.fighters[defenderIndex];
    const action = computeAction(attacker, defender, state.match.turn);
    await playState(attackerIndex, 'recharge');
    if (action.type === 'backfire') {
      await playState(attackerIndex, 'backfire');
      attacker.hp = Math.max(0, attacker.hp - action.amount);
      updateMatchUI();
      logLine(action.text);
      await playState(attackerIndex, attacker.hp <= 0 ? 'defeat' : 'hit', attacker.hp <= 0 ? 'defeat' : 'hit');
    } else {
      await playState(attackerIndex, 'attack');
      defender.hp = Math.max(0, defender.hp - action.amount);
      updateMatchUI();
      logLine(action.text);
      await playState(defenderIndex, defender.hp <= 0 ? 'defeat' : 'hit', defender.hp <= 0 ? 'defeat' : 'hit');
    }
    updateMatchUI();
    if (a.hp <= 0 || b.hp <= 0 || state.match.turn >= 12) {
      finishMatch();
      return;
    }
    state.match.animators[0].play('idle');
    state.match.animators[1].play('idle');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
function finishMatch() {
  const [a, b] = state.match.fighters;
  state.match.finished = true;
  sfxManager.play('matchEnd');
  if (a.hp === b.hp) {
    state.match.winner = null;
    updateLeaderboardForResult(null, null, true);
    state.match.animators[0].play('idle');
    state.match.animators[1].play('idle');
    logLine('Pareggio tossico: nessuno crolla davvero.');
  } else {
    const winner = a.hp > b.hp ? a : b;
    const loser = winner === a ? b : a;
    state.match.winner = winner;
    state.match.animators[winner === a ? 0 : 1].play('victory');
    state.match.animators[winner === a ? 1 : 0].play('defeat');
    sfxManager.play('victory');
    sfxManager.play('defeat');
    updateLeaderboardForResult(winner, loser, false);
    logLine(`${winner.name} trionfa nella nebbia verdognola.`);
  }
  state.screen = 'postmatch';
  render();
}

function renderAnimatedPreview(tint, label = '') {
  return `
    <div class="goblin-frame sprite-render sprite-render-home" data-home-animator="${label}" data-tint="${tint}">
      <canvas class="sprite-canvas" aria-hidden="true"></canvas>
      <div class="sprite-fallback" hidden></div>
    </div>`;
}

function renderHome() {
  return `
    <section class="panel hero">
      <div class="hero-copy">
        <span class="badge">Goblin only · Lite mode</span>
        <h1>Fart & Furious Lite</h1>
        <p class="muted">Un solo goblin. Zero schermate inutili. Match automatici, rapidi e puzzolenti.</p>
        <div class="card-grid">
          <div class="info-card"><strong>Creatura</strong><br/>Goblin</div>
          <div class="info-card"><strong>Flow</strong><br/>Home → Crea match → Join → Auto battle</div>
          <div class="info-card"><strong>Match target</strong><br/>Ritmo crescente sotto ~60 secondi</div>
        </div>
      </div>
      <div class="goblin-preview">
        ${renderAnimatedPreview(state.me.tint, 'home')}
        <div class="nameplate">${state.me.name}</div>
        <div class="subtext">Tinta casuale fissata per questa sessione: <span style="color:${state.me.tint}">${state.me.tint}</span></div>
      </div>
    </section>`;
}
function renderCreate() {
  return `
    <section class="panel">
      <h1 class="screen-title">Crea match</h1>
      <p class="muted">Copia e invia questo link all’avversario. Quando apre il link, il match parte automaticamente dal suo lato.</p>
      <div class="link-box">
        <code>${state.pendingMatch.link}</code>
        <button id="copy-link">Copia link</button>
      </div>
      <p class="muted">Se l’avversario apre il link nello stesso browser/dispositivo, questa schermata rileva la join e avvia il match anche qui.</p>
      <div class="goblin-preview" style="margin-top:18px;">
        ${renderAnimatedPreview(state.me.tint, 'create')}
        <div class="nameplate">${state.pendingMatch.payload.playerA.name}</div>
      </div>
    </section>`;
}
function renderJoin() {
  const playerB = state.pendingMatch.payload.playerB;
  return `
    <section class="panel hero">
      <div>
        <h1 class="screen-title">Avversario trovato</h1>
        <p class="muted">Sei il player B. I goblin stanno entrando nell’arena…</p>
        <div class="info-card">
          <strong>Host</strong><br/>${state.pendingMatch.payload.playerA.name}<br/><span style="color:${state.pendingMatch.payload.playerA.tint}">${state.pendingMatch.payload.playerA.tint}</span>
        </div>
      </div>
      <div class="goblin-preview">
        ${renderAnimatedPreview(playerB.tint, 'join')}
        <div class="nameplate">${playerB.name}</div>
        <div class="subtext">Preparati: il match parte da solo fra un attimo.</div>
      </div>
    </section>`;
}
function renderMatchOrPost() {
  const isPost = state.screen === 'postmatch';
  const result = state.match.winner
    ? `${state.match.winner.name} wins!`
    : 'Draw!';
  return `
    <section class="panel match-layout">
      <div class="match-head">
        <div class="match-meta">
          <h1 class="screen-title">${isPost ? 'Risultato match' : 'Match automatico'}</h1>
          <p class="muted">Turno ${state.match.turn}. La potenza aumenta ogni round, quindi il caos non dura troppo.</p>
        </div>
        ${isPost ? `<div class="result-banner"><strong>${result}</strong>${state.match.winner ? 'Il perdente resta nella posa di sconfitta finale.' : 'Entrambi sopravvivono al fetore conclusivo.'}</div>` : ''}
      </div>
      <div class="arena-shell">
        <section class="arena" style="--arena-image:url('${ARENA_BACKGROUND}')">
          <div class="arena-floor" aria-hidden="true"></div>
          ${state.match.fighters.map((fighter, index) => `
            <article class="fighter fighter-${fighter.side}">
              <div class="fighter-header ${fighter.side === 'left' ? 'align-left' : 'align-right'}">
                <div class="nameplate">${fighter.name}</div>
                <div class="subtext" data-hp-label="${index}">HP ${fighter.hp} · ${fighter.slot === 'A' ? 'Player A' : 'Player B'}</div>
              </div>
              <div class="fighter-slot">
                <div class="fighter-transform-positioner">
                  <div class="sprite-render" data-animator="${index}">
                    <canvas class="sprite-canvas" aria-hidden="true"></canvas>
                    <div class="sprite-fallback" hidden></div>
                  </div>
                  <div class="sprite-effects" aria-hidden="true"></div>
                </div>
              </div>
              <div class="health-bar"><div class="health-fill" data-hp="${index}" style="--hp:${fighter.hp}%"></div></div>
            </article>`).join('')}
        </section>
      </div>
      <div class="battle-log-wrap">
        <div class="log-panel">
          <p class="log-heading">Battle log</p>
          <div id="log-lines">
            ${state.logs.map((line) => `<p class="log-line">${line}</p>`).join('')}
          </div>
        </div>
        ${isPost ? `<div class="footer-actions"><button id="post-home">Home</button><button class="secondary" id="post-leaderboard">Leaderboard</button></div>` : ''}
      </div>
    </section>`;
}
function renderLeaderboard() {
  return `
    <section class="panel leaderboard-layout">
      <div>
        <h1 class="screen-title">Leaderboard</h1>
        <p class="muted">Statistiche Lite locali salvate nel browser corrente.</p>
      </div>
      <table class="table">
        <thead><tr><th>Player</th><th>Wins</th><th>Losses</th><th>Draws</th></tr></thead>
        <tbody>
          ${state.leaderboard.length ? state.leaderboard.map((row) => `<tr><td>${row.name}</td><td>${row.wins}</td><td>${row.losses}</td><td>${row.draws}</td></tr>`).join('') : '<tr><td colspan="4">Nessun risultato ancora.</td></tr>'}
        </tbody>
      </table>
    </section>`;
}
function render() {
  state.previewAnimators.forEach((animator) => animator.stop());
  state.previewAnimators = [];
  const app = document.getElementById('app');
  app.innerHTML = `
    <main class="app-shell">
      <nav class="topbar">
        <button id="nav-home">Home</button>
        <button class="secondary" id="nav-create">Crea match</button>
        <button class="ghost" id="nav-leaderboard">Leaderboard</button>
      </nav>
      ${state.screen === 'home' ? renderHome() : ''}
      ${state.screen === 'create' ? renderCreate() : ''}
      ${state.screen === 'join' ? renderJoin() : ''}
      ${state.screen === 'match' || state.screen === 'postmatch' ? renderMatchOrPost() : ''}
      ${state.screen === 'leaderboard' ? renderLeaderboard() : ''}
    </main>`;

  document.getElementById('nav-home')?.addEventListener('click', resetToHome);
  document.getElementById('nav-create')?.addEventListener('click', startCreateFlow);
  document.getElementById('nav-leaderboard')?.addEventListener('click', () => { state.screen = 'leaderboard'; bgmManager.sync(); render(); });
  document.getElementById('copy-link')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(state.pendingMatch.link);
      logLine('Link copiato negli appunti.');
    } catch {
      logLine('Copia manuale necessaria: il browser non permette gli appunti.');
    }
  });
  document.getElementById('post-home')?.addEventListener('click', resetToHome);
  document.getElementById('post-leaderboard')?.addEventListener('click', () => { state.screen = 'leaderboard'; bgmManager.sync(); render(); });

  document.querySelectorAll('[data-home-animator]').forEach((node) => {
    const animator = new SpriteSheetAnimator(node, { tint: node.dataset.tint || state.me.tint });
    state.previewAnimators.push(animator);
    animator.playSheet(HOME_ANIMATION);
  });

  if (state.screen === 'match' || state.screen === 'postmatch') {
    const nodes = [...document.querySelectorAll('[data-animator]')];
    const previous = state.match.animators || [];
    previous.forEach((animator) => animator.stop());
    state.match.animators = nodes.map((node, index) => new SpriteSheetAnimator(node, {
      tint: state.match.fighters[index].tint,
      flip: state.match.fighters[index].side === 'left' ? -1 : 1,
    }));
    if (state.screen === 'postmatch') {
      if (state.match.winner) {
        const winnerIndex = state.match.fighters.findIndex((f) => f.name === state.match.winner.name);
        state.match.animators[winnerIndex].play('victory');
        state.match.animators[winnerIndex === 0 ? 1 : 0].play('defeat');
      } else {
        state.match.animators.forEach((animator) => animator.play('idle'));
      }
    }
  }
}

channel?.addEventListener('message', (event) => {
  if (event.data?.type === 'joined' && state.pendingMatch?.payload.id === event.data.matchId && state.screen === 'create') {
    state.pendingMatch.opponentJoined = true;
    queueMatchStart({
      ...state.pendingMatch.payload,
      playerB: event.data.playerB || { id: 'broadcast-b', name: generateFunnyName(`${event.data.matchId}:broadcast`), tint: generateTint(`${event.data.matchId}:broadcast`), seed: `${event.data.matchId}:broadcast` },
    });
  }
});

bgmManager.ensureAudio();
bgmManager.armAutoStart();

const joinPayload = parseJoinPayload();
if (joinPayload) {
  startJoinedFlow(joinPayload);
} else {
  render();
}
