const STORAGE_KEYS = {
  playerProfile: 'ff-lite-player-profile',
  audioPreferences: 'ff-lite-audio-preferences',
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
const SHARED_BACKEND_CONFIG = window.FF_LITE_CONFIG || {};
const POLL_INTERVAL_MS = 2000;
const LEADERBOARD_DAY_TIMEZONE = 'UTC';
const PALETTE_VARIANTS = [
  { hue: 0, sat: 1, bright: 1 },
  { hue: 20, sat: 1.1, bright: 1 },
  { hue: -20, sat: 1.05, bright: 0.95 },
  { hue: 45, sat: 1.15, bright: 1.05 },
  { hue: -45, sat: 1.1, bright: 0.9 },
  { hue: 90, sat: 1.2, bright: 1 },
];

const ACTION_DURATION_MS = 1500;
const MATCH_ACTION_TIMINGS = {
  intro: 450,
  recharge: ACTION_DURATION_MS,
  attack: ACTION_DURATION_MS,
  hit: ACTION_DURATION_MS,
  backfire: ACTION_DURATION_MS,
  defeat: 780,
  idle: 250,
  victory: 900,
  draw: 700,
};
const MATCH_ACTION_OVERLAP = {
  attackImpactLeadIn: 1000,
  backfireImpactLeadIn: 1050,
};
const MATCH_SOUND_OFFSETS = {
  recharge: 0,
  attack: 1000,
  hit: 0,
  backfire: 1050,
  victory: 0,
  defeat: 0,
  matchStart: 0,
  matchEnd: 0,
};

const state = {
  screen: 'home',
  me: loadLocalPlayer(),
  pendingMatch: null,
  match: null,
  logs: [],
  leaderboard: [],
  leaderboardStatus: 'idle',
  previewAnimators: [],
  pendingStartTimer: null,
  pendingStartTimerMatchId: null,
  activeMatchSubscription: null,
  homeView: 'default',
  loading: false,
  errorMessage: '',
};

function loadAudioPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.audioPreferences) || 'null');
    const volume = Number(stored?.volume);
    return {
      muted: Boolean(stored?.muted),
      volume: Number.isFinite(volume) ? clamp(volume, 0, 1) : 1,
    };
  } catch {
    return { muted: false, volume: 1 };
  }
}

class AudioManager {
  constructor(config, initialPreferences) {
    this.config = config;
    this.preferences = initialPreferences;
    this.bgm = null;
    this.sfxCache = new Map();
    this.sfxCooldowns = new Map();
    this.minInterval = 120;
    this.failed = false;
    this.autoplayBlocked = false;
    this.autoplayArmed = false;
    this.boundResume = this.resumeFromInteraction.bind(this);
  }
  savePreferences() {
    localStorage.setItem(STORAGE_KEYS.audioPreferences, JSON.stringify(this.preferences));
  }
  getEffectiveVolume(baseVolume = 1) {
    return this.preferences.muted ? 0 : clamp(baseVolume * this.preferences.volume, 0, 1);
  }
  ensureBgm() {
    if (this.bgm || this.failed) return this.bgm;
    try {
      const audio = new Audio(this.config.bgm.src);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = this.getEffectiveVolume(this.config.bgm.volume);
      audio.addEventListener('error', () => {
        this.failed = true;
        this.bgm = null;
      }, { once: true });
      this.bgm = audio;
    } catch {
      this.failed = true;
    }
    return this.bgm;
  }
  ensureSfx(name) {
    if (this.sfxCache.has(name)) return this.sfxCache.get(name);
    const entry = this.config.sfx[name];
    if (!entry) return null;
    try {
      const audio = new Audio(entry.src);
      audio.preload = 'auto';
      audio.volume = this.getEffectiveVolume(entry.volume);
      audio.addEventListener('error', () => {
        this.sfxCache.set(name, null);
      }, { once: true });
      this.sfxCache.set(name, audio);
      return audio;
    } catch {
      this.sfxCache.set(name, null);
      return null;
    }
  }
  applyPreferences() {
    const bgm = this.ensureBgm();
    if (bgm) bgm.volume = this.getEffectiveVolume(this.config.bgm.volume);
    Object.entries(this.config.sfx).forEach(([name, entry]) => {
      const audio = this.sfxCache.get(name);
      if (audio) audio.volume = this.getEffectiveVolume(entry.volume);
    });
  }
  setMuted(muted) {
    this.preferences.muted = Boolean(muted);
    this.savePreferences();
    this.applyPreferences();
    if (!this.preferences.muted) this.syncHomePlayback();
  }
  setVolume(volume) {
    this.preferences.volume = clamp(Number(volume) || 0, 0, 1);
    this.savePreferences();
    this.applyPreferences();
    if (this.preferences.volume > 0 && !this.preferences.muted) this.syncHomePlayback();
  }
  armAutoplayFallback() {
    if (this.autoplayArmed || this.failed) return;
    this.autoplayArmed = true;
    const options = { passive: true };
    window.addEventListener('pointerdown', this.boundResume, options);
    window.addEventListener('touchstart', this.boundResume, options);
    window.addEventListener('keydown', this.boundResume);
    window.addEventListener('click', this.boundResume, options);
  }
  disarmAutoplayFallback() {
    if (!this.autoplayArmed) return;
    this.autoplayArmed = false;
    window.removeEventListener('pointerdown', this.boundResume);
    window.removeEventListener('touchstart', this.boundResume);
    window.removeEventListener('keydown', this.boundResume);
    window.removeEventListener('click', this.boundResume);
  }
  async tryStartBgm() {
    if (this.failed) return false;
    const bgm = this.ensureBgm();
    if (!bgm) return false;
    bgm.volume = this.getEffectiveVolume(this.config.bgm.volume);
    try {
      await bgm.play();
      this.autoplayBlocked = false;
      this.disarmAutoplayFallback();
      return true;
    } catch {
      this.autoplayBlocked = true;
      this.armAutoplayFallback();
      return false;
    }
  }
  initializeForHome() {
    this.ensureBgm();
    this.tryStartBgm();
  }
  syncHomePlayback() {
    const bgm = this.ensureBgm();
    if (!bgm) return;
    bgm.volume = this.getEffectiveVolume(this.config.bgm.volume);
    if (bgm.paused && !this.preferences.muted && this.preferences.volume > 0) {
      this.tryStartBgm();
    }
  }
  async resumeFromInteraction() {
    await this.tryStartBgm();
  }
  playSfx(name) {
    const audio = this.ensureSfx(name);
    if (!audio) return;
    const now = performance.now();
    const last = this.sfxCooldowns.get(name) || 0;
    if (now - last < this.minInterval) return;
    this.sfxCooldowns.set(name, now);
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = this.getEffectiveVolume(this.config.sfx[name].volume);
      audio.play().catch(() => {});
    } catch {
      // Missing file or browser restriction: fail silently.
    }
  }
}

const audioManager = new AudioManager(AUDIO_CONFIG, loadAudioPreferences());

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      default:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }
  return [h, s, l];
}
function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, hue) * 255),
    Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  ];
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function applyPaletteVariant(imageData, variant) {
  if (!variant || variant.hue === 0 && variant.sat === 1 && variant.bright === 1) return imageData;
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) continue;
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const nextH = h + variant.hue;
    const nextS = clamp(s * variant.sat, 0, 1);
    const nextL = clamp(l * variant.bright, 0, 1);
    const [r, g, b] = hslToRgb(nextH, nextS, nextL);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  return imageData;
}
function pickDeterministic(list, seed) {
  return list[hashString(seed) % list.length];
}
function generateFunnyName(seed = crypto.randomUUID()) {
  const prefix = pickDeterministic(NAME_PREFIXES, `${seed}:p`);
  const suffix = pickDeterministic(NAME_SUFFIXES, `${seed}:s`);
  return `${prefix}${suffix}`;
}
function getStoredPlayerProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.playerProfile) || 'null');
  } catch {
    return null;
  }
}
function getDeterministicVariantIndex(playerId, creatureId = 'goblin') {
  return hashString(`${playerId}:${creatureId}`) % PALETTE_VARIANTS.length;
}
function normalizeVariantIndex(variantIndex) {
  if (!Number.isInteger(variantIndex)) return null;
  return ((variantIndex % PALETTE_VARIANTS.length) + PALETTE_VARIANTS.length) % PALETTE_VARIANTS.length;
}
function getDistinctVariantIndex(player, opponentVariantIndex, { preserveExisting = true } = {}) {
  const creatureId = player.creatureId || 'goblin';
  const existingVariantIndex = normalizeVariantIndex(player.variantIndex);
  const baseVariantIndex = preserveExisting && existingVariantIndex != null
    ? existingVariantIndex
    : getDeterministicVariantIndex(player.id, creatureId);
  const rivalVariantIndex = normalizeVariantIndex(opponentVariantIndex);
  if (rivalVariantIndex == null || PALETTE_VARIANTS.length < 2 || baseVariantIndex !== rivalVariantIndex) {
    return baseVariantIndex;
  }
  return (baseVariantIndex + 1 + (hashString(`${player.id}:${creatureId}:variant-reroll`) % (PALETTE_VARIANTS.length - 1))) % PALETTE_VARIANTS.length;
}
function withResolvedVariant(player, opponentVariantIndex, options) {
  const variantIndex = getDistinctVariantIndex(player, opponentVariantIndex, options);
  return {
    ...player,
    variantIndex,
    variant: PALETTE_VARIANTS[variantIndex],
  };
}
function buildPlayerProfile(profile = {}) {
  const creatureId = profile.creatureId || 'goblin';
  const id = profile.id || crypto.randomUUID();
  const variantIndex = normalizeVariantIndex(profile.variantIndex) ?? getDeterministicVariantIndex(id, creatureId);
  return {
    id,
    name: profile.name || generateFunnyName(id),
    creatureId,
    variantIndex,
    variant: PALETTE_VARIANTS[variantIndex],
  };
}
function saveLocalPlayer(player = state.me) {
  localStorage.setItem(STORAGE_KEYS.playerProfile, JSON.stringify({
    id: player.id,
    name: player.name,
    creatureId: player.creatureId,
    variantIndex: player.variantIndex,
  }));
}
function loadLocalPlayer() {
  const stored = getStoredPlayerProfile();
  const player = buildPlayerProfile(stored || {});
  saveLocalPlayer(player);
  return player;
}
function getCurrentLeaderboardDayBucket() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: LEADERBOARD_DAY_TIMEZONE }).format(new Date());
}
function normalizeLeaderboardRow(record) {
  const wins = Number(record.wins || 0);
  const losses = Number(record.losses || 0);
  const draws = Number(record.draws || 0);
  const matchesPlayed = Number(record.matches_played || (wins + losses + draws));
  return {
    playerId: record.player_id,
    name: record.display_name || 'Goblin',
    wins,
    losses,
    draws,
    matchesPlayed,
    winRate: matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : 0,
  };
}
function sortLeaderboardRows(rows) {
  rows.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || a.losses - b.losses || b.draws - a.draws || a.name.localeCompare(b.name));
  return rows;
}
async function loadLeaderboard() {
  state.leaderboardStatus = 'loading';
  render();
  if (!isBackendConfigured()) {
    state.leaderboard = [];
    state.leaderboardStatus = 'ready';
    render();
    return;
  }
  try {
    const dayBucket = getCurrentLeaderboardDayBucket();
    const rows = await supabaseRequest(`ff_lite_daily_stats?day_bucket=eq.${dayBucket}&select=player_id,display_name,wins,losses,draws,matches_played&order=wins.desc,draws.desc,losses.asc,display_name.asc`, { method: 'GET', prefer: undefined });
    state.leaderboard = sortLeaderboardRows((rows || []).map(normalizeLeaderboardRow));
    state.leaderboardStatus = 'ready';
  } catch (error) {
    console.error('Failed to load leaderboard', error);
    state.leaderboard = [];
    state.leaderboardStatus = 'error';
  }
  render();
}
async function upsertDailyStat(player, increments) {
  if (!player?.id || !isBackendConfigured()) return;
  const dayBucket = getCurrentLeaderboardDayBucket();
  const existingRows = await supabaseRequest(`ff_lite_daily_stats?day_bucket=eq.${dayBucket}&player_id=eq.${encodeURIComponent(player.id)}&select=*`, { method: 'GET', prefer: undefined });
  const current = existingRows?.[0];
  const next = {
    day_bucket: dayBucket,
    player_id: player.id,
    display_name: player.name,
    wins: Number(current?.wins || 0) + (increments.wins || 0),
    losses: Number(current?.losses || 0) + (increments.losses || 0),
    draws: Number(current?.draws || 0) + (increments.draws || 0),
    matches_played: Number(current?.matches_played || 0) + (increments.matchesPlayed || 0),
  };
  await supabaseRequest('ff_lite_daily_stats', {
    method: 'POST',
    body: next,
    prefer: 'resolution=merge-duplicates,return=representation',
  });
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
    this.flip = opts.flip ?? 1;
    this.frameWidth = 0;
    this.frameHeight = 0;
    this.ctx = this.canvas?.getContext('2d', { willReadFrequently: true });
    this.variant = opts.variant || null;
    this.bufferCanvas = document.createElement('canvas');
    this.bufferCtx = this.bufferCanvas.getContext('2d', { willReadFrequently: true });
    this.setFlip(this.flip);
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
    for (const canvas of [this.canvas, this.bufferCanvas]) {
      if (!canvas) continue;
      canvas.width = this.frameWidth;
      canvas.height = this.frameHeight;
    }
  }
  drawFrame() {
    if (!this.ctx || !this.image || !this.bufferCtx) return;
    const col = this.frame % this.cols;
    const row = Math.floor(this.frame / this.cols);
    const sx = col * this.frameWidth;
    const sy = row * this.frameHeight;

    this.bufferCtx.clearRect(0, 0, this.frameWidth, this.frameHeight);
    this.bufferCtx.drawImage(this.image, sx, sy, this.frameWidth, this.frameHeight, 0, 0, this.frameWidth, this.frameHeight);
    if (this.variant) {
      const imageData = this.bufferCtx.getImageData(0, 0, this.frameWidth, this.frameHeight);
      this.bufferCtx.putImageData(applyPaletteVariant(imageData, this.variant), 0, 0);
    }

    this.ctx.clearRect(0, 0, this.frameWidth, this.frameHeight);
    this.ctx.save();
    if (this.flip === -1) {
      this.ctx.translate(this.frameWidth, 0);
      this.ctx.scale(-1, 1);
    }
    this.ctx.drawImage(this.bufferCanvas, 0, 0, this.frameWidth, this.frameHeight);
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



function getBackendBaseUrl() {
  const url = SHARED_BACKEND_CONFIG.supabaseUrl;
  return typeof url === 'string' ? url.replace(/\/$/, '') : '';
}
function getBackendHeaders(prefer = 'return=representation') {
  const apiKey = SHARED_BACKEND_CONFIG.supabaseAnonKey;
  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  return headers;
}
function isBackendConfigured() {
  return Boolean(getBackendBaseUrl() && SHARED_BACKEND_CONFIG.supabaseAnonKey);
}
function mapMatchToRecord(payload) {
  return {
    id: payload.id,
    status: payload.status,
    created_at: payload.createdAt,
    player_a: payload.playerA,
    player_b: payload.playerB || null,
    shared_state: payload.sharedState || {},
  };
}
function mapRecordToMatch(record) {
  if (!record) return null;
  return {
    id: record.id,
    status: record.status,
    createdAt: record.created_at,
    playerA: record.player_a,
    playerB: record.player_b,
    sharedState: record.shared_state || {},
  };
}
async function supabaseRequest(pathname, { method = 'GET', body, prefer } = {}) {
  if (!isBackendConfigured()) {
    throw new Error('Backend non configurato. Aggiungi supabaseUrl e supabaseAnonKey in ff.config.js.');
  }
  const normalizedMethod = String(method || 'GET').toUpperCase();
  const response = await fetch(`${getBackendBaseUrl()}/rest/v1/${pathname}`, {
    method: normalizedMethod,
    headers: getBackendHeaders(prefer),
    body: body ? JSON.stringify(body) : undefined,
    cache: normalizedMethod === 'GET' ? 'no-store' : 'default',
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Richiesta backend fallita (${response.status}).`);
  }
  if (response.status === 204) return null;
  return response.json();
}
async function createSharedMatch(payload) {
  const rows = await supabaseRequest('ff_lite_matches', {
    method: 'POST',
    body: mapMatchToRecord(payload),
  });
  return mapRecordToMatch(rows?.[0]);
}
async function getSharedMatch(matchId) {
  if (!matchId) return null;
  const rows = await supabaseRequest(`ff_lite_matches?id=eq.${encodeURIComponent(matchId)}&select=*`, {
    method: 'GET',
    prefer: undefined,
  });
  return mapRecordToMatch(rows?.[0] || null);
}
async function updateSharedMatch(matchId, updates, filters = 'select=*') {
  const query = `ff_lite_matches?id=eq.${encodeURIComponent(matchId)}&${filters}`;
  const rows = await supabaseRequest(query, {
    method: 'PATCH',
    body: updates,
  });
  return Array.isArray(rows) ? rows.map(mapRecordToMatch) : [];
}
async function joinSharedMatch(matchId, playerB) {
  const current = await getSharedMatch(matchId);
  if (!current) throw new Error('Questo match non esiste più oppure il link non è valido.');
  if (current.status === 'finished') throw new Error('Questo match è già terminato.');
  if (current.playerB && current.playerB.id !== playerB.id) throw new Error('Questo match è già pieno o già iniziato.');
  if (current.playerB?.id === playerB.id && current.status === 'active') return current;
  const rows = await updateSharedMatch(matchId, {
    player_b: playerB,
    status: 'active',
  }, 'status=eq.waiting&player_b=is.null&select=*');
  if (rows[0]) return rows[0];
  const latest = await getSharedMatch(matchId);
  if (latest?.playerB?.id === playerB.id) return latest;
  if (latest?.status === 'active') throw new Error('Questo match è già iniziato con un altro player B.');
  throw new Error('Qualcun altro ha già occupato questo match.');
}
function clearMatchWatcher() {
  if (state.activeMatchSubscription) {
    state.activeMatchSubscription.abort();
    state.activeMatchSubscription = null;
  }
}
function clearPendingStartTimer() {
  if (state.pendingStartTimer) {
    window.clearTimeout(state.pendingStartTimer);
    state.pendingStartTimer = null;
  }
  state.pendingStartTimerMatchId = null;
}
function clearRuntimeMatchState({ clearWatcher = false } = {}) {
  clearPendingStartTimer();
  if (clearWatcher) clearMatchWatcher();
  state.match = null;
  state.logs = [];
}
function setError(message) {
  state.loading = false;
  state.errorMessage = message;
  state.screen = 'error';
  render();
}
function watchSharedMatch(matchId, onChange) {
  clearMatchWatcher();
  if (!matchId) return;
  const controller = new AbortController();
  const signal = controller.signal;
  const poll = async () => {
    if (signal.aborted) return;
    try {
      const match = await getSharedMatch(matchId);
      if (!signal.aborted) onChange(match);
    } catch (error) {
      console.error(error);
    }
  };
  poll();
  const pollId = window.setInterval(poll, POLL_INTERVAL_MS);
  signal.addEventListener('abort', () => window.clearInterval(pollId), { once: true });
  state.activeMatchSubscription = controller;
}
function setPendingMatchState(nextPendingMatch) {
  state.pendingMatch = nextPendingMatch;
  if (!nextPendingMatch) {
    state.homeView = 'default';
  } else if (nextPendingMatch.role === 'challenger') {
    state.homeView = 'challenger';
  }
  const matchId = nextPendingMatch?.payload?.id;
  if (!matchId) {
    clearMatchWatcher();
    return;
  }
  watchSharedMatch(matchId, (sharedMatch) => {
    const pendingMatch = state.pendingMatch;
    if (!sharedMatch || !pendingMatch || pendingMatch.payload?.id !== matchId || sharedMatch.id !== matchId) return;
    if (state.match && (state.screen === 'match' || state.screen === 'postmatch')) {
      if (isSharedStateNewerThanLocal(sharedMatch)) {
        hydrateMatchFromSharedState(sharedMatch);
        restoreMatchAnimators();
        updateMatchUI();
      }
      return;
    }
    if (sharedMatch.status === 'active' && sharedMatch.playerB) {
      state.pendingMatch = {
        ...pendingMatch,
        payload: sharedMatch,
        opponentJoined: true,
      };
      render();
      queueMatchStart(sharedMatch);
      return;
    }
    if (sharedMatch.playerB && (!pendingMatch.opponentJoined || pendingMatch.payload?.playerB?.id !== sharedMatch.playerB.id)) {
      state.pendingMatch = {
        ...pendingMatch,
        payload: {
          ...pendingMatch.payload,
          playerB: sharedMatch.playerB,
          status: sharedMatch.status,
          sharedState: sharedMatch.sharedState,
        },
        opponentJoined: true,
      };
      render();
    }
  });
}
function makeMatchPayload(playerA = state.me) {
  const matchId = `match-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id: matchId,
    createdAt: new Date().toISOString(),
    status: 'waiting',
    playerA: { id: playerA.id, name: playerA.name, creatureId: playerA.creatureId, variantIndex: playerA.variantIndex },
    playerB: null,
    sharedState: {},
  };
}
function getJoinLink(matchId) {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('matchId', matchId);
  return url.toString();
}
function parseJoinMatchId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('matchId');
}
function resetToHome() {
  window.history.replaceState({}, '', window.location.pathname);
  clearRuntimeMatchState({ clearWatcher: true });
  state.pendingMatch = null;
  state.homeView = 'default';
  state.loading = false;
  state.errorMessage = '';
  state.screen = 'home';
  audioManager.syncHomePlayback();
  render();
}
async function startCreateFlow() {
  clearRuntimeMatchState();
  state.loading = true;
  state.errorMessage = '';
  state.screen = 'home';
  render();
  try {
    const payload = makeMatchPayload();
    const sharedMatch = await createSharedMatch(payload);
    setPendingMatchState({
      role: 'challenger',
      payload: sharedMatch,
      link: getJoinLink(sharedMatch.id),
      opponentJoined: false,
    });
    state.screen = 'home';
    state.loading = false;
    audioManager.syncHomePlayback();
    render();
  } catch (error) {
    console.error(error);
    setError(error.message || 'Impossibile creare il match condiviso.');
  }
}
async function startJoinedFlow(matchId) {
  state.loading = true;
  state.errorMessage = '';
  render();
  try {
    const hostMatch = await getSharedMatch(matchId);
    if (!hostMatch?.playerA) throw new Error('Il match condiviso è incompleto e non può partire.');
    const playerB = withResolvedVariant(state.me, hostMatch.playerA.variantIndex, { preserveExisting: false });
    state.me = playerB;
    saveLocalPlayer(playerB);
    const sharedMatch = await joinSharedMatch(matchId, { id: playerB.id, name: playerB.name, creatureId: playerB.creatureId, variantIndex: playerB.variantIndex });
    if (!sharedMatch?.playerA || !sharedMatch?.playerB) {
      throw new Error('Il match condiviso è incompleto e non può partire.');
    }
    setPendingMatchState({
      payload: sharedMatch,
      link: getJoinLink(sharedMatch.id),
      opponentJoined: true,
    });
    state.screen = 'join';
    state.loading = false;
    audioManager.syncHomePlayback();
    render();
    queueMatchStart(sharedMatch);
  } catch (error) {
    console.error(error);
    setError(error.message || 'Impossibile unirsi al match condiviso.');
  }
}
function queueMatchStart(payload) {
  if (!payload?.id) return;
  const runningMatchId = state.match?.id;
  const queuedMatchId = state.pendingStartTimerMatchId;
  const sameMatchRunning = runningMatchId === payload.id && (state.screen === 'match' || state.screen === 'postmatch');
  const sameMatchQueued = queuedMatchId === payload.id && state.pendingStartTimer;
  if (sameMatchRunning || sameMatchQueued) return;
  if (state.pendingStartTimer && queuedMatchId !== payload.id) clearPendingStartTimer();
  if (state.match && runningMatchId !== payload.id) {
    state.match = null;
    state.logs = [];
  }
  if (state.screen === 'postmatch' || (state.screen === 'match' && runningMatchId !== payload.id)) {
    state.screen = 'home';
  }
  state.pendingStartTimerMatchId = payload.id;
  state.pendingStartTimer = window.setTimeout(() => {
    const queuedId = state.pendingStartTimerMatchId;
    state.pendingStartTimer = null;
    state.pendingStartTimerMatchId = null;
    if (queuedId !== payload.id) return;
    const activeMatchId = state.match?.id;
    if (activeMatchId === payload.id && (state.screen === 'match' || state.screen === 'postmatch')) return;
    if (state.match && activeMatchId !== payload.id) {
      state.match = null;
      state.logs = [];
    }
    state.screen = 'match';
    state.match = createResolvedMatch(payload);
    state.logs = ['I goblini si annusano con sospetto...'];
    render();
    runMatchSequence();
  }, 900);
}
function createResolvedMatch(payload) {
  const sharedState = payload.sharedState || {};
  const sharedFighters = Array.isArray(sharedState.fighters) ? sharedState.fighters : [];
  const sharedPlayerA = sharedFighters.find((fighter) => fighter.slot === 'A');
  const sharedPlayerB = sharedFighters.find((fighter) => fighter.slot === 'B');
  const playerA = withResolvedVariant({ ...payload.playerA, variantIndex: sharedPlayerA?.variantIndex ?? payload.playerA?.variantIndex });
  const fallbackPlayerB = {
    id: 'auto-b', name: generateFunnyName(`${payload.id}:fallback`), creatureId: 'goblin',
  };
  const playerB = withResolvedVariant({ ...(payload.playerB || fallbackPlayerB), variantIndex: sharedPlayerB?.variantIndex ?? payload.playerB?.variantIndex }, playerA.variantIndex, { preserveExisting: false });
  return {
    id: payload.id,
    sharedState,
    fighters: [
      { slot: 'A', side: 'left', ...playerA, hp: Number(sharedPlayerA?.hp ?? 100), state: sharedPlayerA?.state || 'idle' },
      { slot: 'B', side: 'right', ...playerB, hp: Number(sharedPlayerB?.hp ?? 100), state: sharedPlayerB?.state || 'idle' },
    ],
    turn: Number(sharedState.turn || 0),
    finished: payload.status === 'finished',
    winner: sharedState.winner || null,
  };
}
function refreshAudioControlsUI() {
  const toggle = document.getElementById('audio-toggle');
  const slider = document.getElementById('audio-volume');
  const isMuted = audioManager.preferences.muted || audioManager.preferences.volume === 0;
  if (toggle) toggle.textContent = isMuted ? '🔇' : '🔊';
  if (slider) slider.value = String(Math.round(audioManager.preferences.volume * 100));
}
function updateMatchUI() {
  if (!(state.screen === 'match' || state.screen === 'postmatch') || !state.match) return;
  state.match.fighters.forEach((fighter, index) => {
    const fill = document.querySelector(`[data-hp="${index}"]`);
    const label = document.querySelector(`[data-hp-label="${index}"]`);
    if (fill) fill.style.setProperty('--hp', `${fighter.hp}%`);
    if (label) label.textContent = `HP ${fighter.hp} · ${fighter.slot === 'A' ? 'Player A' : 'Player B'}`;
  });
  const turnLabel = document.querySelector('[data-turn-counter]');
  if (turnLabel) turnLabel.textContent = `Turno ${state.match.turn}`;
  const logPanel = document.getElementById('log-lines');
  if (logPanel) logPanel.innerHTML = state.logs.map((line) => `<p class="log-line">${line}</p>`).join('');
  refreshAudioControlsUI();
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
function isLeaderboardWriteOwner() {
  return Boolean(state.match?.fighters?.[0]?.id && state.me?.id === state.match.fighters[0].id);
}
async function updateLeaderboardForResult(winner, loser, draw = false) {
  if (!state.match || !isLeaderboardWriteOwner()) return;
  const [playerA, playerB] = state.match.fighters;
  if (draw) {
    await Promise.all([
      upsertDailyStat(playerA, { draws: 1, matchesPlayed: 1 }),
      upsertDailyStat(playerB, { draws: 1, matchesPlayed: 1 }),
    ]);
  } else {
    await Promise.all([
      upsertDailyStat(winner, { wins: 1, matchesPlayed: 1 }),
      upsertDailyStat(loser, { losses: 1, matchesPlayed: 1 }),
    ]);
  }
  if (state.screen === 'leaderboard') loadLeaderboard();
}
async function syncSharedMatchState(extraState = {}) {
  if (!state.match || !isBackendConfigured()) return;
  const winner = state.match.winner ? { id: state.match.winner.id, name: state.match.winner.name } : null;
  try {
    await updateSharedMatch(state.match.id, {
      status: state.match.finished ? 'finished' : 'active',
      shared_state: {
        ...state.match.sharedState,
        ...extraState,
        finishedAt: state.match.finished ? new Date().toISOString() : undefined,
        winner,
        turn: state.match.turn,
        fighters: state.match.fighters.map(({ slot, id, name, hp, variantIndex, state: fighterState }) => ({ slot, id, name, hp, variantIndex, state: fighterState })),
      },
    });
  } catch (error) {
    console.error('Failed to persist match state', error);
  }
}
async function syncSharedMatchResult() {
  await syncSharedMatchState();
}
function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
function setFighterState(index, animation) {
  if (!state.match || index == null || !animation) return;
  const fighter = state.match.fighters[index];
  if (fighter) fighter.state = animation;
}
function playFighterAnimation(index, animation) {
  if (!state.match || index == null || !animation) return;
  setFighterState(index, animation);
  state.match.animators?.[index]?.play(animation);
}
function setAllFighterStates(animation) {
  if (!state.match || !animation) return;
  state.match.fighters.forEach((_, index) => setFighterState(index, animation));
}
function restoreMatchAnimators() {
  if (!state.match?.animators?.length) return;
  state.match.animators.forEach((animator, index) => {
    animator.play(state.match.fighters[index]?.state || 'idle');
  });
}
async function runMatchAction(action) {
  if (!action) return;
  return runMatchActionGroup([{ ...action, startAt: 0 }], action.duration || 0);
}
async function runMatchActionGroup(actions, totalDuration) {
  if (!state.match || !actions?.length) return;
  const timers = [];
  const schedule = (fn, delay = 0) => {
    if (delay <= 0) {
      fn();
      return;
    }
    timers.push(window.setTimeout(fn, delay));
  };
  actions.forEach((action) => {
    const startAt = Math.max(0, action.startAt || 0);
    schedule(() => {
      if (action.animation === 'idle-all') {
        setAllFighterStates('idle');
        state.match.animators.forEach((animator) => animator.play('idle'));
      } else {
        playFighterAnimation(action.sourceIndex, action.animation);
        if (action.targetAnimation) playFighterAnimation(action.targetIndex, action.targetAnimation);
      }
      updateMatchUI();
    }, startAt);
    if (action.sound) {
      schedule(() => audioManager.playSfx(action.sound), startAt + (action.soundDelay ?? 0));
    }
    if (action.apply) {
      schedule(() => {
        action.apply();
        updateMatchUI();
      }, startAt + (action.applyDelay ?? 0));
    }
    if (action.log) {
      schedule(() => logLine(action.log), startAt + (action.logDelay ?? 0));
    }
  });
  await wait(totalDuration || 0);
  timers.forEach((timer) => window.clearTimeout(timer));
}
function buildTurnActionGroups(attackerIndex, defenderIndex, action) {
  const attacker = state.match.fighters[attackerIndex];
  const defender = state.match.fighters[defenderIndex];
  const groups = [{
    duration: MATCH_ACTION_TIMINGS.recharge,
    actions: [{
      type: 'recharge',
      sourceIndex: attackerIndex,
      targetIndex: defenderIndex,
      animation: 'recharge',
      sound: 'recharge',
      soundDelay: MATCH_SOUND_OFFSETS.recharge,
      duration: MATCH_ACTION_TIMINGS.recharge,
    }],
  }];
  if (action.type === 'backfire') {
    const nextHp = Math.max(0, attacker.hp - action.amount);
    const reactionType = nextHp <= 0 ? 'defeat' : 'hit';
    const reactionDuration = reactionType === 'defeat' ? MATCH_ACTION_TIMINGS.defeat : MATCH_ACTION_TIMINGS.hit;
    groups.push({
      duration: Math.max(MATCH_ACTION_TIMINGS.backfire, MATCH_ACTION_OVERLAP.backfireImpactLeadIn + reactionDuration),
      actions: [{
        type: 'backfire',
        sourceIndex: attackerIndex,
        targetIndex: attackerIndex,
        animation: 'backfire',
        sound: 'backfire',
        soundDelay: MATCH_SOUND_OFFSETS.backfire,
        apply: () => { attacker.hp = nextHp; },
        applyDelay: MATCH_ACTION_OVERLAP.backfireImpactLeadIn,
        log: action.text,
        logDelay: MATCH_ACTION_OVERLAP.backfireImpactLeadIn,
      }, {
        type: reactionType,
        sourceIndex: attackerIndex,
        targetIndex: attackerIndex,
        animation: reactionType,
        sound: reactionType,
        startAt: MATCH_ACTION_OVERLAP.backfireImpactLeadIn,
        duration: reactionDuration,
      }],
    });
    return groups;
  }
  const nextHp = Math.max(0, defender.hp - action.amount);
  const reactionType = nextHp <= 0 ? 'defeat' : 'hit';
  const reactionDuration = reactionType === 'defeat' ? MATCH_ACTION_TIMINGS.defeat : MATCH_ACTION_TIMINGS.hit;
  groups.push({
    duration: Math.max(MATCH_ACTION_TIMINGS.attack, MATCH_ACTION_OVERLAP.attackImpactLeadIn + reactionDuration),
    actions: [{
      type: 'attack',
      sourceIndex: attackerIndex,
      targetIndex: defenderIndex,
      animation: 'attack',
      sound: 'attack',
      soundDelay: MATCH_SOUND_OFFSETS.attack,
      duration: MATCH_ACTION_TIMINGS.attack,
    }, {
      type: reactionType,
      sourceIndex: defenderIndex,
      targetIndex: defenderIndex,
      animation: reactionType,
      sound: reactionType,
      startAt: MATCH_ACTION_OVERLAP.attackImpactLeadIn,
      duration: reactionDuration,
      apply: () => { defender.hp = nextHp; },
      log: action.text,
    }],
  });
  return groups;
}
async function runMatchSequence() {
  const [a, b] = state.match.fighters;
  audioManager.syncHomePlayback();
  await runMatchAction({ type: 'intro', animation: 'idle-all', sound: 'matchStart', duration: MATCH_ACTION_TIMINGS.intro });
  while (!state.match.finished) {
    state.match.turn += 1;
    const attackerIndex = state.match.turn % 2 === 1 ? 0 : 1;
    const defenderIndex = attackerIndex === 0 ? 1 : 0;
    const attacker = state.match.fighters[attackerIndex];
    const defender = state.match.fighters[defenderIndex];
    const turnAction = computeAction(attacker, defender, state.match.turn);
    for (const group of buildTurnActionGroups(attackerIndex, defenderIndex, turnAction)) {
      await runMatchActionGroup(group.actions, group.duration);
    }
    await syncSharedMatchState({ lastAction: turnAction.type });
    if (a.hp <= 0 || b.hp <= 0 || state.match.turn >= 12) {
      await finishMatch();
      return;
    }
    await runMatchAction({ type: 'idle', animation: 'idle-all', duration: MATCH_ACTION_TIMINGS.idle });
  }
}
async function finishMatch() {
  const [a, b] = state.match.fighters;
  state.match.finished = true;
  if (a.hp === b.hp) {
    state.match.winner = null;
    setAllFighterStates('idle');
    await updateLeaderboardForResult(null, null, true);
    await runMatchAction({ type: 'draw', animation: 'idle-all', sound: 'matchEnd', duration: MATCH_ACTION_TIMINGS.draw, log: 'Pareggio tossico: nessuno crolla davvero.' });
  } else {
    const winner = a.hp > b.hp ? a : b;
    const loser = winner === a ? b : a;
    winner.state = 'victory';
    loser.state = 'defeat';
    state.match.winner = winner;
    await runMatchAction({
      type: 'finish',
      sourceIndex: winner === a ? 0 : 1,
      targetIndex: winner === a ? 1 : 0,
      animation: 'victory',
      targetAnimation: 'defeat',
      sound: 'matchEnd',
      duration: MATCH_ACTION_TIMINGS.victory,
      log: `${winner.name} trionfa nella nebbia verdognola.`,
    });
    audioManager.playSfx('victory');
    audioManager.playSfx('defeat');
    await updateLeaderboardForResult(winner, loser, false);
  }
  state.screen = 'postmatch';
  render();
  syncSharedMatchResult();
}

function renderAnimatedPreview(label = '', variantIndex = state.me?.variantIndex) {
  return `
    <div class="goblin-frame sprite-render sprite-render-home" data-home-animator="${label}" data-variant-index="${variantIndex ?? ''}">
      <canvas class="sprite-canvas" aria-hidden="true"></canvas>
      <div class="sprite-fallback" hidden></div>
    </div>`;
}

function renderStatusCard(title, body) {
  return `
    <section class="panel">
      <h1 class="screen-title">${title}</h1>
      <p class="muted">${body}</p>
      <div class="footer-actions"><button id="status-home">Home</button></div>
    </section>`;
}

function renderHome() {
  const isChallengerView = state.homeView === 'challenger' && state.pendingMatch?.payload?.playerA?.id === state.me.id;
  const challengerStatus = state.pendingMatch?.opponentJoined
    ? 'Avversario trovato: il match partirà da solo.'
    : 'In attesa che il player B apra il link.';
  return `
    <section class="panel hero">
      <div class="hero-copy">
        <h1>Fart & Furious Lite</h1>
        ${isChallengerView ? `
          <div class="info-card challenge-card">
            <strong>Challenge link pronto</strong>
            <p class="muted">Sei il challenger: il match condiviso è già stato creato e questa home ora resta agganciata alla lobby finché il player B non entra.</p>
            <div class="link-box">
              <code>${state.pendingMatch.link}</code>
              <button id="copy-link">Copia link</button>
            </div>
            <p class="muted">${challengerStatus}</p>
            <div class="card-grid">
              <div class="info-card">
                <strong>Stato</strong><br/>${state.pendingMatch.payload.status === 'active' ? 'Match attivo' : 'In attesa di join'}
              </div>
              <div class="info-card">
                <strong>Player B</strong><br/>${state.pendingMatch.payload.playerB?.name || 'Nessuno ancora'}
              </div>
            </div>
          </div>` : state.pendingMatch ? `
          <div class="info-card challenge-card">
            <strong>Challenge link pronto</strong>
            <p class="muted">Crea il match condiviso senza lasciare la home, poi copia il link per il player B.</p>
            <div class="link-box">
              <code>${state.pendingMatch.link}</code>
              <button id="copy-link">Copia link</button>
            </div>
            <p class="muted">${state.pendingMatch.opponentJoined ? 'Avversario trovato: il match partirà da solo.' : 'In attesa che il player B apra il link.'}</p>
          </div>` : `
          <div class="inline-actions">
            <button class="secondary" id="home-create">Crea challenge link</button>
          </div>`}
      </div>
      <div class="goblin-preview">
        ${renderAnimatedPreview('home', state.me.variantIndex)}
        <div class="nameplate">${state.me.name}</div>
        ${isChallengerView ? `<div class="subtext">Match ID: ${state.pendingMatch.payload.id}</div>` : ''}
      </div>
    </section>`;
}
function renderCreate() {
  return `
    <section class="panel">
      <h1 class="screen-title">Crea match</h1>
      <p class="muted">Copia e invia questo link all’avversario. Il match condiviso rimane in attesa sul backend finché l’avversario non entra.</p>
      <div class="link-box">
        <code>${state.pendingMatch.link}</code>
        <button id="copy-link">Copia link</button>
      </div>
      <p class="muted">Questa schermata controlla il match condiviso ogni pochi secondi. Quando il player B entra, il match parte automaticamente anche qui senza refresh.</p>
      <div class="goblin-preview" style="margin-top:18px;">
        ${renderAnimatedPreview('create', state.pendingMatch.payload.playerA.variantIndex)}
        <div class="nameplate">${state.pendingMatch.payload.playerA.name}</div>
      </div>
    </section>`;
}
function getSharedMatchProgress(sharedMatch) {
  const sharedState = sharedMatch?.sharedState || {};
  const sharedTurn = Number(sharedState.turn || 0);
  const sharedFighters = Array.isArray(sharedState.fighters) ? sharedState.fighters : [];
  const sharedHpBySlot = new Map();
  const sharedStateBySlot = new Map();
  sharedFighters.forEach((fighter) => {
    if (!fighter?.slot) return;
    const hp = Number(fighter.hp);
    if (Number.isFinite(hp)) sharedHpBySlot.set(fighter.slot, hp);
    if (fighter.state) sharedStateBySlot.set(fighter.slot, fighter.state);
  });
  return {
    sharedState,
    sharedTurn: Number.isFinite(sharedTurn) ? sharedTurn : 0,
    sharedHpBySlot,
    sharedStateBySlot,
    winner: sharedState.winner || null,
    finished: sharedMatch?.status === 'finished' || Boolean(sharedState.winner) || Boolean(sharedState.finishedAt),
  };
}
function isSharedStateNewerThanLocal(sharedMatch) {
  if (!state.match || !sharedMatch?.sharedState) return false;
  const localTurn = Number(state.match.turn || 0);
  const progress = getSharedMatchProgress(sharedMatch);
  if (progress.sharedTurn > localTurn) return true;
  if (progress.finished && !state.match.finished) return true;
  if (progress.winner && !state.match.winner) return true;
  return state.match.fighters.some((fighter) => {
    const sharedHp = progress.sharedHpBySlot.get(fighter.slot);
    return Number.isFinite(sharedHp) && sharedHp < fighter.hp;
  });
}
function hydrateMatchFromSharedState(sharedMatch) {
  if (!state.match || !sharedMatch?.sharedState) return;
  const progress = getSharedMatchProgress(sharedMatch);
  const localTurn = Number(state.match.turn || 0);
  state.match.turn = Math.max(localTurn, progress.sharedTurn);
  state.match.sharedState = {
    ...state.match.sharedState,
    ...progress.sharedState,
    turn: state.match.turn,
  };
  state.match.fighters = state.match.fighters.map((fighter) => {
    const sharedHp = progress.sharedHpBySlot.get(fighter.slot);
    const sharedAnimationState = progress.sharedStateBySlot.get(fighter.slot);
    return {
      ...fighter,
      hp: Number.isFinite(sharedHp) ? Math.min(fighter.hp, sharedHp) : fighter.hp,
      state: sharedAnimationState || fighter.state || 'idle',
    };
  });
  if (progress.winner) state.match.winner = progress.winner;
  if (progress.finished) state.match.finished = true;
}

function renderJoin() {
  const playerB = state.pendingMatch.payload.playerB;
  return `
    <section class="panel hero">
      <div>
        <h1 class="screen-title">Avversario trovato</h1>
        <p class="muted">Sei il player B. I goblin stanno entrando nell’arena…</p>
        <div class="info-card">
          <strong>Host</strong><br/>${state.pendingMatch.payload.playerA.name}
        </div>
      </div>
      <div class="goblin-preview">
        ${renderAnimatedPreview('join', playerB.variantIndex)}
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
          <h1 class="screen-title">${isPost ? 'Risultato match' : 'Match'}</h1>
          <p class="muted" data-turn-counter>Turno ${state.match.turn}</p>
        </div>
        ${isPost ? `<div class="result-banner"><strong>${result}</strong>${state.match.winner ? '' : 'Entrambi sopravvivono al fetore conclusivo.'}</div>` : ''}
      </div>
      <div class="arena-shell">
        <section class="arena">
          <div class="arena-background" aria-hidden="true" style="--arena-image:url('${ARENA_BACKGROUND}')"></div>
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
        <p class="muted">Classifica giornaliera Lite basata sul bucket data corrente (${LEADERBOARD_DAY_TIMEZONE}).</p>
      </div>
      <table class="table">
        <thead><tr><th>Player</th><th>Wins</th><th>Losses</th><th>Draws</th><th>Matches</th><th>Win rate</th></tr></thead>
        <tbody>
          ${state.leaderboard.length ? state.leaderboard.map((row) => `<tr><td>${row.name}</td><td>${row.wins}</td><td>${row.losses}</td><td>${row.draws}</td><td>${row.matchesPlayed}</td><td>${row.winRate}%</td></tr>`).join('') : `<tr><td colspan="6">${state.leaderboardStatus === 'loading' ? 'Caricamento classifica…' : 'Nessun risultato ancora per oggi.'}</td></tr>`}
        </tbody>
      </table>
    </section>`;
}
function render() {
  if (state.screen === 'home') audioManager.initializeForHome();
  state.previewAnimators.forEach((animator) => animator.stop());
  state.previewAnimators = [];
  const app = document.getElementById('app');
  app.innerHTML = `
    <main class="app-shell">
      <nav class="topbar">
        <button id="nav-home">Home</button>
        <button class="secondary" id="nav-create">Crea match</button>
        <button class="ghost" id="nav-leaderboard">Leaderboard</button>
        <div class="audio-controls" aria-label="Audio controls">
          <button class="ghost audio-toggle" id="audio-toggle">${audioManager.preferences.muted || audioManager.preferences.volume === 0 ? '🔇' : '🔊'}</button>
          <label class="audio-slider-wrap" for="audio-volume">
            <span>Vol</span>
            <input id="audio-volume" type="range" min="0" max="100" value="${Math.round(audioManager.preferences.volume * 100)}" />
          </label>
        </div>
      </nav>
      ${state.loading ? renderStatusCard('Connessione al match condiviso', 'Sto sincronizzando il match Lite con il backend condiviso…') : ''}
      ${state.screen === 'home' ? renderHome() : ''}
      ${state.screen === 'create' ? renderCreate() : ''}
      ${state.screen === 'join' ? renderJoin() : ''}
      ${state.screen === 'match' || state.screen === 'postmatch' ? renderMatchOrPost() : ''}
      ${state.screen === 'leaderboard' ? renderLeaderboard() : ''}
      ${state.screen === 'error' ? renderStatusCard('Problema match condiviso', state.errorMessage) : ''}
    </main>`;

  document.getElementById('nav-home')?.addEventListener('click', resetToHome);
  document.getElementById('status-home')?.addEventListener('click', resetToHome);
  document.getElementById('nav-create')?.addEventListener('click', startCreateFlow);
  document.getElementById('audio-toggle')?.addEventListener('click', () => {
    audioManager.setMuted(!audioManager.preferences.muted);
    refreshAudioControlsUI();
  });
  document.getElementById('audio-volume')?.addEventListener('input', (event) => {
    const nextVolume = Number(event.target.value) / 100;
    audioManager.setVolume(nextVolume);
    if (nextVolume > 0 && audioManager.preferences.muted) audioManager.setMuted(false);
    if (nextVolume === 0 && !audioManager.preferences.muted) audioManager.setMuted(true);
    refreshAudioControlsUI();
  });
  document.getElementById('home-create')?.addEventListener('click', startCreateFlow);
  document.getElementById('nav-leaderboard')?.addEventListener('click', () => { state.screen = 'leaderboard'; loadLeaderboard(); audioManager.syncHomePlayback(); render(); });
  document.getElementById('copy-link')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(state.pendingMatch.link);
      logLine('Link copiato negli appunti.');
    } catch {
      logLine('Copia manuale necessaria: il browser non permette gli appunti.');
    }
  });
  document.getElementById('post-home')?.addEventListener('click', resetToHome);
  document.getElementById('post-leaderboard')?.addEventListener('click', () => { state.screen = 'leaderboard'; loadLeaderboard(); audioManager.syncHomePlayback(); render(); });

  document.querySelectorAll('[data-home-animator]').forEach((node) => {
    const variantIndex = Number(node.dataset.variantIndex);
    const animator = new SpriteSheetAnimator(node, {
      variant: Number.isInteger(variantIndex) ? PALETTE_VARIANTS[variantIndex] : null,
    });
    state.previewAnimators.push(animator);
    animator.playSheet(HOME_ANIMATION);
  });

  if (state.screen === 'match' || state.screen === 'postmatch') {
    const nodes = [...document.querySelectorAll('[data-animator]')];
    const previous = state.match.animators || [];
    previous.forEach((animator) => animator.stop());
    state.match.animators = nodes.map((node, index) => new SpriteSheetAnimator(node, {
      flip: state.match.fighters[index].side === 'left' ? -1 : 1,
      variant: state.match.fighters[index].variant,
    }));
    restoreMatchAnimators();
  }

  refreshAudioControlsUI();
}

audioManager.initializeForHome();

const joinMatchId = parseJoinMatchId();
if (joinMatchId) {
  startJoinedFlow(joinMatchId);
} else {
  render();
}
