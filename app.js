const STORAGE_KEYS = {
  playerProfile: 'ff-lite-player-profile',
  audioPreferences: 'ff-lite-audio-preferences',
};

const ACTION_ASSET_BASE_NAMES = {
  idle: 'idle',
  recharge: 'charge',
  charge: 'charge',
  attack: 'attack',
  backfire: 'backfire',
  hit: 'hit',
  victory: 'victory',
  defeat: 'defeat',
};
const ACTION_VARIANT_COUNTS = {
  idle: 4,
  recharge: 4,
  charge: 4,
  attack: 4,
  backfire: 4,
  hit: 4,
  victory: 2,
  defeat: 2,
};
const HOME_IMAGE = 'assets/goblin/idle_choose.png';
const HOME_ANIMATION = { src: HOME_IMAGE, rows: 4, cols: 4, loop: true, frameDuration: 150 };
const ARENA_BACKGROUND = '/images/match_bg.png'; // Placeholder image path: replace/add the real arena background manually later.
const HOME_WORLD_BACKGROUND = '/images/header.jpg';
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
const INITIAL_RATING = 1000;
const ELO_K_FACTOR = 24;
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
const COMBAT_EFFECT_DURATIONS = {
  actor: 340,
  attack: 280,
  charge: 260,
  hit: 210,
  backfire: 320,
  hp: 260,
  badge: 240,
  victory: 700,
  defeat: 520,
  result: 420,
};

const state = {
  screen: 'home',
  me: loadLocalPlayer(),
  pendingMatch: null,
  match: null,
  logs: [],
  leaderboard: { daily: [], rating: [] },
  leaderboardStatus: { daily: 'idle', rating: 'idle' },
  previewAnimators: [],
  pendingStartTimer: null,
  pendingStartTimerMatchId: null,
  activeMatchSubscription: null,
  homeView: 'default',
  loading: false,
  booting: false,
  errorMessage: '',
  copyFeedback: '',
  reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false,
};

function normalizeAnimationAction(action) {
  return ACTION_ASSET_BASE_NAMES[action] ? action : 'idle';
}
function getVariantCount(action) {
  return ACTION_VARIANT_COUNTS[normalizeAnimationAction(action)] || ACTION_VARIANT_COUNTS.idle;
}
function pickRandomVariant(action, lastVariant) {
  const count = getVariantCount(action);
  if (count <= 1) return 1;
  let variant = 1;
  do {
    variant = randomInt(1, count);
  } while (variant === lastVariant);
  return variant;
}
function getActionAsset(action, variant) {
  const normalizedAction = normalizeAnimationAction(action);
  const assetBase = ACTION_ASSET_BASE_NAMES[normalizedAction] || ACTION_ASSET_BASE_NAMES.idle;
  const count = getVariantCount(normalizedAction);
  const safeVariant = Number.isInteger(variant) && variant >= 1 && variant <= count ? variant : 1;
  return `assets/goblin/${assetBase}${safeVariant}.png`;
}
function pickTimingMultiplier() {
  return 0.9 + Math.random() * 0.2;
}
function getActionFallbackAsset(action) {
  const normalizedAction = normalizeAnimationAction(action);
  return ACTION_ASSET_BASE_NAMES[normalizedAction] ? getActionAsset(normalizedAction, 1) : getActionAsset('idle', 1);
}
function getAllBattleActionAssets() {
  const assets = new Set();
  Object.keys(ACTION_VARIANT_COUNTS).forEach((action) => {
    for (let variant = 1; variant <= getVariantCount(action); variant += 1) {
      assets.add(getActionAsset(action, variant));
    }
  });
  return [...assets];
}
function createAnimationState(currentAction = 'idle') {
  return {
    currentAction: null,
    currentVariant: null,
    currentTimingMultiplier: 1,
    currentAsset: getActionAsset(currentAction, 1),
    lastVariantByAction: {},
  };
}
function selectCreatureAnimationState(fighter, action, { reroll = true } = {}) {
  if (!fighter) return { action: 'idle', variant: 1, timingMultiplier: 1, asset: getActionAsset('idle', 1) };
  const normalizedAction = normalizeAnimationAction(action);
  fighter.animationState ||= createAnimationState(normalizedAction);
  const currentVariant = fighter.animationState.currentVariant;
  const currentTimingMultiplier = fighter.animationState.currentTimingMultiplier;
  if (!reroll && fighter.animationState.currentAction === normalizedAction && currentVariant) {
    return {
      action: normalizedAction,
      variant: currentVariant,
      timingMultiplier: Number.isFinite(currentTimingMultiplier) ? currentTimingMultiplier : 1,
      asset: fighter.animationState.currentAsset || getActionAsset(normalizedAction, currentVariant),
    };
  }
  const lastVariant = fighter.animationState.lastVariantByAction?.[normalizedAction];
  const variant = pickRandomVariant(normalizedAction, lastVariant);
  const timingMultiplier = pickTimingMultiplier();
  const asset = getActionAsset(normalizedAction, variant);
  fighter.animationState.currentAction = normalizedAction;
  fighter.animationState.currentVariant = variant;
  fighter.animationState.currentTimingMultiplier = timingMultiplier;
  fighter.animationState.currentAsset = asset;
  fighter.animationState.lastVariantByAction = {
    ...(fighter.animationState.lastVariantByAction || {}),
    [normalizedAction]: variant,
  };
  return { action: normalizedAction, variant, timingMultiplier, asset };
}
function preloadBattleAnimationAssets() {
  getAllBattleActionAssets().forEach((src) => {
    SpriteSheetAnimator.preloadImage(src);
  });
}

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

function randomInt(min, max) {
  const lower = Math.ceil(Math.min(min, max));
  const upper = Math.floor(Math.max(min, max));
  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}
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
function normalizeLeaderboardRow(record, type = 'daily') {
  const wins = Number(record.wins || 0);
  const losses = Number(record.losses || 0);
  const draws = Number(record.draws || 0);
  const matchesPlayed = Number(record.matches_played || (wins + losses + draws));
  const rating = Math.round(Number(record.rating || INITIAL_RATING));
  return {
    playerId: record.player_id,
    name: record.display_name || 'Goblin',
    wins,
    losses,
    draws,
    matchesPlayed,
    rating,
    winRate: matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : 0,
    type,
  };
}
function sortLeaderboardRows(rows, type = 'daily') {
  if (type === 'rating') {
    rows.sort((a, b) => b.rating - a.rating || b.wins - a.wins || a.losses - b.losses || a.name.localeCompare(b.name));
    return rows;
  }
  rows.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || a.losses - b.losses || b.draws - a.draws || a.name.localeCompare(b.name));
  return rows;
}
function setLeaderboardStatus(type, value) {
  state.leaderboardStatus = { ...state.leaderboardStatus, [type]: value };
}
function setLeaderboardRows(type, rows) {
  state.leaderboard = { ...state.leaderboard, [type]: rows };
}
function shouldRenderLeaderboard(type, silent) {
  return !silent && state.screen === 'leaderboard' && Boolean(type);
}
async function loadDailyLeaderboard({ silent = false } = {}) {
  const dayBucket = getCurrentLeaderboardDayBucket();
  console.info('[leaderboard] daily load start', { playerId: state.me?.id || null, dayBucket, silent });
  setLeaderboardStatus('daily', 'loading');
  if (shouldRenderLeaderboard('daily', silent)) render();
  if (!isBackendConfigured()) {
    console.warn('[leaderboard] daily load skipped: backend not configured', { playerId: state.me?.id || null, dayBucket });
    setLeaderboardRows('daily', []);
    setLeaderboardStatus('daily', 'ready');
    if (shouldRenderLeaderboard('daily', silent)) render();
    return [];
  }
  try {
    const rows = await supabaseRequest(`ff_lite_daily_stats?day_bucket=eq.${dayBucket}&select=player_id,display_name,wins,losses,draws,matches_played&order=wins.desc,draws.desc,losses.asc,display_name.asc`, { method: 'GET', prefer: undefined });
    const normalized = sortLeaderboardRows((rows || []).map((row) => normalizeLeaderboardRow(row, 'daily')), 'daily');
    setLeaderboardRows('daily', normalized);
    setLeaderboardStatus('daily', 'ready');
    return normalized;
  } catch (error) {
    console.error('[leaderboard] daily load failed', { playerId: state.me?.id || null, dayBucket, error: error?.message || error });
    setLeaderboardRows('daily', []);
    setLeaderboardStatus('daily', 'error');
    return [];
  } finally {
    if (shouldRenderLeaderboard('daily', silent)) render();
  }
}
async function loadRatingLeaderboard({ silent = false } = {}) {
  console.info('[leaderboard] rating load start', { playerId: state.me?.id || null, silent });
  setLeaderboardStatus('rating', 'loading');
  if (shouldRenderLeaderboard('rating', silent)) render();
  if (!isBackendConfigured()) {
    console.warn('[leaderboard] rating load skipped: backend not configured', { playerId: state.me?.id || null });
    setLeaderboardRows('rating', []);
    setLeaderboardStatus('rating', 'ready');
    if (shouldRenderLeaderboard('rating', silent)) render();
    return [];
  }
  try {
    const rows = await supabaseRequest('ff_lite_player_ratings?select=player_id,display_name,rating,wins,losses,draws,matches_played,updated_at&order=rating.desc,wins.desc,losses.asc,display_name.asc', { method: 'GET', prefer: undefined });
    const normalized = sortLeaderboardRows((rows || []).map((row) => normalizeLeaderboardRow(row, 'rating')), 'rating');
    setLeaderboardRows('rating', normalized);
    setLeaderboardStatus('rating', 'ready');
    return normalized;
  } catch (error) {
    console.error('[leaderboard] rating load failed', { playerId: state.me?.id || null, error: error?.message || error });
    setLeaderboardRows('rating', []);
    setLeaderboardStatus('rating', 'error');
    return [];
  } finally {
    if (shouldRenderLeaderboard('rating', silent)) render();
  }
}
async function loadLeaderboard(options = {}) {
  const [daily, rating] = await Promise.all([
    loadDailyLeaderboard(options),
    loadRatingLeaderboard(options),
  ]);
  return { daily, rating };
}
function getExpectedEloScore(ratingA, ratingB) {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}
function calculateEloRatings(ratingA, ratingB, scoreA, scoreB, kFactor = ELO_K_FACTOR) {
  const expectedA = getExpectedEloScore(ratingA, ratingB);
  const expectedB = getExpectedEloScore(ratingB, ratingA);
  return {
    expectedA,
    expectedB,
    newRatingA: Math.round(ratingA + kFactor * (scoreA - expectedA)),
    newRatingB: Math.round(ratingB + kFactor * (scoreB - expectedB)),
  };
}
async function getPlayerRatingRecord(playerId) {
  if (!playerId || !isBackendConfigured()) return null;
  const rows = await supabaseRequest(`ff_lite_player_ratings?player_id=eq.${encodeURIComponent(playerId)}&select=*`, { method: 'GET', prefer: undefined });
  return rows?.[0] || null;
}
async function upsertPlayerRating(player, updates) {
  if (!player?.id || !isBackendConfigured()) return null;
  const payload = {
    player_id: player.id,
    display_name: player.name,
    rating: Math.round(Number(updates.rating ?? INITIAL_RATING)),
    wins: Number(updates.wins || 0),
    losses: Number(updates.losses || 0),
    draws: Number(updates.draws || 0),
    matches_played: Number(updates.matchesPlayed || 0),
    updated_at: new Date().toISOString(),
  };
  return supabaseRequest('ff_lite_player_ratings?on_conflict=player_id', {
    method: 'POST',
    body: payload,
    prefer: 'resolution=merge-duplicates,return=representation',
  });
}
async function updateGlobalRatingsForResult(playerA, playerB, result) {
  if (!playerA?.id || !playerB?.id) return null;
  const [currentA, currentB] = await Promise.all([
    getPlayerRatingRecord(playerA.id),
    getPlayerRatingRecord(playerB.id),
  ]);
  const ratingA = Number(currentA?.rating || INITIAL_RATING);
  const ratingB = Number(currentB?.rating || INITIAL_RATING);
  const scoreA = result === 'A' ? 1 : result === 'draw' ? 0.5 : 0;
  const scoreB = result === 'B' ? 1 : result === 'draw' ? 0.5 : 0;
  // Standard Elo update: expected score depends on the rating gap, then each player moves by K * (actual - expected).
  const nextRatings = calculateEloRatings(ratingA, ratingB, scoreA, scoreB);
  const nextA = {
    rating: nextRatings.newRatingA,
    wins: Number(currentA?.wins || 0) + (result === 'A' ? 1 : 0),
    losses: Number(currentA?.losses || 0) + (result === 'B' ? 1 : 0),
    draws: Number(currentA?.draws || 0) + (result === 'draw' ? 1 : 0),
    matchesPlayed: Number(currentA?.matches_played || 0) + 1,
  };
  const nextB = {
    rating: nextRatings.newRatingB,
    wins: Number(currentB?.wins || 0) + (result === 'B' ? 1 : 0),
    losses: Number(currentB?.losses || 0) + (result === 'A' ? 1 : 0),
    draws: Number(currentB?.draws || 0) + (result === 'draw' ? 1 : 0),
    matchesPlayed: Number(currentB?.matches_played || 0) + 1,
  };
  await Promise.all([
    upsertPlayerRating(playerA, nextA),
    upsertPlayerRating(playerB, nextB),
  ]);
  return {
    playerA: { previous: ratingA, next: nextRatings.newRatingA, expected: nextRatings.expectedA },
    playerB: { previous: ratingB, next: nextRatings.newRatingB, expected: nextRatings.expectedB },
  };
}

async function upsertDailyStat(player, increments) {
  if (!player?.id || !isBackendConfigured()) {
    console.warn('[leaderboard] upsert skipped', {
      playerId: player?.id || null,
      currentPlayerId: state.me?.id || null,
      backendConfigured: isBackendConfigured(),
    });
    return null;
  }
  const dayBucket = getCurrentLeaderboardDayBucket();
  console.info('[leaderboard] upsert start', {
    currentPlayerId: state.me?.id || null,
    playerId: player.id,
    dayBucket,
    increments,
  });
  try {
    const existingRows = await supabaseRequest(`ff_lite_daily_stats?day_bucket=eq.${dayBucket}&player_id=eq.${encodeURIComponent(player.id)}&select=*`, { method: 'GET', prefer: undefined });
    console.info('[leaderboard] upsert existing row', {
      currentPlayerId: state.me?.id || null,
      playerId: player.id,
      dayBucket,
      existingRow: existingRows?.[0] || null,
    });
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
    console.info('[leaderboard] upsert write', {
      currentPlayerId: state.me?.id || null,
      playerId: player.id,
      dayBucket,
      payload: next,
    });
    const response = await supabaseRequest('ff_lite_daily_stats?on_conflict=day_bucket,player_id', {
      method: 'POST',
      body: next,
      prefer: 'resolution=merge-duplicates,return=representation',
    });
    console.info('[leaderboard] upsert success', {
      currentPlayerId: state.me?.id || null,
      playerId: player.id,
      dayBucket,
      response,
    });
    return response;
  } catch (error) {
    console.error('[leaderboard] upsert failed', {
      currentPlayerId: state.me?.id || null,
      playerId: player.id,
      dayBucket,
      increments,
      error: error?.message || error,
    });
    throw error;
  }
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
  static imageCache = new Map();
  static preloadImage(src) {
    if (!src) return null;
    const cached = SpriteSheetAnimator.imageCache.get(src);
    if (cached) return cached;
    const img = new Image();
    img.src = src;
    SpriteSheetAnimator.imageCache.set(src, img);
    return img;
  }
  play(stateName, onEnd, opts = {}) {
    const normalizedAction = normalizeAnimationAction(stateName);
    const variant = Number.isInteger(opts.variant) ? opts.variant : 1;
    const timingMultiplier = Number.isFinite(opts.timingMultiplier) ? opts.timingMultiplier : 1;
    return this.playSheet({
      stateName: normalizedAction,
      src: opts.src || getActionAsset(normalizedAction, variant),
      fallbackSrc: opts.fallbackSrc || getActionFallbackAsset(normalizedAction),
      rows: this.rows,
      cols: this.cols,
      timingMultiplier,
      ...ANIMATION_CONFIG[normalizedAction],
    }, onEnd);
  }
  playSheet(sheet, onEnd) {
    this.current = {
      stateName: sheet.stateName || 'custom',
      src: sheet.src,
      config: {
        loop: Boolean(sheet.loop),
        frameDuration: sheet.frameDuration || ANIMATION_CONFIG.idle.frameDuration,
        timingMultiplier: Number.isFinite(sheet.timingMultiplier) ? sheet.timingMultiplier : 1,
        freezeLastFrame: Boolean(sheet.freezeLastFrame),
      },
      fallbackSrc: sheet.fallbackSrc || getActionFallbackAsset(sheet.stateName),
      usingFallback: false,
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
    const cached = SpriteSheetAnimator.imageCache.get(this.current.src);
    if (cached?.complete) {
      this.handleImageLoad(cached);
      return;
    }
    const img = cached || new Image();
    img.onload = () => this.handleImageLoad(img);
    img.onerror = () => {
      SpriteSheetAnimator.imageCache.delete(this.current.src);
      if (!this.current.usingFallback && this.current.fallbackSrc && this.current.src !== this.current.fallbackSrc) {
        this.current.src = this.current.fallbackSrc;
        this.current.usingFallback = true;
        this.preloadAndStart();
        return;
      }
      this.image = null;
      if (this.canvas) this.canvas.hidden = true;
      this.fallback.hidden = false;
      this.fallback.textContent = `Missing sprite sheet:\n${this.current.src}`;
      if (!this.current.config.loop && this.ended) this.ended();
    };
    SpriteSheetAnimator.imageCache.set(this.current.src, img);
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
    }, config.frameDuration * (Number.isFinite(config.timingMultiplier) ? config.timingMultiplier : 1));
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
    const detail = [
      `Supabase ${normalizedMethod} ${pathname} failed`,
      `status=${response.status}`,
      message || 'empty response body',
    ].join(' | ');
    console.error('[supabase] request failed', {
      method: normalizedMethod,
      pathname,
      status: response.status,
      body,
      responseBody: message,
    });
    throw new Error(detail);
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
  state.booting = false;
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
function showLeaderboardScreen() {
  state.screen = 'leaderboard';
  audioManager.syncHomePlayback();
  render();
  loadLeaderboard();
}
async function startCreateFlow() {
  clearRuntimeMatchState();
  state.booting = false;
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
  state.booting = true;
  state.screen = 'boot';
  state.loading = false;
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
    state.booting = false;
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
      { slot: 'A', side: 'left', ...playerA, hp: Number(sharedPlayerA?.hp ?? 100), state: sharedPlayerA?.state || 'idle', animationState: createAnimationState(sharedPlayerA?.state || 'idle') },
      { slot: 'B', side: 'right', ...playerB, hp: Number(sharedPlayerB?.hp ?? 100), state: sharedPlayerB?.state || 'idle', animationState: createAnimationState(sharedPlayerB?.state || 'idle') },
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
    const fighterNode = document.querySelector(`[data-fighter="${index}"]`);
    const stateLabel = document.querySelector(`[data-fighter-state="${index}"]`);
    const previousHp = Number(fighterNode?.dataset.hp ?? fighter.hp);
    const hpDelta = fighter.hp - previousHp;
    if (fill) fill.style.setProperty('--hp', `${fighter.hp}%`);
    if (label) label.textContent = `HP ${fighter.hp} · ${fighter.slot === 'A' ? 'Player A' : 'Player B'}`;
    if (stateLabel) stateLabel.textContent = fighter.state || 'idle';
    if (fighterNode) fighterNode.dataset.hp = String(fighter.hp);
    if (hpDelta) triggerHpChangeEffect(index, hpDelta);
  });
  const turnLabel = document.querySelector('[data-turn-counter]');
  if (turnLabel) turnLabel.textContent = `Turno ${state.match.turn}`;
  const logPanel = document.getElementById('log-lines');
  if (logPanel) {
    const nextMarkup = state.logs.map((line, index) => `<p class="log-line log-entry-in" style="--log-delay:${Math.min(index, 3) * 26}ms"><span class="log-index">0${index + 1}</span>${line}</p>`).join('');
    if (logPanel.dataset.lastMarkup !== nextMarkup) {
      logPanel.innerHTML = nextMarkup;
      logPanel.dataset.lastMarkup = nextMarkup;
    }
  }
  if (state.screen === 'postmatch') triggerResultEffects();
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
  const playerA = state.match?.fighters?.find((fighter) => fighter.slot === 'A') || null;
  const fighter0 = state.match?.fighters?.[0] || null;
  const currentFighter = state.match?.fighters?.find((fighter) => fighter.id === state.me?.id) || null;
  const isOwner = Boolean(currentFighter?.slot === 'A' && playerA?.id && currentFighter.id === playerA.id);
  console.info('[leaderboard] write owner check', {
    currentPlayerId: state.me?.id || null,
    fighter0Id: fighter0?.id || null,
    playerAId: playerA?.id || null,
    currentSlot: currentFighter?.slot || null,
    passed: isOwner,
  });
  return isOwner;
}
async function updateLeaderboardForResult(winner, loser, draw = false) {
  if (!state.match) return false;
  const dayBucket = getCurrentLeaderboardDayBucket();
  const playerA = state.match.fighters.find((fighter) => fighter.slot === 'A') || null;
  const playerB = state.match.fighters.find((fighter) => fighter.slot === 'B') || null;
  const writeOwner = isLeaderboardWriteOwner();
  console.info('[leaderboard] update result start', {
    currentPlayerId: state.me?.id || null,
    fighter0Id: state.match.fighters?.[0]?.id || null,
    playerAId: playerA?.id || null,
    playerBId: playerB?.id || null,
    writeOwner,
    dayBucket,
    draw,
    winnerId: winner?.id || null,
    loserId: loser?.id || null,
  });
  if (!writeOwner) return false;
  try {
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
    const result = draw ? 'draw' : winner?.slot === 'A' ? 'A' : 'B';
    await updateGlobalRatingsForResult(playerA, playerB, result);
    await loadLeaderboard({ silent: state.screen !== 'leaderboard' });
    return true;
  } catch (error) {
    setLeaderboardRows('daily', []);
    setLeaderboardRows('rating', []);
    setLeaderboardStatus('daily', 'error');
    setLeaderboardStatus('rating', 'error');
    console.error('[leaderboard] update result failed', {
      currentPlayerId: state.me?.id || null,
      fighter0Id: state.match.fighters?.[0]?.id || null,
      playerAId: playerA?.id || null,
      playerBId: playerB?.id || null,
      writeOwner,
      dayBucket,
      draw,
      winnerId: winner?.id || null,
      loserId: loser?.id || null,
      error: error?.message || error,
    });
    render();
    return false;
  }
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
function bindReducedMotionPreference() {
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (!media) return;
  const syncPreference = () => {
    state.reducedMotion = media.matches;
  };
  syncPreference();
  if (typeof media.addEventListener === 'function') media.addEventListener('change', syncPreference);
  else if (typeof media.addListener === 'function') media.addListener(syncPreference);
}
function triggerTemporaryClass(target, className, duration = 260) {
  if (!target) return;
  target.classList.remove(className);
  void target.offsetWidth;
  target.classList.add(className);
  window.setTimeout(() => target.classList.remove(className), duration);
}
function triggerFighterEffect(index, className, duration = 260) {
  const fighterNode = document.querySelector(`[data-fighter="${index}"]`);
  if (!fighterNode) return;
  triggerTemporaryClass(fighterNode, className, duration);
}
function triggerActorCue(index, className, duration = COMBAT_EFFECT_DURATIONS.actor) {
  if (!Number.isInteger(index)) return;
  triggerFighterEffect(index, 'is-active-turn', duration);
  triggerTemporaryClass(document.querySelector(`[data-fighter-header="${index}"]`), 'badge-pop', COMBAT_EFFECT_DURATIONS.badge);
  triggerTemporaryClass(document.querySelector(`[data-fighter-state="${index}"]`), 'badge-pop', COMBAT_EFFECT_DURATIONS.badge);
  triggerTemporaryClass(document.querySelector('[data-turn-counter]'), 'badge-pop', COMBAT_EFFECT_DURATIONS.badge);
  if (className) triggerFighterEffect(index, className, duration);
}
function triggerHpChangeEffect(index, delta) {
  if (!Number.isInteger(index) || !delta) return;
  const className = delta < 0 ? 'hp-flash-damage' : 'hp-flash-heal';
  triggerFighterEffect(index, className, COMBAT_EFFECT_DURATIONS.hp);
  triggerTemporaryClass(document.querySelector(`[data-hp-wrap="${index}"]`), className, COMBAT_EFFECT_DURATIONS.hp);
}
function triggerResultEffects() {
  if (!state.match) return;
  const resultBanner = document.querySelector('.result-banner');
  if (resultBanner && resultBanner.dataset.revealed !== 'true') {
    resultBanner.dataset.revealed = 'true';
    triggerTemporaryClass(resultBanner, 'result-reveal', COMBAT_EFFECT_DURATIONS.result);
  }
  const finalLog = document.querySelector('#log-lines .log-line:first-child');
  if (finalLog && finalLog.dataset.finale !== 'true') {
    finalLog.dataset.finale = 'true';
    triggerTemporaryClass(finalLog, 'log-finale', COMBAT_EFFECT_DURATIONS.result);
  }
  state.match.fighters.forEach((fighter, index) => {
    if (!state.match.winner) return;
    const fighterNode = document.querySelector(`[data-fighter="${index}"]`);
    if (!fighterNode || fighterNode.dataset.outcomeFx === 'true') return;
    fighterNode.dataset.outcomeFx = 'true';
    if (fighter.id === state.match.winner.id) triggerFighterEffect(index, 'combat-victory', COMBAT_EFFECT_DURATIONS.victory);
    else triggerFighterEffect(index, 'combat-defeat', COMBAT_EFFECT_DURATIONS.defeat);
  });
}
function attachButtonJuice(root = document) {
  root.querySelectorAll('button').forEach((button) => {
    const release = () => {
      button.classList.remove('is-pressed');
      triggerTemporaryClass(button, 'is-pop', 230);
    };
    button.addEventListener('pointerdown', () => {
      button.classList.add('is-pressed');
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointerleave', () => button.classList.remove('is-pressed'));
    button.addEventListener('pointercancel', () => button.classList.remove('is-pressed'));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') button.classList.add('is-pressed');
    });
    button.addEventListener('keyup', (event) => {
      if (event.key === 'Enter' || event.key === ' ') release();
    });
    button.addEventListener('blur', () => button.classList.remove('is-pressed'));
  });
}
function setFighterState(index, animation) {
  if (!state.match || index == null || !animation) return;
  const fighter = state.match.fighters[index];
  if (fighter) fighter.state = animation;
}
function playFighterAnimation(index, animation) {
  if (!state.match || index == null || !animation) return;
  const fighter = state.match.fighters[index];
  if (!fighter) return;
  const normalizedAction = normalizeAnimationAction(animation);
  const isActionChange = fighter.animationState?.currentAction !== normalizedAction;
  setFighterState(index, normalizedAction);
  const selection = selectCreatureAnimationState(fighter, normalizedAction, { reroll: isActionChange });
  state.match.animators?.[index]?.play(selection.action, undefined, {
    variant: selection.variant,
    src: selection.asset,
    fallbackSrc: getActionFallbackAsset(selection.action),
    timingMultiplier: selection.timingMultiplier,
  });
}
function setAllFighterStates(animation) {
  if (!state.match || !animation) return;
  state.match.fighters.forEach((_, index) => setFighterState(index, animation));
}
function restoreMatchAnimators({ force = false } = {}) {
  if (!state.match?.animators?.length) return;
  state.match.animators.forEach((animator, index) => {
    const fighter = state.match.fighters[index];
    const fighterState = fighter?.state || 'idle';
    const selection = selectCreatureAnimationState(fighter, fighterState, { reroll: false });
    if (!force && animator.current?.stateName === fighterState && animator.current?.src === selection.asset) return;
    animator.play(selection.action, undefined, {
      variant: selection.variant,
      src: selection.asset,
      fallbackSrc: getActionFallbackAsset(selection.action),
      timingMultiplier: selection.timingMultiplier,
    });
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
        state.match.fighters.forEach((_, index) => playFighterAnimation(index, 'idle'));
      } else {
        playFighterAnimation(action.sourceIndex, action.animation);
        if (action.targetAnimation) playFighterAnimation(action.targetIndex, action.targetAnimation);
        if (Number.isInteger(action.sourceIndex)) {
          const sourceClass = action.animation === 'attack'
            ? 'combat-pop'
            : action.animation === 'backfire'
              ? 'combat-backfire'
              : action.animation === 'recharge'
                ? 'combat-charge'
                : action.animation === 'victory'
                  ? 'combat-victory'
                  : 'is-acting';
          const sourceDuration = action.animation === 'backfire'
            ? COMBAT_EFFECT_DURATIONS.backfire
            : action.animation === 'recharge'
              ? COMBAT_EFFECT_DURATIONS.charge
              : action.animation === 'victory'
                ? COMBAT_EFFECT_DURATIONS.victory
                : COMBAT_EFFECT_DURATIONS.attack;
          triggerActorCue(action.sourceIndex, sourceClass, sourceDuration);
        }
        if (Number.isInteger(action.targetIndex) && ['hit', 'defeat'].includes(action.targetAnimation || action.animation)) {
          const isDefeat = (action.targetAnimation || action.animation) === 'defeat';
          triggerActorCue(
            action.targetIndex,
            isDefeat ? 'combat-defeat' : 'combat-hit',
            isDefeat ? COMBAT_EFFECT_DURATIONS.defeat : COMBAT_EFFECT_DURATIONS.hit,
          );
        }
      }
      updateMatchUI();
    }, startAt);
    if (action.sound) {
      schedule(() => audioManager.playSfx(action.sound), startAt + (action.soundDelay ?? 0));
    }
    if (action.apply) {
      schedule(() => {
        action.apply();
        if (Number.isInteger(action.targetIndex)) triggerFighterEffect(action.targetIndex, 'has-state-pop', 280);
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
  restoreMatchAnimators({ force: true });
  syncSharedMatchResult();
}

function renderAnimatedPreview(label = '', variantIndex = state.me?.variantIndex) {
  return `
    <div class="goblin-frame sprite-render sprite-render-home" data-home-animator="${label}" data-variant-index="${variantIndex ?? ''}">
      <canvas class="sprite-canvas" aria-hidden="true"></canvas>
      <div class="sprite-fallback" hidden></div>
    </div>`;
}

function renderStatusCard(title, body, { showHomeButton = true } = {}) {
  return `
    <section class="panel status-card world-card screen-panel">
      <div class="section-heading">
        <span class="section-kicker">Arena sync</span>
        <h1 class="screen-title">${title}</h1>
      </div>
      <p class="muted">${body}</p>
      ${showHomeButton ? '<div class="footer-actions"><button id="status-home" class="btn-primary btn-bounce">Home</button></div>' : ''}
    </section>`;
}

function renderHome() {
  const isChallengerView = state.homeView === 'challenger' && state.pendingMatch?.payload?.playerA?.id === state.me.id;
  const challengerStatus = state.pendingMatch?.opponentJoined
    ? 'Avversario trovato: il match partirà da solo.'
    : 'In attesa che il player B apra il link.';
  const liveItems = [
    { label: 'Live arenas', value: state.pendingMatch?.opponentJoined ? '01' : '03', meta: state.pendingMatch?.opponentJoined ? 'Una lobby pronta a scoppiare.' : 'Goblin in cerca di sfidanti.' },
    { label: 'Recent winner', value: 'Bogbelch', meta: 'Ha chiuso un fight in 52 sec.' },
    { label: 'Fresh lobby', value: 'Share link', meta: 'Crea un match e mandalo in 1 tap.' },
  ];
  const leaderboardPreview = (state.leaderboard.rating?.length ? state.leaderboard.rating : state.leaderboard.daily).slice(0, 3);
  const challengePanel = isChallengerView ? `
    <div class="world-card challenge-card challenge-card-active card-lift">
      <div class="section-heading compact">
        <span class="section-kicker">Lobby live</span>
        <h3>Challenge link pronto</h3>
      </div>
      <p class="muted">Sei il challenger: la lobby resta agganciata a questa home finché il player B non entra.</p>
      <div class="link-box">
        <code title="${state.pendingMatch.link}" aria-label="Generated match link">${state.pendingMatch.link}</code>
        <button id="copy-link" class="btn-primary btn-bounce">Copia link</button>
      </div>
      <div class="copy-feedback" aria-live="polite">${state.copyFeedback}</div>
      <p class="muted">${challengerStatus}</p>
      <div class="status-chip-row">
        <span class="status-chip chip-bounce" data-live="true">${state.pendingMatch.payload.status === 'active' ? 'Match active' : 'Waiting join'}</span>
        <span class="status-chip chip-bounce">Player B · ${state.pendingMatch.payload.playerB?.name || 'Not connected'}</span>
      </div>
    </div>` : state.pendingMatch ? `
    <div class="world-card challenge-card card-lift">
      <div class="section-heading compact">
        <span class="section-kicker">Share challenge</span>
        <h3>Link pronto per lo scontro</h3>
      </div>
      <p class="muted">Crea il match senza lasciare la home, poi manda il link al player B.</p>
      <div class="link-box">
        <code title="${state.pendingMatch.link}" aria-label="Generated match link">${state.pendingMatch.link}</code>
        <button id="copy-link" class="btn-primary btn-bounce">Copia link</button>
      </div>
      <div class="copy-feedback" aria-live="polite">${state.copyFeedback}</div>
      <p class="muted">${state.pendingMatch.opponentJoined ? 'Avversario trovato: il match partirà da solo.' : 'In attesa che il player B apra il link.'}</p>
    </div>` : `
    <div class="hero-cta-block cta-alive card-lift">
      <div class="inline-actions hero-actions">
        <button class="btn-primary hero-cta btn-bounce" id="home-create">Create match</button>
      </div>
      <p class="cta-note">Create a link, send it, fight live. Average match: ~45–60 sec.</p>
      <div class="how-it-works" aria-label="How it works">
        <div class="flow-chip chip-bounce"><span>1</span>Create match</div>
        <div class="flow-chip chip-bounce"><span>2</span>Share link</div>
        <div class="flow-chip chip-bounce"><span>3</span>Fight live</div>
      </div>
    </div>`;

  return `
    <section class="home-layout screen-panel">
      <section class="panel hero hero-redesign world-card main-showcase" style="--home-world-image:url('${HOME_WORLD_BACKGROUND}')">
        <div class="hero-atmosphere" aria-hidden="true">
          <span class="world-wash"></span>
          <span class="mist mist-a"></span>
          <span class="mist mist-b"></span>
          <span class="spark spark-a"></span>
          <span class="spark spark-b"></span>
        </div>
        <div class="hero-copy">
          <div class="hero-badges">
            <span class="badge badge-live chip-bounce">Live arena</span>
            <span class="badge chip-bounce">2-player chaos</span>
            <span class="badge chip-bounce">Storybook arcade</span>
          </div>
          <h1>Fast goblin duels in a bright little cartoon world.</h1>
          <p class="hero-lead">The big intro banner is gone, so the main arena hub now carries the mood: playful creature battles, cheerful village energy, and readable chaos in under a minute.</p>
          <div class="hero-meta">
            <div class="meta-pill card-lift"><strong>Avg match</strong><span>45–60 sec</span></div>
            <div class="meta-pill card-lift"><strong>Mode</strong><span>Share link multiplayer</span></div>
            <div class="meta-pill card-lift"><strong>Mood</strong><span>Green cartoon mischief</span></div>
          </div>
          ${challengePanel}
        </div>
        <aside class="featured-fighter world-card card-lift">
          <div class="section-heading compact">
            <span class="section-kicker">Featured fighter</span>
            <h3>${state.me.name}</h3>
          </div>
          <div class="fighter-showcase idle-float">
            ${renderAnimatedPreview('home', state.me.variantIndex)}
          </div>
          <div class="fighter-tags">
            <span class="status-chip chip-bounce">Class · Bog goblin</span>
            <span class="status-chip chip-bounce">Trait · Chaotic stink</span>
          </div>
          <p class="subtext">Small, loud, unpredictable. Built for ridiculous live duels.</p>
          ${isChallengerView ? `<div class="subtext">Match ID: ${state.pendingMatch.payload.id}</div>` : ''}
        </aside>
      </section>

      <section class="home-subgrid">
        <section class="panel world-card live-activity">
          <div class="section-heading compact">
            <span class="section-kicker">World activity</span>
            <h2 class="section-title">The arena feels alive</h2>
          </div>
          <div class="activity-list list-stagger">
            ${liveItems.map((item) => `
              <article class="activity-item card-lift">
                <div class="activity-value">${item.value}</div>
                <div>
                  <strong>${item.label}</strong>
                  <p class="muted">${item.meta}</p>
                </div>
              </article>`).join('')}
          </div>
        </section>

        <section class="panel world-card leaderboard-preview">
          <div class="section-heading compact">
            <span class="section-kicker">Leaderboard preview</span>
            <h2 class="section-title">Top troublemakers</h2>
          </div>
          <div class="preview-list list-stagger">
            ${leaderboardPreview.length ? leaderboardPreview.map((row, index) => `
              <article class="preview-entry card-lift">
                <div class="preview-rank">#${index + 1}</div>
                <div class="preview-main">
                  <strong>${row.name}</strong>
                  <span>${row.wins}W · ${row.losses}L · ${row.draws}D</span>
                </div>
                <div class="preview-score">${row.rating || row.wins}</div>
              </article>`).join('') : '<div class="leaderboard-empty">Leaderboard pronta a popolarsi dopo i primi match.</div>'}
          </div>
          <div class="footer-actions align-start">
            <button class="ghost btn-ghost btn-bounce" id="home-leaderboard">Open leaderboard</button>
          </div>
        </section>
      </section>
    </section>`;
}
function renderCreate() {
  return `
    <section class="panel screen-panel">
      <h1 class="screen-title">Crea match</h1>
      <p class="muted">Copia e invia questo link all’avversario. Il match condiviso rimane in attesa sul backend finché l’avversario non entra.</p>
      <div class="link-box">
        <code title="${state.pendingMatch.link}" aria-label="Generated match link">${state.pendingMatch.link}</code>
        <button id="copy-link" class="btn-bounce">Copia link</button>
      </div>
      <div class="copy-feedback" aria-live="polite">${state.copyFeedback}</div>
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
      animationState: fighter.animationState || createAnimationState(sharedAnimationState || fighter.state || 'idle'),
    };
  });
  if (progress.winner) state.match.winner = progress.winner;
  if (progress.finished) state.match.finished = true;
}

function renderJoin() {
  const playerB = state.pendingMatch.payload.playerB;
  return `
    <section class="panel hero hero-redesign world-card join-screen screen-panel">
      <div>
        <div class="section-heading compact">
          <span class="section-kicker">Lobby accepted</span>
          <h1 class="screen-title">Avversario trovato</h1>
        </div>
        <p class="muted">Sei il player B. I goblin stanno entrando nell’arena…</p>
        <div class="info-card world-card card-lift">
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
    <section class="panel match-layout world-card screen-panel">
      <div class="match-head">
        <div class="match-meta">
          <div class="section-heading compact">
            <span class="section-kicker">Live arena</span>
            <h1 class="screen-title">${isPost ? 'Risultato match' : 'Match'}</h1>
          </div>
          <div class="match-status-cluster">
            <span class="status-chip chip-bounce" data-turn-counter>Turno ${state.match.turn}</span>
            <span class="status-chip chip-bounce" data-live="true">${isPost ? 'Fight ended' : 'Fight in progress'}</span>
          </div>
        </div>
        ${isPost ? `<div class="result-banner"><strong>${result}</strong>${state.match.winner ? '' : 'Entrambi sopravvivono al fetore conclusivo.'}</div>` : ''}
      </div>
      <div class="arena-shell">
        <section class="arena world-card">
          <div class="arena-background" aria-hidden="true" style="--arena-image:url('${ARENA_BACKGROUND}')"></div>
          <div class="arena-floor" aria-hidden="true"></div>
          ${state.match.fighters.map((fighter, index) => `
            <article class="fighter fighter-${fighter.side}" data-fighter="${index}" data-hp="${fighter.hp}">
              <div class="fighter-header ${fighter.side === 'left' ? 'align-left' : 'align-right'}" data-fighter-header="${index}">
                <div class="fighter-label-row">
                  <span class="fighter-side">${fighter.slot === 'A' ? 'Player A' : 'Player B'}</span>
                  <span class="fighter-state" data-fighter-state="${index}">${fighter.state || 'idle'}</span>
                </div>
                <div class="nameplate">${fighter.name}</div>
                <div class="subtext" data-hp-label="${index}">HP ${fighter.hp} · arena ready</div>
              </div>
              <div class="fighter-slot">
                <div class="fighter-transform-positioner">
                  <div class="sprite-render" data-animator="${index}">
                    <canvas class="sprite-canvas" aria-hidden="true"></canvas>
                    <div class="sprite-fallback" hidden></div>
                  </div>
                </div>
              </div>
              <div class="health-bar" data-hp-wrap="${index}"><div class="health-fill" data-hp="${index}" style="--hp:${fighter.hp}%"></div></div>
            </article>`).join('')}
        </section>
      </div>
      <div class="battle-log-wrap">
        <div class="log-panel world-card">
          <div class="log-head-row">
            <p class="log-heading">Battle log</p>
            <span class="status-chip" data-live="true">Live feed</span>
          </div>
          <div id="log-lines" class="list-stagger">
            ${state.logs.map((line, index) => `<p class="log-line log-entry-in" style="--log-delay:${Math.min(index, 3) * 26}ms"><span class="log-index">0${index + 1}</span>${line}</p>`).join('')}
          </div>
        </div>
        ${isPost ? `<div class="footer-actions"><button id="post-home" class="btn-primary btn-bounce">Home</button><button class="ghost btn-ghost btn-bounce" id="post-leaderboard">Leaderboard</button></div>` : ''}
      </div>
    </section>`;
}
function renderLeaderboardRows(rows, type) {
  return rows.map((row, index) => {
    const rank = index + 1;
    const isTopThree = rank <= 3;
    const badge = rank === 1 ? 'Crown' : rank === 2 ? 'Silver' : rank === 3 ? 'Bronze' : null;
    const primaryValue = type === 'rating'
      ? `<div class="leaderboard-score">${row.rating}<span>rating</span></div>`
      : `<div class="leaderboard-score">${row.wins}<span>wins</span></div>`;
    return `<article class="leaderboard-entry card-lift ${isTopThree ? `podium podium-${rank}` : ''}">
      <div class="leaderboard-rank-wrap">
        <div class="leaderboard-rank">#${rank}</div>
        ${badge ? `<div class="leaderboard-badge">${badge}</div>` : ''}
      </div>
      <div class="leaderboard-main">
        <div class="leaderboard-name">${row.name}</div>
        <div class="leaderboard-stats">
          <span>W ${row.wins}</span><span>L ${row.losses}</span><span>D ${row.draws}</span><span>${row.matchesPlayed} match</span><span>${row.winRate}% WR</span>
        </div>
      </div>
      ${primaryValue}
    </article>`;
  }).join('');
}
function renderLeaderboardSection(title, description, rows, status, type) {
  const message = status === 'loading'
    ? 'Caricamento…'
    : status === 'error'
      ? 'Impossibile caricare questa classifica.'
      : 'Nessun risultato disponibile.';
  return `<section class="leaderboard-section leaderboard-section-${type} world-card card-lift">
    <div class="leaderboard-section-head">
      <div>
        <p class="leaderboard-kicker">${type === 'daily' ? 'Daily board' : 'Global ladder'}</p>
        <h2>${title}</h2>
      </div>
      <p class="muted">${description}</p>
    </div>
    <div class="leaderboard-list list-stagger">
      ${rows.length ? renderLeaderboardRows(rows, type) : `<div class="leaderboard-empty">${message}</div>`}
    </div>
  </section>`;
}
function renderLeaderboard() {
  return `
    <section class="panel leaderboard-layout world-card screen-panel">
      <div class="leaderboard-header">
        <div class="section-heading">
          <span class="section-kicker">Hall of troublemakers</span>
          <h1 class="screen-title">Leaderboard</h1>
          <p class="muted">Progressi giornalieri separati dalla classifica Elo globale.</p>
        </div>
        <div class="leaderboard-top-meta">
          <div class="badge badge-live chip-bounce" data-live="true">UTC daily bucket</div>
          <div class="badge chip-bounce">Live sync</div>
        </div>
      </div>
      <div class="leaderboard-columns">
        ${renderLeaderboardSection('Daily leaderboard', `Risultati del giorno (${LEADERBOARD_DAY_TIMEZONE}).`, state.leaderboard.daily, state.leaderboardStatus.daily, 'daily')}
        ${renderLeaderboardSection('Global rating leaderboard', 'Rating persistente con Elo iniziale 1000.', state.leaderboard.rating, state.leaderboardStatus.rating, 'rating')}
      </div>
    </section>`;
}
function render() {
  if (state.screen === 'home') audioManager.initializeForHome();
  state.previewAnimators.forEach((animator) => animator.stop());
  state.previewAnimators = [];
  const app = document.getElementById('app');
  app.innerHTML = `
    <main class="app-shell">
      <nav class="topbar world-card">
        <div class="brand-pill">
          <span class="brand-mark">FF</span>
          <div>
            <strong>Fart & Furious</strong>
            <small>Lite arena</small>
          </div>
        </div>
        <div class="topbar-nav">
          <button class="nav-pill btn-bounce ${state.screen === 'home' ? 'is-active' : ''}" id="nav-home">Home</button>
          ${state.screen === 'home' || state.screen === 'boot' ? '' : '<button class="nav-pill nav-pill-accent btn-bounce" id="nav-create">Crea nuovo match</button>'}
          <button class="nav-pill btn-bounce ${state.screen === 'leaderboard' ? 'is-active' : ''}" id="nav-leaderboard">Leaderboard</button>
        </div>
        <div class="audio-controls" aria-label="Audio controls">
          <button class="ghost audio-toggle nav-pill btn-bounce" id="audio-toggle">${audioManager.preferences.muted || audioManager.preferences.volume === 0 ? '🔇' : '🔊'}</button>
          <label class="audio-slider-wrap" for="audio-volume">
            <span>Vol</span>
            <input id="audio-volume" type="range" min="0" max="100" value="${Math.round(audioManager.preferences.volume * 100)}" />
          </label>
        </div>
      </nav>
      ${state.loading ? renderStatusCard('Connessione al match condiviso', 'Sto sincronizzando il match Lite con il backend condiviso…') : ''}
      ${state.screen === 'boot' ? renderStatusCard('Apro il match condiviso', 'Sto risolvendo il link condiviso prima di mostrare la lobby o il match…', { showHomeButton: false }) : ''}
      ${state.screen === 'home' ? renderHome() : ''}
      ${state.screen === 'create' ? renderCreate() : ''}
      ${state.screen === 'join' ? renderJoin() : ''}
      ${state.screen === 'match' || state.screen === 'postmatch' ? renderMatchOrPost() : ''}
      ${state.screen === 'leaderboard' ? renderLeaderboard() : ''}
      ${state.screen === 'error' ? renderStatusCard('Problema match condiviso', state.errorMessage) : ''}
    </main>`;

  document.getElementById('nav-home')?.addEventListener('click', resetToHome);
  document.getElementById('home-leaderboard')?.addEventListener('click', showLeaderboardScreen);
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
  document.getElementById('nav-leaderboard')?.addEventListener('click', showLeaderboardScreen);
  document.getElementById('copy-link')?.addEventListener('click', async () => {
    const copyButton = document.getElementById('copy-link');
    try {
      await navigator.clipboard.writeText(state.pendingMatch.link);
      state.copyFeedback = 'Link copied!';
      copyButton?.classList.add('copy-success');
      triggerTemporaryClass(copyButton, 'is-pop', 230);
      logLine('Link copiato negli appunti.');
    } catch {
      state.copyFeedback = 'Copy unavailable — use manual copy.';
      logLine('Copia manuale necessaria: il browser non permette gli appunti.');
    }
    const feedbackNode = document.querySelector('.copy-feedback');
    if (feedbackNode) feedbackNode.textContent = state.copyFeedback;
    window.setTimeout(() => {
      state.copyFeedback = '';
      copyButton?.classList.remove('copy-success');
      const nextFeedbackNode = document.querySelector('.copy-feedback');
      if (nextFeedbackNode) nextFeedbackNode.textContent = '';
    }, 1500);
  });
  document.getElementById('post-home')?.addEventListener('click', resetToHome);
  document.getElementById('post-leaderboard')?.addEventListener('click', showLeaderboardScreen);

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
    const canReuse = previous.length === nodes.length;
    preloadBattleAnimationAssets();
    state.match.animators = nodes.map((node, index) => {
      const existing = canReuse ? previous[index] : null;
      if (existing) {
        existing.stop();
      }
      return new SpriteSheetAnimator(node, {
      flip: state.match.fighters[index].side === 'left' ? -1 : 1,
      variant: state.match.fighters[index].variant,
    });
    });
    previous.forEach((animator, index) => { if (!canReuse || !state.match.animators[index]) animator.stop(); });
    restoreMatchAnimators({ force: true });
  }

  attachButtonJuice(app);
  refreshAudioControlsUI();
}

bindReducedMotionPreference();
audioManager.initializeForHome();

const joinMatchId = parseJoinMatchId();
if (joinMatchId) {
  state.screen = 'boot';
  state.booting = true;
  render();
  startJoinedFlow(joinMatchId);
} else {
  render();
}
