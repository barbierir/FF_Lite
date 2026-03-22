const STORAGE_KEYS = {
  localProfile: 'ff-lite-local-profile-v2',
  playerProfile: 'ff-lite-player-profile',
  audioPreferences: 'ff-lite-audio-preferences',
};
const LOCAL_PROFILE_SCHEMA_VERSION = 2;
const LEGACY_GOBLIN_STORAGE_KEYS = Object.freeze([
  STORAGE_KEYS.playerProfile,
  'ff-lite-selected-creature',
  'ff-lite-creature-cache',
  'ff-lite-featured-creature',
  'ff-lite-featured-fighter',
  'ff-lite-profile',
]);

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
    attack_1: { kind: 'synth', preset: 'attack', variant: 1, volume: 0.84, cooldown: 110 },
    attack_2: { kind: 'synth', preset: 'attack', variant: 2, volume: 0.8, cooldown: 110 },
    attack_3: { kind: 'synth', preset: 'attack', variant: 3, volume: 0.82, cooldown: 110 },
    charge_1: { kind: 'synth', preset: 'charge', variant: 1, volume: 0.68, cooldown: 140 },
    charge_2: { kind: 'synth', preset: 'charge', variant: 2, volume: 0.7, cooldown: 140 },
    charge_3: { kind: 'synth', preset: 'charge', variant: 3, volume: 0.72, cooldown: 140 },
    backfire_1: { kind: 'synth', preset: 'backfire', variant: 1, volume: 0.8, cooldown: 180 },
    backfire_2: { kind: 'synth', preset: 'backfire', variant: 2, volume: 0.82, cooldown: 180 },
    hit_1: { kind: 'synth', preset: 'hit', variant: 1, volume: 0.7, cooldown: 100 },
    hit_2: { kind: 'synth', preset: 'hit', variant: 2, volume: 0.74, cooldown: 100 },
    victory: { kind: 'synth', preset: 'victory', volume: 0.8, cooldown: 300 },
    defeat: { kind: 'synth', preset: 'defeat', volume: 0.66, cooldown: 300 },
    matchStart: { kind: 'synth', preset: 'matchStart', volume: 0.56, cooldown: 220 },
    resultReveal: { kind: 'synth', preset: 'resultReveal', volume: 0.58, cooldown: 280 },
    uiConfirm: { kind: 'synth', preset: 'uiConfirm', volume: 0.32, cooldown: 120 },
    uiTab: { kind: 'synth', preset: 'uiTab', volume: 0.24, cooldown: 90 },
    uiLeaderboard: { kind: 'synth', preset: 'uiLeaderboard', volume: 0.26, cooldown: 120 },
    uiCopy: { kind: 'synth', preset: 'uiCopy', volume: 0.3, cooldown: 120 },
    uiToggle: { kind: 'synth', preset: 'uiToggle', volume: 0.22, cooldown: 90 },
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
const NAME_PREFIXES = ['Stink', 'Bog', 'Snort', 'Muck', 'Grim', 'Snot', 'Burp', 'Fizzle', 'Crust', 'Toad', 'Grub', 'Whiff', 'Boggle', 'Nettle', 'Clod', 'Gloom', 'Puff', 'Skunk', 'Blort', 'Scum', 'Grot', 'Wobble', 'Nub', 'Smog', 'Bungle', 'Rumble'];
const NAME_MIDDLES = ['', '', '', 'ble', 'snort', 'muck', 'whiz', 'grub', 'bel', 'crum', 'bog', 'toot', 'nib', 'whiff', 'gunk', 'wob'];
const NAME_SUFFIXES = ['nibbler', 'belch', 'toes', 'whiff', 'sniffer', 'rump', 'fizzle', 'gob', 'blast', 'morsel', 'boggle', 'snout', 'munch', 'belly', 'gristle', 'wiggle', 'snork', 'whistle', 'crumble', 'snuffle', 'tumble', 'guzzle', 'burble', 'waddle'];
const SHARED_BACKEND_CONFIG = window.FF_LITE_CONFIG || {};
const POLL_INTERVAL_MS = 2000;
const MAX_BATTLE_LOG_ENTRIES = 24;
const LEADERBOARD_DAY_TIMEZONE = 'UTC';
const LEADERBOARD_PAGE_SIZE = 15;
const LOG_EVENT_META = {
  attack: { icon: '⚔', label: 'Attack', className: 'is-attack', tone: 'Attack' },
  hit: { icon: '💥', label: 'Hit', className: 'is-hit', tone: 'Hit' },
  backfire: { icon: '⟲', label: 'Backfire', className: 'is-backfire', tone: 'Backfire' },
  charge: { icon: '✦', label: 'Recharge', className: 'is-recharge', tone: 'Recharge' },
  victory: { icon: '★', label: 'Victory', className: 'is-victory', tone: 'Victory' },
  defeat: { icon: '☠', label: 'Defeat', className: 'is-defeat', tone: 'Defeat' },
  neutral: { icon: '•', label: 'System', className: 'is-system', tone: 'System' },
};
const INITIAL_RATING = 1000;
const CREATURE_BONUS_POINT_CAP = 100;
const CREATURE_BONUS_SCALE_MAX = 1000;
const CREATURE_COMBAT_BONUS_KEYS = Object.freeze([
  'backfireReduction',
  'specialTriggerBonus',
  'negativeEffectResistance',
  'favorableActionBonus',
]);
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
  charge: 0,
  attack: 1000,
  hit: 0,
  backfire: 1050,
  victory: 0,
  defeat: 0,
  matchStart: 0,
  resultReveal: 0,
};
const SOUND_VARIATION_MAP = {
  attack: ['attack_1', 'attack_2', 'attack_3'],
  charge: ['charge_1', 'charge_2', 'charge_3'],
  hit: ['hit_1', 'hit_2'],
  backfire: ['backfire_1', 'backfire_2'],
  victory: ['victory'],
  defeat: ['defeat'],
  matchStart: ['matchStart'],
  resultReveal: ['resultReveal'],
  uiConfirm: ['uiConfirm'],
  uiTab: ['uiTab'],
  uiLeaderboard: ['uiLeaderboard'],
  uiCopy: ['uiCopy'],
  uiToggle: ['uiToggle'],
};
const UI_SOUND_MAP = {
  createMatch: 'uiConfirm',
  copySuccess: 'uiCopy',
  navTab: 'uiTab',
  leaderboardOpen: 'uiLeaderboard',
  audioToggle: 'uiToggle',
};
const BATTLE_SOUND_MAP = {
  charge: 'charge',
  attack: 'attack',
  hit: 'hit',
  backfire: 'backfire',
};
const RESULT_SOUND_MAP = {
  intro: 'matchStart',
  reveal: 'resultReveal',
  victory: 'victory',
  defeat: 'defeat',
};
const SYNTH_PRESET_FACTORIES = {
  attack: (variant = 1) => ({
    duration: 0.16 + variant * 0.01,
    layers: [
      { type: 'osc', wave: 'triangle', startFreq: 240 - variant * 12, endFreq: 120 - variant * 8, gain: 0.7, attack: 0.002, decay: 0.14 },
      { type: 'osc', wave: 'square', startFreq: 110 + variant * 18, endFreq: 80, gain: 0.18, attack: 0.001, decay: 0.1 },
      { type: 'noise', gain: 0.18, attack: 0.001, decay: 0.05, bandpass: 900 + variant * 120, q: 0.9 },
    ],
  }),
  charge: (variant = 1) => ({
    duration: 0.2 + variant * 0.015,
    layers: [
      { type: 'osc', wave: 'sine', startFreq: 280 + variant * 30, endFreq: 520 + variant * 40, gain: 0.34, attack: 0.012, decay: 0.18 },
      { type: 'osc', wave: 'triangle', startFreq: 410 + variant * 24, endFreq: 660 + variant * 42, gain: 0.22, attack: 0.008, decay: 0.16 },
    ],
  }),
  backfire: (variant = 1) => ({
    duration: 0.2 + variant * 0.02,
    layers: [
      { type: 'osc', wave: 'square', startFreq: 230 + variant * 12, endFreq: 95, gain: 0.32, attack: 0.001, decay: 0.18 },
      { type: 'osc', wave: 'triangle', startFreq: 160, endFreq: 70, gain: 0.28, attack: 0.001, decay: 0.2 },
      { type: 'noise', gain: 0.22, attack: 0.001, decay: 0.08, lowpass: 1000 + variant * 120 },
    ],
  }),
  hit: (variant = 1) => ({
    duration: 0.12 + variant * 0.015,
    layers: [
      { type: 'noise', gain: 0.22, attack: 0.001, decay: 0.04, bandpass: 720 + variant * 110, q: 1.2 },
      { type: 'osc', wave: 'triangle', startFreq: 180 - variant * 10, endFreq: 90, gain: 0.42, attack: 0.001, decay: 0.08 },
    ],
  }),
  victory: () => ({
    duration: 0.34,
    layers: [
      { type: 'osc', wave: 'triangle', startFreq: 392, endFreq: 392, gain: 0.2, attack: 0.01, decay: 0.28, startAt: 0 },
      { type: 'osc', wave: 'triangle', startFreq: 494, endFreq: 494, gain: 0.2, attack: 0.01, decay: 0.28, startAt: 0.035 },
      { type: 'osc', wave: 'triangle', startFreq: 587, endFreq: 587, gain: 0.22, attack: 0.01, decay: 0.28, startAt: 0.07 },
    ],
  }),
  defeat: () => ({
    duration: 0.26,
    layers: [
      { type: 'osc', wave: 'sawtooth', startFreq: 260, endFreq: 150, gain: 0.18, attack: 0.004, decay: 0.22 },
      { type: 'osc', wave: 'triangle', startFreq: 180, endFreq: 95, gain: 0.16, attack: 0.004, decay: 0.24 },
    ],
  }),
  matchStart: () => ({
    duration: 0.18,
    layers: [
      { type: 'osc', wave: 'sine', startFreq: 330, endFreq: 360, gain: 0.18, attack: 0.008, decay: 0.15 },
      { type: 'osc', wave: 'triangle', startFreq: 440, endFreq: 480, gain: 0.16, attack: 0.008, decay: 0.15 },
    ],
  }),
  resultReveal: () => ({
    duration: 0.16,
    layers: [
      { type: 'osc', wave: 'triangle', startFreq: 390, endFreq: 430, gain: 0.16, attack: 0.006, decay: 0.14 },
      { type: 'osc', wave: 'triangle', startFreq: 520, endFreq: 560, gain: 0.16, attack: 0.006, decay: 0.14 },
      { type: 'osc', wave: 'triangle', startFreq: 650, endFreq: 690, gain: 0.15, attack: 0.006, decay: 0.14 },
    ],
  }),
  uiConfirm: () => ({
    duration: 0.09,
    layers: [
      { type: 'osc', wave: 'triangle', startFreq: 620, endFreq: 560, gain: 0.18, attack: 0.001, decay: 0.08 },
    ],
  }),
  uiTab: () => ({
    duration: 0.07,
    layers: [
      { type: 'osc', wave: 'triangle', startFreq: 520, endFreq: 480, gain: 0.14, attack: 0.001, decay: 0.06 },
    ],
  }),
  uiLeaderboard: () => ({
    duration: 0.11,
    layers: [
      { type: 'osc', wave: 'sine', startFreq: 540, endFreq: 560, gain: 0.12, attack: 0.002, decay: 0.1 },
      { type: 'osc', wave: 'triangle', startFreq: 680, endFreq: 700, gain: 0.1, attack: 0.002, decay: 0.1 },
    ],
  }),
  uiCopy: () => ({
    duration: 0.1,
    layers: [
      { type: 'osc', wave: 'triangle', startFreq: 660, endFreq: 700, gain: 0.12, attack: 0.001, decay: 0.08 },
      { type: 'osc', wave: 'sine', startFreq: 880, endFreq: 930, gain: 0.1, attack: 0.001, decay: 0.08 },
    ],
  }),
  uiToggle: () => ({
    duration: 0.08,
    layers: [
      { type: 'osc', wave: 'triangle', startFreq: 460, endFreq: 420, gain: 0.12, attack: 0.001, decay: 0.06 },
    ],
  }),
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
const FEATURED_FIGHTER_TRANSITION_MS = 160;

const state = {
  screen: 'home',
  me: loadLocalPlayer(),
  pendingMatch: null,
  match: null,
  logs: [],
  leaderboard: { daily: [], rating: [] },
  leaderboardStatus: { daily: 'idle', rating: 'idle' },
  leaderboardPage: { daily: 1, rating: 1 },
  previewAnimators: [],
  currentCandidateCreature: null,
  selectedCreature: null,
  featuredPreviewAnimator: null,
  pendingStartTimer: null,
  pendingStartTimerMatchId: null,
  activeMatchSubscription: null,
  homeView: 'default',
  loading: false,
  booting: false,
  errorMessage: '',
  copyFeedback: '',
  resultApplyFeedback: '',
  appliedMatchResultIds: {},
  reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false,
  featuredFighterTransitionTimer: null,
  featuredFighterTransitionToken: 0,
  featuredFighterTransitioning: false,
  activeMatchRunId: 0,
};
state.selectedCreature = { ...state.me, animation: createCandidateAnimationConfig(state.me.seed || state.me.id) };

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
    visualAction: currentAction,
    lockUntil: 0,
    persistentAction: null,
    lastRequestedAction: currentAction,
    lastRequestSource: 'init',
  };
}
function serializeAnimationLock(lockUntil) {
  return Number.isFinite(lockUntil) ? Number(lockUntil) : 'infinity';
}
function deserializeAnimationLock(lockUntil, fallback = 0) {
  if (lockUntil === 'infinity') return Number.POSITIVE_INFINITY;
  const parsed = Number(lockUntil);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function hydrateFighterAnimationState(sharedFighter, previousFighter, fallbackAction = 'idle') {
  const previousState = previousFighter?.animationState || null;
  const baseAction = normalizeAnimationAction(fallbackAction);
  const animationState = previousState
    ? {
      ...previousState,
      lastVariantByAction: { ...(previousState.lastVariantByAction || {}) },
    }
    : createAnimationState(baseAction);
  const resolvedVisualAction = normalizeAnimationAction(sharedFighter?.resolvedVisualAction || sharedFighter?.visualAction || animationState.visualAction || baseAction);
  const persistentAction = sharedFighter?.persistentAction
    ? normalizeAnimationAction(sharedFighter.persistentAction)
    : (previousState?.persistentAction ? normalizeAnimationAction(previousState.persistentAction) : null);
  const fallbackLock = previousState?.lockUntil ?? 0;
  const lockUntil = deserializeAnimationLock(sharedFighter?.lockUntil, fallbackLock);
  animationState.visualAction = persistentAction || resolvedVisualAction || baseAction;
  animationState.persistentAction = persistentAction;
  animationState.lockUntil = persistentAction ? Number.POSITIVE_INFINITY : lockUntil;
  animationState.lastRequestedAction = normalizeAnimationAction(sharedFighter?.lastRequestedAction || animationState.lastRequestedAction || animationState.visualAction);
  animationState.lastRequestSource = sharedFighter?.lastRequestSource || animationState.lastRequestSource || 'hydrate';
  console.info('[match] animation restored', {
    source: 'hydrateFighterAnimationState',
    fighterId: sharedFighter?.id || previousFighter?.id || null,
    slot: sharedFighter?.slot || previousFighter?.slot || null,
    fallbackAction: baseAction,
    resolvedVisualAction,
    persistentAction: animationState.persistentAction,
    lockUntil: animationState.lockUntil,
    previousVisualAction: previousState?.visualAction || null,
    previousPersistentAction: previousState?.persistentAction || null,
  });
  if (!animationState.currentAsset) {
    animationState.currentAsset = getActionAsset(animationState.visualAction || baseAction, 1);
  }
  return animationState;
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

function safeLocalStorageSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('[storage] setItem failed', { key, error: error?.message || error });
    return false;
  }
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
    this.lastVariantByGroup = new Map();
    this.minInterval = 120;
    this.failed = false;
    this.autoplayBlocked = false;
    this.autoplayArmed = false;
    this.audioContext = null;
    this.boundResume = this.resumeFromInteraction.bind(this);
  }
  savePreferences() {
    safeLocalStorageSetItem(STORAGE_KEYS.audioPreferences, JSON.stringify(this.preferences));
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
    if (entry.kind === 'synth') {
      this.sfxCache.set(name, entry);
      return entry;
    }
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
  preloadSfx() {
    Object.keys(this.config.sfx).forEach((name) => this.ensureSfx(name));
  }
  getAudioContext() {
    if (this.audioContext) return this.audioContext;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    this.audioContext = new Ctx();
    return this.audioContext;
  }
  createNoiseBuffer(context, duration = 0.12) {
    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
  playSynthSfx(entry) {
    const context = this.getAudioContext();
    if (!context) return;
    if (context.state === 'suspended') context.resume().catch(() => {});
    const factory = SYNTH_PRESET_FACTORIES[entry.preset];
    const recipe = typeof factory === 'function' ? factory(entry.variant) : null;
    if (!recipe?.layers?.length) return;
    const master = context.createGain();
    master.gain.value = this.getEffectiveVolume(entry.volume);
    master.connect(context.destination);
    const startTime = context.currentTime + 0.002;
    recipe.layers.forEach((layer) => {
      const layerStart = startTime + (layer.startAt || 0);
      const attack = Math.max(0.001, layer.attack || 0.001);
      const decay = Math.max(0.01, layer.decay || recipe.duration || 0.1);
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0.0001, layerStart);
      gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, layer.gain || 0.1), layerStart + attack);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, layerStart + decay);
      gainNode.connect(master);
      let source = null;
      if (layer.type === 'noise') {
        source = context.createBufferSource();
        source.buffer = this.createNoiseBuffer(context, recipe.duration || 0.12);
        let tail = gainNode;
        if (layer.bandpass) {
          const filter = context.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = layer.bandpass;
          filter.Q.value = layer.q || 1;
          source.connect(filter);
          tail = filter;
        } else if (layer.lowpass) {
          const filter = context.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = layer.lowpass;
          source.connect(filter);
          tail = filter;
        }
        tail.connect(gainNode);
      } else {
        source = context.createOscillator();
        source.type = layer.wave || 'sine';
        source.frequency.setValueAtTime(layer.startFreq || 440, layerStart);
        source.frequency.linearRampToValueAtTime(layer.endFreq || layer.startFreq || 440, layerStart + decay);
        source.connect(gainNode);
      }
      source.start(layerStart);
      source.stop(layerStart + decay + 0.03);
    });
  }
  applyPreferences() {
    const bgm = this.ensureBgm();
    if (bgm) bgm.volume = this.getEffectiveVolume(this.config.bgm.volume);
    Object.entries(this.config.sfx).forEach(([name, entry]) => {
      const audio = this.sfxCache.get(name);
      if (audio && entry.kind !== 'synth') audio.volume = this.getEffectiveVolume(entry.volume);
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
    this.preloadSfx();
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
    const entry = this.config.sfx[name];
    const audio = this.ensureSfx(name);
    if (!audio || !entry) return;
    const now = performance.now();
    const cooldown = entry.cooldown ?? this.minInterval;
    const last = this.sfxCooldowns.get(name) || 0;
    if (now - last < cooldown) return;
    this.sfxCooldowns.set(name, now);
    if (entry.kind === 'synth') {
      this.playSynthSfx(entry);
      return;
    }
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = this.getEffectiveVolume(entry.volume);
      audio.play().catch(() => {});
    } catch {
      // Missing file or browser restriction: fail silently.
    }
  }
  playVariant(groupName) {
    const choices = SOUND_VARIATION_MAP[groupName];
    if (!choices?.length) return;
    let next = choices[0];
    if (choices.length > 1) {
      const last = this.lastVariantByGroup.get(groupName);
      do {
        next = choices[randomInt(0, choices.length - 1)];
      } while (choices.length > 1 && next === last);
      this.lastVariantByGroup.set(groupName, next);
    }
    this.playSfx(next);
  }
}

const audioManager = new AudioManager(AUDIO_CONFIG, loadAudioPreferences());
function playUiSfx(type) {
  const key = UI_SOUND_MAP[type];
  if (key) audioManager.playVariant(key);
}
function playBattleSfx(type) {
  const key = BATTLE_SOUND_MAP[type];
  if (key) audioManager.playVariant(key);
}
function playResultSfx(type) {
  const key = RESULT_SOUND_MAP[type];
  if (key) audioManager.playVariant(key);
}

function roll1000(rng = Math.random) {
  return Math.floor(rng() * 1000);
}
function clampOutOf1000(value) {
  return Math.max(0, Math.min(1000, Math.floor(value)));
}
// Developer note: permanent creature combat bonuses are integer points in base-1000 threshold
// space, not legacy % / damage-band math. All bonuses are 0..100, apply before rolling, and are
// intended only for threshold mechanics:
// - backfireReduction lowers negative thresholds
// - specialTriggerBonus raises positive thresholds
// - negativeEffectResistance lowers incoming negative thresholds
// - favorableActionBonus raises positive thresholds
function applyProgressionBonusOutOf1000(baseThreshold, bonusOutOf1000 = 0) {
  return clampOutOf1000(baseThreshold + bonusOutOf1000);
}
function createCreatureCombatBonuses(overrides = {}) {
  return clampCreatureCombatBonuses({
    backfireReduction: 0,
    specialTriggerBonus: 0,
    negativeEffectResistance: 0,
    favorableActionBonus: 0,
    ...overrides,
  });
}
function clampCreatureCombatBonusValue(value) {
  if (!Number.isFinite(value)) return 0;
  return clamp(Math.floor(value), 0, CREATURE_BONUS_POINT_CAP);
}
function clampCreatureCombatBonuses(bonuses = {}) {
  return CREATURE_COMBAT_BONUS_KEYS.reduce((next, key) => {
    next[key] = clampCreatureCombatBonusValue(bonuses[key]);
    return next;
  }, {});
}
function awardRandomCreatureCombatBonus(bonuses = {}, rng = Math.random) {
  const nextBonuses = clampCreatureCombatBonuses(bonuses);
  const availableKeys = CREATURE_COMBAT_BONUS_KEYS.filter((key) => nextBonuses[key] < CREATURE_BONUS_POINT_CAP);
  if (!availableKeys.length) {
    return {
      bonuses: nextBonuses,
      awardedKey: null,
      awardedAmount: 0,
      scaleMax: CREATURE_BONUS_SCALE_MAX,
    };
  }
  const awardedKey = availableKeys[Math.floor(rng() * availableKeys.length)];
  nextBonuses[awardedKey] = clampCreatureCombatBonusValue(nextBonuses[awardedKey] + 1);
  return {
    bonuses: nextBonuses,
    awardedKey,
    awardedAmount: 1,
    scaleMax: CREATURE_BONUS_SCALE_MAX,
  };
}
function awardCreatureBonusAtThreeWinMilestone(totalWins, bonuses = {}, rng = Math.random) {
  const normalizedWins = Math.max(0, Math.floor(Number(totalWins) || 0));
  if (normalizedWins === 0 || normalizedWins % 3 !== 0) {
    return {
      bonuses: clampCreatureCombatBonuses(bonuses),
      awardedKey: null,
      awardedAmount: 0,
      milestoneReached: false,
      scaleMax: CREATURE_BONUS_SCALE_MAX,
    };
  }
  return {
    ...awardRandomCreatureCombatBonus(bonuses, rng),
    milestoneReached: true,
  };
}
function succeeds(outOf1000, rng = Math.random) {
  return roll1000(rng) < clampOutOf1000(outOf1000);
}
function rollDieFrom1000(sides, rng = Math.random) {
  return Math.floor((roll1000(rng) * sides) / 1000) + 1;
}
function rollRangeFrom1000(size, rng = Math.random) {
  return Math.floor((roll1000(rng) * size) / 1000);
}
function randomInt(min, max) {
  const lower = Math.ceil(Math.min(min, max));
  const upper = Math.floor(Math.max(min, max));
  const size = upper - lower + 1;
  return lower + rollRangeFrom1000(size);
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
  const middle = pickDeterministic(NAME_MIDDLES, `${seed}:m`);
  const suffix = pickDeterministic(NAME_SUFFIXES, `${seed}:s`);
  return `${prefix}${middle}${suffix}`.replace(/(.)\1{2,}/gi, '$1$1');
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
function createCandidateAnimationConfig(seed = crypto.randomUUID()) {
  return {
    action: 'idle',
    variant: (hashString(`${seed}:anim-variant`) % getVariantCount('idle')) + 1,
    timingMultiplier: 0.92 + ((hashString(`${seed}:anim-speed`) % 17) / 100),
  };
}
function buildCandidateCreature(seed = crypto.randomUUID(), previousCandidate = null) {
  const previousVariantIndex = normalizeVariantIndex(previousCandidate?.variantIndex);
  let variantIndex = hashString(`${seed}:palette`) % PALETTE_VARIANTS.length;
  if (PALETTE_VARIANTS.length > 1 && previousVariantIndex != null && variantIndex == previousVariantIndex) {
    variantIndex = (variantIndex + 1 + (hashString(`${seed}:palette-reroll`) % (PALETTE_VARIANTS.length - 1))) % PALETTE_VARIANTS.length;
  }
  return {
    id: seed,
    seed,
    creatureId: 'goblin',
    name: generateFunnyName(seed),
    variantIndex,
    variant: PALETTE_VARIANTS[variantIndex],
    animation: createCandidateAnimationConfig(seed),
  };
}
function ensureCurrentCandidateCreature(forceNew = false) {
  if (!forceNew && state.currentCandidateCreature) return state.currentCandidateCreature;
  const previous = forceNew ? state.currentCandidateCreature : null;
  state.currentCandidateCreature = buildCandidateCreature(crypto.randomUUID(), previous);
  return state.currentCandidateCreature;
}
function getFeaturedFighterCandidate() {
  return state.currentCandidateCreature || state.selectedCreature || ensureCurrentCandidateCreature();
}
function getActiveCreatureSelection() {
  return state.selectedCreature || state.currentCandidateCreature || ensureCurrentCandidateCreature();
}

function buildPlayerProfile(profile = {}) {
  const creatureId = profile.creatureId || 'goblin';
  const id = profile.id || crypto.randomUUID();
  const variantIndex = normalizeVariantIndex(profile.variantIndex) ?? getDeterministicVariantIndex(id, creatureId);
  const wins = Math.max(0, Math.floor(Number(profile.wins) || 0));
  const level = Math.max(1, Math.floor(Number(profile.level) || 1));
  return {
    id,
    seed: profile.seed || id,
    name: profile.name || generateFunnyName(id),
    creatureId,
    variantIndex,
    variant: PALETTE_VARIANTS[variantIndex],
    wins,
    level,
    permanentCombatBonuses: createCreatureCombatBonuses(profile.permanentCombatBonuses),
  };
}
function sanitizeStoredGoblinProfile(storedGoblin = {}) {
  if (!storedGoblin || typeof storedGoblin !== 'object') return null;
  const creatureId = storedGoblin.creatureId || 'goblin';
  const id = typeof storedGoblin.id === 'string' && storedGoblin.id.trim() ? storedGoblin.id.trim() : '';
  const seed = typeof storedGoblin.seed === 'string' && storedGoblin.seed.trim() ? storedGoblin.seed.trim() : id;
  const name = typeof storedGoblin.name === 'string' && storedGoblin.name.trim() ? storedGoblin.name.trim() : '';
  const variantIndex = normalizeVariantIndex(Number.isInteger(storedGoblin.variantIndex) ? storedGoblin.variantIndex : Number(storedGoblin.variantIndex));
  const wins = Math.floor(Number(storedGoblin.wins));
  const level = Math.floor(Number(storedGoblin.level));
  if (!id || !seed || !name || creatureId !== 'goblin' || variantIndex == null) return null;
  if (!Number.isFinite(wins) || wins < 0 || !Number.isFinite(level) || level < 1) return null;
  return buildPlayerProfile({
    ...storedGoblin,
    id,
    seed,
    name,
    creatureId,
    variantIndex,
    wins,
    level,
    permanentCombatBonuses: createCreatureCombatBonuses(storedGoblin.permanentCombatBonuses),
  });
}
function clearLegacyGoblinCache() {
  LEGACY_GOBLIN_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage cleanup failures and keep booting.
    }
  });
}
function getStoredLocalGoblinProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.localProfile) || 'null');
    if (!stored || typeof stored !== 'object') return null;
    if (stored.version !== LOCAL_PROFILE_SCHEMA_VERSION) return null;
    return sanitizeStoredGoblinProfile(stored.savedGoblin);
  } catch {
    return null;
  }
}
function queueLeaderboardIdentitySync(player = state.me, reason = 'profile-confirmed') {
  const goblin = sanitizeStoredGoblinProfile(player) || buildPlayerProfile(player || {});
  Promise.resolve().then(() => syncLeaderboardIdentity(goblin, { reason })).catch((error) => {
    console.warn('[leaderboard] identity sync failed', {
      playerId: goblin?.id || null,
      reason,
      error: error?.message || error,
    });
  });
  return goblin;
}
function saveGoblinProfile(player = state.me, { syncLeaderboard = true, reason = 'profile-saved' } = {}) {
  const goblin = buildPlayerProfile(player || {});
  const payload = {
    version: LOCAL_PROFILE_SCHEMA_VERSION,
    savedGoblin: {
      id: goblin.id,
      seed: goblin.seed || goblin.id,
      name: goblin.name,
      creatureId: goblin.creatureId,
      variantIndex: goblin.variantIndex,
      wins: Math.max(0, Math.floor(Number(goblin.wins) || 0)),
      level: Math.max(1, Math.floor(Number(goblin.level) || 1)),
      permanentCombatBonuses: createCreatureCombatBonuses(goblin.permanentCombatBonuses),
    },
  };
  safeLocalStorageSetItem(STORAGE_KEYS.localProfile, JSON.stringify(payload));
  const savedGoblin = buildPlayerProfile(payload.savedGoblin);
  if (syncLeaderboard) queueLeaderboardIdentitySync(savedGoblin, reason);
  return savedGoblin;
}
function loadSavedGoblin() {
  clearLegacyGoblinCache();
  const saved = getStoredLocalGoblinProfile();
  const player = saved || buildPlayerProfile();
  saveGoblinProfile(player);
  return player;
}
function replaceSavedGoblin(candidate = ensureCurrentCandidateCreature()) {
  const nextGoblin = buildPlayerProfile({
    id: candidate.id,
    seed: candidate.seed || candidate.id,
    name: candidate.name,
    creatureId: candidate.creatureId,
    variantIndex: candidate.variantIndex,
    wins: 0,
    level: 1,
    permanentCombatBonuses: createCreatureCombatBonuses(),
  });
  state.me = saveGoblinProfile(nextGoblin);
  state.selectedCreature = { ...state.me, animation: candidate.animation || createCandidateAnimationConfig(candidate.id) };
  return state.me;
}
function updateGoblinProgression(updater) {
  const current = buildPlayerProfile(state.me || {});
  const updates = typeof updater === 'function' ? updater(current) : updater;
  const next = buildPlayerProfile({
    ...current,
    ...(updates || {}),
    wins: Math.max(0, Math.floor(Number(updates?.wins ?? current.wins) || 0)),
    level: Math.max(1, Math.floor(Number(updates?.level ?? current.level) || 1)),
    permanentCombatBonuses: createCreatureCombatBonuses(updates?.permanentCombatBonuses ?? current.permanentCombatBonuses),
  });
  state.me = saveGoblinProfile(next);
  if (state.selectedCreature && state.selectedCreature.id === state.me.id) {
    state.selectedCreature = { ...state.selectedCreature, ...state.me, variant: state.me.variant };
  }
  return state.me;
}
function loadLocalPlayer() {
  return loadSavedGoblin();
}
window.__ffLiteClearLocalGoblinState = () => {
  clearLegacyGoblinCache();
  try {
    localStorage.removeItem(STORAGE_KEYS.localProfile);
  } catch {
    // Ignore manual reset failures in dev helper.
  }
};

function getCurrentLeaderboardDayBucket() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: LEADERBOARD_DAY_TIMEZONE }).format(new Date());
}
function normalizeLeaderboardRow(record, type = 'daily') {
  const wins = Number(record.wins || 0);
  const losses = Number(record.losses || 0);
  const draws = Number(record.draws || 0);
  const matchesPlayed = Number(record.matches_played || (wins + losses + draws));
  const rating = Math.round(Number(record.rating || INITIAL_RATING));
  const variantIndex = normalizeVariantIndex(Number.isInteger(record.variant_index) ? record.variant_index : Number(record.variant_index))
    ?? getDeterministicVariantIndex(record.player_id || record.display_name || 'goblin', 'goblin');
  return {
    playerId: record.player_id,
    name: record.display_name || 'Goblin',
    variantIndex,
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
async function loadLeaderboardRecords(primaryPath, legacyPath) {
  try {
    return await supabaseRequest(primaryPath, { method: 'GET', prefer: undefined });
  } catch (error) {
    if (!String(error?.message || '').includes('variant_index')) throw error;
    console.warn('[leaderboard] appearance field missing, falling back to legacy query', {
      path: primaryPath,
      error: error?.message || error,
    });
    return supabaseRequest(legacyPath, { method: 'GET', prefer: undefined });
  }
}
async function upsertLeaderboardRecord(path, payload) {
  try {
    return await supabaseRequest(path, {
      method: 'POST',
      body: payload,
      prefer: 'resolution=merge-duplicates,return=representation',
    });
  } catch (error) {
    if (!String(error?.message || '').includes('variant_index')) throw error;
    const { variant_index: _ignoredVariantIndex, ...legacyPayload } = payload;
    console.warn('[leaderboard] appearance field missing, falling back to legacy upsert', {
      path,
      error: error?.message || error,
    });
    return supabaseRequest(path, {
      method: 'POST',
      body: legacyPayload,
      prefer: 'resolution=merge-duplicates,return=representation',
    });
  }
}

async function syncLeaderboardIdentity(player = state.me, { reason = 'profile-confirmed' } = {}) {
  const goblin = sanitizeStoredGoblinProfile(player) || buildPlayerProfile(player || {});
  if (!goblin?.id || !isBackendConfigured()) return false;
  const identityPayload = {
    player_id: goblin.id,
    display_name: goblin.name,
    variant_index: goblin.variantIndex,
  };
  console.info('[leaderboard] identity sync start', {
    playerId: goblin.id,
    displayName: goblin.name,
    variantIndex: goblin.variantIndex,
    reason,
  });
  let synced = false;
  try {
    await upsertLeaderboardRecord('ff_lite_player_ratings?on_conflict=player_id', identityPayload);
    synced = true;
  } catch (error) {
    console.warn('[leaderboard] rating identity upsert failed', {
      playerId: goblin.id,
      reason,
      error: error?.message || error,
    });
  }
  try {
    await supabaseRequest(`ff_lite_daily_stats?player_id=eq.${encodeURIComponent(goblin.id)}&day_bucket=eq.${getCurrentLeaderboardDayBucket()}`, {
      method: 'PATCH',
      body: {
        display_name: goblin.name,
        variant_index: goblin.variantIndex,
      },
      prefer: 'return=representation',
    });
    synced = true;
  } catch (error) {
    console.warn('[leaderboard] daily identity patch skipped', {
      playerId: goblin.id,
      reason,
      error: error?.message || error,
    });
  }
  return synced;
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
    const rows = await loadLeaderboardRecords(
      `ff_lite_daily_stats?day_bucket=eq.${dayBucket}&select=player_id,display_name,variant_index,wins,losses,draws,matches_played&order=wins.desc,draws.desc,losses.asc,display_name.asc`,
      `ff_lite_daily_stats?day_bucket=eq.${dayBucket}&select=player_id,display_name,wins,losses,draws,matches_played&order=wins.desc,draws.desc,losses.asc,display_name.asc`,
    );
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
    const rows = await loadLeaderboardRecords(
      'ff_lite_player_ratings?select=player_id,display_name,variant_index,rating,wins,losses,draws,matches_played,updated_at&order=rating.desc,wins.desc,losses.asc,display_name.asc',
      'ff_lite_player_ratings?select=player_id,display_name,rating,wins,losses,draws,matches_played,updated_at&order=rating.desc,wins.desc,losses.asc,display_name.asc',
    );
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
function buildMatchResultRpcPayload(match, winner, draw = false) {
  const playerA = match?.fighters?.find((fighter) => fighter.slot === 'A') || null;
  const playerB = match?.fighters?.find((fighter) => fighter.slot === 'B') || null;
  if (!match?.id || !playerA?.id || !playerB?.id) {
    throw new Error('Missing match or fighter identifiers for result application.');
  }
  const resultType = draw
    ? 'draw'
    : winner?.id === playerA.id
      ? 'player_a_win'
      : winner?.id === playerB.id
        ? 'player_b_win'
        : null;
  if (!resultType) {
    throw new Error('Missing canonical winner for result application.');
  }
  return {
    p_match_id: match.id,
    p_player_a_id: playerA.id,
    p_player_a_name: playerA.name,
    p_player_a_variant_index: playerA.variantIndex,
    p_player_b_id: playerB.id,
    p_player_b_name: playerB.name,
    p_player_b_variant_index: playerB.variantIndex,
    p_winner_id: draw ? null : (winner?.id || null),
    p_result_type: resultType,
    p_finished_at: new Date().toISOString(),
    p_metadata: {
      source: 'ff-lite-client',
      revision: match?.revision || null,
    },
  };
}
function didApplyMatchResultSucceed(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return false;
  if ('success' in result && result.success !== true) return false;
  return result.applied === true || result.already_processed === true;
}
async function applyMatchResultViaBackend(match, winner, draw = false) {
  if (!isBackendConfigured()) return { applied: false, skipped: true, reason: 'backend_not_configured' };
  const payload = buildMatchResultRpcPayload(match, winner, draw);
  console.info('[leaderboard] apply result rpc start', {
    currentPlayerId: state.me?.id || null,
    payload,
  });
  let response;
  try {
    response = await supabaseRpc('apply_ff_lite_match_result', payload);
  } catch (error) {
    if (!String(error?.message || '').includes('apply_ff_lite_match_result')) throw error;
    response = await supabaseRpc('apply_match_result', {
      p_match_id: payload.p_match_id,
      p_player_a: payload.p_player_a_id,
      p_player_b: payload.p_player_b_id,
      p_winner: payload.p_winner_id,
    });
  }
  console.info('[leaderboard] apply result rpc success', {
    currentPlayerId: state.me?.id || null,
    matchId: match?.id || null,
    response,
  });
  return response;
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
    this.destroyed = false;
    this.setFlip(this.flip);
  }
  setFlip(flip) {
    if (!this.host) return;
    this.flip = flip;
    this.host.style.setProperty('--flip', String(flip));
    if (this.current && this.image) this.drawFrame();
  }
  setVariant(variant = null) {
    this.variant = variant || null;
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
    if (this.destroyed || !this.host || !this.canvas || !this.fallback) return null;
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
    if (this.destroyed || !this.current) return;
    const requestedSrc = this.current.src;
    const cached = SpriteSheetAnimator.imageCache.get(requestedSrc);
    if (cached?.complete) {
      this.handleImageLoad(cached);
      return;
    }
    const img = cached || new Image();
    img.onload = () => {
      if (this.destroyed || !this.current || this.current.src !== requestedSrc) return;
      this.handleImageLoad(img);
    };
    img.onerror = () => {
      if (this.destroyed || !this.current || this.current.src !== requestedSrc) return;
      SpriteSheetAnimator.imageCache.delete(this.current.src);
      if (!this.current.usingFallback && this.current.fallbackSrc && this.current.src !== this.current.fallbackSrc) {
        this.current.src = this.current.fallbackSrc;
        this.current.usingFallback = true;
        this.preloadAndStart();
        return;
      }
      this.image = null;
      this.renderStaticFrame(this.current.fallbackSrc || this.current.src);
      if (!this.current.config.loop && this.ended) this.ended();
    };
    SpriteSheetAnimator.imageCache.set(this.current.src, img);
    if (!img.src) img.src = this.current.src;
  }
  renderStaticFrame(src) {
    if (this.canvas) this.canvas.hidden = true;
    if (this.fallback) {
      this.fallback.hidden = false;
      this.fallback.textContent = src ? 'Preview unavailable — static frame shown.' : 'Preview unavailable.';
      if (src) this.fallback.style.backgroundImage = `url(${src})`;
    }
  }
  handleImageLoad(img) {
    if (this.destroyed || !this.current) return;
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
    if (this.destroyed || !this.current) return;
    const { config } = this.current;
    this.timer = setTimeout(() => {
      if (this.destroyed || !this.current) return;
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
  stop() { clearTimeout(this.timer); this.timer = null; }
  destroy() {
    this.stop();
    this.destroyed = true;
    this.ended = null;
    this.image = null;
    this.current = null;
    this.host = null;
    this.canvas = null;
    this.ctx = null;
    this.fallback = null;
    this.bufferCtx = null;
    this.bufferCanvas = null;
  }
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
async function supabaseRequest(pathname, { method = 'GET', body, prefer, rpc = false } = {}) {
  if (!isBackendConfigured()) {
    throw new Error('Backend not configured. Add supabaseUrl and supabaseAnonKey to ff.config.js.');
  }
  const normalizedMethod = String(method || 'GET').toUpperCase();
  const response = await fetch(`${getBackendBaseUrl()}/rest/v1/${rpc ? `rpc/${pathname}` : pathname}`, {
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

async function supabaseRpc(name, body) {
  return supabaseRequest(name, {
    method: 'POST',
    body,
    prefer: undefined,
    rpc: true,
  });
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
  if (!current) throw new Error('This match no longer exists or the link is invalid.');
  if (current.status === 'finished') throw new Error('This match has already ended.');
  if (current.playerB && current.playerB.id !== playerB.id) throw new Error('This match is already full or has already started.');
  if (current.playerB?.id === playerB.id && current.status === 'active') return current;
  const rows = await updateSharedMatch(matchId, {
    player_b: playerB,
    status: 'active',
  }, 'status=eq.waiting&player_b=is.null&select=*');
  if (rows[0]) return rows[0];
  const latest = await getSharedMatch(matchId);
  if (latest?.playerB?.id === playerB.id) return latest;
  if (latest?.status === 'active') throw new Error('This match already started with another Player B.');
  throw new Error('Someone else already grabbed this match.');
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
  state.activeMatchRunId += 1;
  state.match = null;
  state.logs = [];
}
const MATCH_SLOT_ORDER = Object.freeze(['A', 'B']);
const MATCH_SIDE_BY_SLOT = Object.freeze({ A: 'left', B: 'right' });
const MATCH_PLAYER_LABEL_BY_SLOT = Object.freeze({ A: 'Player A', B: 'Player B' });
const MATCH_DEBUG_LOGS_ENABLED = Boolean(window.FF_LITE_CONFIG?.debugMatchState);
function debugMatchLog(event, payload) {
  if (!MATCH_DEBUG_LOGS_ENABLED) return;
  console.info(`[match] ${event}`, payload);
}
function createMatchPresentationState(previousPresentation = null) {
  const presentedEventIds = previousPresentation?.presentedEventIds instanceof Set
    ? new Set(previousPresentation.presentedEventIds)
    : new Set();
  return {
    token: Number.isFinite(Number(previousPresentation?.token)) ? Number(previousPresentation.token) : 0,
    lastHydratedProgressKey: previousPresentation?.lastHydratedProgressKey || null,
    presentedEventIds,
  };
}
function ensureMatchPresentation(match = state.match) {
  if (!match) return null;
  match.presentation ||= createMatchPresentationState();
  if (!(match.presentation.presentedEventIds instanceof Set)) {
    match.presentation.presentedEventIds = new Set(match.presentation.presentedEventIds || []);
  }
  return match.presentation;
}
function getMatchCombatProgress(match = state.match) {
  if (!match?.fighters?.length) {
    return {
      turn: 0,
      totalDamage: 0,
      totalHp: 0,
      logCount: 0,
      finished: false,
      progressKey: '0|0|0|0|active|none|none',
    };
  }
  const totalHp = match.fighters.reduce((sum, fighter) => sum + Math.max(0, Number(fighter?.hp) || 0), 0);
  const totalDamage = (match.fighters.length * 100) - totalHp;
  const logCount = Array.isArray(match.logs) ? match.logs.length : Array.isArray(state.logs) ? state.logs.length : 0;
  const finished = Boolean(match.finished);
  const progressKey = [
    Number(match.turn) || 0,
    totalDamage,
    totalHp,
    logCount,
    finished ? 'finished' : 'active',
    match.winnerId || 'none',
    match.loserId || 'none',
  ].join('|');
  return {
    turn: Number(match.turn) || 0,
    totalDamage,
    totalHp,
    logCount,
    finished,
    progressKey,
  };
}
function compareMatchProgress(leftMatch, rightMatch) {
  const left = getMatchCombatProgress(leftMatch);
  const right = getMatchCombatProgress(rightMatch);
  const comparisons = [
    ['finished', Number(left.finished), Number(right.finished)],
    ['turn', left.turn, right.turn],
    ['totalDamage', left.totalDamage, right.totalDamage],
    ['logCount', left.logCount, right.logCount],
  ];
  for (const [field, leftValue, rightValue] of comparisons) {
    if (leftValue === rightValue) continue;
    return { direction: leftValue > rightValue ? 1 : -1, field, left, right };
  }
  return { direction: 0, field: 'equal', left, right };
}
function invalidateMatchPresentation(match = state.match, reason = 'unknown') {
  const presentation = ensureMatchPresentation(match);
  if (!presentation) return 0;
  presentation.token += 1;
  debugMatchLog('presentation invalidated', {
    reason,
    token: presentation.token,
    progress: getMatchCombatProgress(match).progressKey,
  });
  return presentation.token;
}
function consumePresentationEvent(eventId, details = {}, match = state.match) {
  if (!eventId) return true;
  const presentation = ensureMatchPresentation(match);
  if (!presentation) return false;
  const duplicate = presentation.presentedEventIds.has(eventId);
  debugMatchLog('presentation event', {
    eventId,
    duplicate,
    ...details,
    progress: getMatchCombatProgress(match).progressKey,
  });
  if (duplicate) return false;
  presentation.presentedEventIds.add(eventId);
  return true;
}
function applyCanonicalHpChange(fighter, nextHp, details = {}) {
  if (!fighter) return false;
  const previousHp = Number(fighter.hp) || 0;
  const canonicalHp = Math.max(0, Number(nextHp) || 0);
  if (previousHp === canonicalHp) {
    debugMatchLog('hp apply skipped', { fighterId: fighter.id, slot: fighter.slot, previousHp, nextHp: canonicalHp, ...details });
    return false;
  }
  fighter.hp = canonicalHp;
  debugMatchLog('hp canonical write', { fighterId: fighter.id, slot: fighter.slot, previousHp, nextHp: canonicalHp, ...details });
  return true;
}
function getMatchRenderSide(slot) {
  return MATCH_SIDE_BY_SLOT[slot] || 'left';
}
function getMatchPlayerLabel(slot) {
  return MATCH_PLAYER_LABEL_BY_SLOT[slot] || slot || 'Player';
}
function normalizeMatchFighter(rawFighter, { fallbackSlot = 'A', fallbackHp = 100 } = {}) {
  const slot = MATCH_SLOT_ORDER.includes(rawFighter?.slot) ? rawFighter.slot : fallbackSlot;
  return {
    ...rawFighter,
    slot,
    side: getMatchRenderSide(slot),
    hp: Number.isFinite(Number(rawFighter?.hp)) ? Number(rawFighter.hp) : fallbackHp,
    state: rawFighter?.state || 'idle',
  };
}
function getMatchFighterBySlot(match, slot) {
  return match?.fighters?.find((fighter) => fighter.slot === slot) || null;
}
function resolveCanonicalFighter(snapshot, { fighterId = null, fighterSlot = null } = {}) {
  if (!snapshot?.fighters?.length) return null;
  if (fighterSlot) {
    const fighterBySlot = getMatchFighterBySlot(snapshot, fighterSlot);
    if (fighterBySlot) return fighterBySlot;
  }
  if (fighterId) {
    const fighterById = snapshot.fighters.find((fighter) => fighter.id === fighterId) || null;
    if (fighterById) return fighterById;
  }
  return null;
}
function getCanonicalMatchResult(snapshot) {
  if (!snapshot?.finished) return { winner: null, loser: null };
  const winner = resolveCanonicalFighter(snapshot, {
    fighterId: snapshot.winnerId || null,
    fighterSlot: snapshot.winnerSlot || null,
  });
  let loser = resolveCanonicalFighter(snapshot, {
    fighterId: snapshot.loserId || null,
    fighterSlot: snapshot.loserSlot || null,
  });
  if (!loser && winner && snapshot.fighters.length === 2) {
    loser = snapshot.fighters.find((fighter) => fighter.slot !== winner.slot || fighter.id !== winner.id) || null;
  }
  if (!loser && snapshot.loserId && snapshot.fighters.length === 2) {
    loser = snapshot.fighters.find((fighter) => fighter.id !== snapshot.winnerId) || null;
  }
  return { winner, loser };
}
function getCanonicalWinner(match = state.match) {
  return getCanonicalMatchResult(match).winner;
}
function getCanonicalLoser(match = state.match) {
  return getCanonicalMatchResult(match).loser;
}
function logSharedLink(event, details = {}) {
  console.info(`[shared-link] ${event}`, details);
}
function setError(message) {
  logSharedLink('error', { message, screen: state.screen, loading: state.loading, booting: state.booting });
  state.loading = false;
  state.booting = false;
  state.errorMessage = message;
  state.screen = 'error';
  render();
}
function getSharedMatchSnapshotRevision(sharedMatch) {
  if (!sharedMatch?.id) return null;
  const sharedState = sharedMatch.sharedState || {};
  if (Number.isFinite(Number(sharedState.revision))) return Number(sharedState.revision);
  if (sharedState.updatedAt) {
    const ts = Date.parse(sharedState.updatedAt);
    if (Number.isFinite(ts)) return ts;
  }
  if (sharedMatch.updatedAt) {
    const ts = Date.parse(sharedMatch.updatedAt);
    if (Number.isFinite(ts)) return ts;
  }
  return null;
}
function watchSharedMatch(matchId, onChange) {
  clearMatchWatcher();
  if (!matchId) return;
  const controller = new AbortController();
  const signal = controller.signal;
  let latestRequestId = 0;
  let latestProcessedRevision = null;
  const scheduleNextPoll = () => {
    if (signal.aborted) return;
    window.setTimeout(runPoll, POLL_INTERVAL_MS);
  };
  const runPoll = async () => {
    if (signal.aborted) return;
    const requestId = ++latestRequestId;
    try {
      const match = await getSharedMatch(matchId);
      if (signal.aborted || requestId !== latestRequestId) return;
      const revision = getSharedMatchSnapshotRevision(match);
      if (revision && revision === latestProcessedRevision) {
        scheduleNextPoll();
        return;
      }
      latestProcessedRevision = revision;
      onChange(match);
    } catch (error) {
      console.error(error);
    }
    scheduleNextPoll();
  };
  runPoll();
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
      const hydration = hydrateMatchFromSharedState(sharedMatch);
      if (hydration.accepted) {
        if (hydration.transitionedToPostmatch) {
          render();
        } else {
          restoreMatchAnimators({ source: 'watchSharedMatch:hydrate' });
          updateMatchUI();
        }
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
function makeMatchPayload(playerA = { ...state.me, ...getActiveCreatureSelection(), variant: getActiveCreatureSelection().variant }) {
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
  const searchParams = new URLSearchParams(window.location.search);
  const searchValue = searchParams.get('matchId')?.trim();
  if (searchValue) {
    logSharedLink('detected-join-param', { source: 'search', key: 'matchId', value: searchValue });
    return searchValue;
  }
  const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const hashParams = new URLSearchParams(hash || '');
  const hashValue = hashParams.get('matchId')?.trim();
  if (hashValue) {
    logSharedLink('detected-join-param', { source: 'hash', key: 'matchId', value: hashValue });
    return hashValue;
  }
  logSharedLink('detected-join-param', { source: 'none', key: 'matchId', value: null });
  return '';
}
function resetToHome() {
  playUiSfx('navTab');
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
  playUiSfx('navTab');
  state.screen = 'leaderboard';
  playUiSfx('leaderboardOpen');
  audioManager.syncHomePlayback();
  render();
  loadLeaderboard();
}
async function startCreateFlow() {
  if (state.loading || state.pendingStartTimer || (state.pendingMatch?.role === 'challenger' && !state.pendingMatch?.opponentJoined)) return;
  clearRuntimeMatchState();
  state.booting = false;
  state.loading = true;
  state.errorMessage = '';
  state.screen = 'home';
  playUiSfx('createMatch');
  render();
  try {
    const activeCreature = state.selectedCreature || getFeaturedFighterCandidate();
    const playerForMatch = { ...state.me, name: activeCreature.name, creatureId: activeCreature.creatureId, variantIndex: activeCreature.variantIndex, variant: activeCreature.variant };
    queueLeaderboardIdentitySync(playerForMatch, 'match-create');
    const payload = makeMatchPayload(playerForMatch);
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
    setError(error.message || 'Unable to create the shared match.');
  }
}
async function startJoinedFlow(matchId) {
  if (state.loading) {
    logSharedLink('join-skipped', { reason: 'loading-active', matchId, screen: state.screen });
    return;
  }
  state.booting = true;
  state.screen = 'boot';
  state.loading = false;
  state.errorMessage = '';
  logSharedLink('boot-state-set', { matchId, screen: state.screen, loading: state.loading, booting: state.booting });
  render();
  try {
    logSharedLink('fetch-started', { matchId });
    const hostMatch = await getSharedMatch(matchId);
    logSharedLink('fetch-result', { matchId, found: Boolean(hostMatch), status: hostMatch?.status || null, hasPlayerA: Boolean(hostMatch?.playerA), hasPlayerB: Boolean(hostMatch?.playerB) });
    if (!hostMatch?.playerA) throw new Error('The shared match is incomplete and cannot start.');
    const playerB = withResolvedVariant(state.me, hostMatch.playerA.variantIndex, { preserveExisting: true });
    queueLeaderboardIdentitySync(playerB, 'match-join');
    logSharedLink('join-attempt-started', { matchId, playerBId: playerB.id, playerBName: playerB.name });
    const sharedMatch = await joinSharedMatch(matchId, { id: playerB.id, name: playerB.name, creatureId: playerB.creatureId, variantIndex: playerB.variantIndex });
    logSharedLink('join-attempt-result', { matchId, status: sharedMatch?.status || null, hasPlayerA: Boolean(sharedMatch?.playerA), hasPlayerB: Boolean(sharedMatch?.playerB) });
    if (!sharedMatch?.playerA || !sharedMatch?.playerB) {
      throw new Error('The shared match is incomplete and cannot start.');
    }
    setPendingMatchState({
      payload: sharedMatch,
      link: getJoinLink(sharedMatch.id),
      opponentJoined: true,
    });
    state.screen = 'join';
    state.loading = false;
    state.booting = false;
    logSharedLink('boot-state-cleared', { matchId: sharedMatch.id, screen: state.screen, loading: state.loading, booting: state.booting });
    audioManager.syncHomePlayback();
    render();
    logSharedLink('screen-transition', { matchId: sharedMatch.id, screen: state.screen, nextAction: 'queueMatchStart' });
    queueMatchStart(sharedMatch);
  } catch (error) {
    console.error(error);
    logSharedLink('join-failure', { matchId, message: error?.message || String(error) });
    setError(error.message || 'Unable to join the shared match.');
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
    state.activeMatchRunId += 1;
    state.match = createResolvedMatch(payload);
    state.logs = ['The goblins sniff each other suspiciously...'];
    render();
    runMatchSequence();
  }, 900);
}
// Canonical combat snapshot: shared combat truth lives here; transient animation timing stays in fighter.animationState/animators.
function buildCanonicalMatchSnapshot(payload, { previousMatch = null } = {}) {
  const sharedState = payload.sharedState || {};
  const sharedFighters = Array.isArray(sharedState.fighters) ? sharedState.fighters : [];
  const sharedBySlot = new Map(sharedFighters.filter((fighter) => fighter?.slot).map((fighter) => [fighter.slot, fighter]));
  const previousBySlot = new Map((previousMatch?.fighters || []).filter((fighter) => fighter?.slot).map((fighter) => [fighter.slot, fighter]));
  const playerAState = sharedBySlot.get('A');
  const playerBState = sharedBySlot.get('B');
  const playerA = withResolvedVariant({ ...payload.playerA, variantIndex: playerAState?.variantIndex ?? payload.playerA?.variantIndex });
  const fallbackPlayerB = {
    id: 'auto-b', name: generateFunnyName(`${payload.id}:fallback`), creatureId: 'goblin',
  };
  const playerB = withResolvedVariant({ ...(payload.playerB || fallbackPlayerB), variantIndex: playerBState?.variantIndex ?? payload.playerB?.variantIndex }, playerA.variantIndex, { preserveExisting: false });
  const baseBySlot = { A: playerA, B: playerB };
  const revision = getSharedMatchSnapshotRevision(payload) ?? Number(previousMatch?.revision || 0);
  const updatedAt = sharedState.updatedAt || payload.updatedAt || previousMatch?.updatedAt || payload.createdAt || new Date().toISOString();
  const turn = Number.isFinite(Number(sharedState.turn)) ? Number(sharedState.turn) : Number(previousMatch?.turn || 0);
  const logs = Array.isArray(sharedState.logs) ? sharedState.logs.filter((entry) => typeof entry === 'string' && entry.trim()).slice(0, MAX_BATTLE_LOG_ENTRIES) : [...(previousMatch?.logs || [])];
  const lastAction = sharedState.lastAction || previousMatch?.lastAction || null;
  const finished = payload.status === 'finished' || Boolean(sharedState.finishedAt);
  const winnerId = sharedState.winnerId || sharedState.winner?.id || previousMatch?.winnerId || null;
  const winnerSlot = sharedState.winner?.slot || previousMatch?.winnerSlot || null;
  const loserId = sharedState.loserId || previousMatch?.loserId || null;
  const loserSlot = previousMatch?.loserSlot || null;
  const fighters = MATCH_SLOT_ORDER.map((slot) => {
    const sharedFighter = normalizeMatchFighter(sharedBySlot.get(slot), { fallbackSlot: slot, fallbackHp: 100 });
    const baseFighter = baseBySlot[slot] || {};
    const previousFighter = previousBySlot.get(slot) || null;
    const resolvedFighterId = sharedFighter.id || baseFighter.id || previousFighter?.id || null;
    const isWinner = finished && ((winnerId && resolvedFighterId === winnerId) || (winnerSlot && slot === winnerSlot));
    const isLoser = finished && ((loserId && resolvedFighterId === loserId) || (winnerSlot && slot !== winnerSlot));
    const stateName = finished
      ? (isWinner ? 'victory' : isLoser ? 'defeat' : sharedFighter.state || previousFighter?.state || 'idle')
      : (sharedFighter.state || previousFighter?.state || 'idle');
    return {
      ...previousFighter,
      ...baseFighter,
      ...sharedFighter,
      slot,
      side: getMatchRenderSide(slot),
      hp: sharedFighter.hp,
      displayedHp: Number.isFinite(Number(previousFighter?.displayedHp)) ? Number(previousFighter.displayedHp) : sharedFighter.hp,
      state: stateName,
      animationState: hydrateFighterAnimationState(sharedFighter, previousFighter, stateName),
    };
  });
  const resolvedWinnerSlot = fighters.find((fighter) => fighter.id === winnerId)?.slot || winnerSlot || null;
  const resolvedLoserSlot = fighters.find((fighter) => fighter.id === loserId)?.slot || (resolvedWinnerSlot && fighters.find((fighter) => fighter.slot !== resolvedWinnerSlot)?.slot) || loserSlot || null;
  const resolvedLoserId = fighters.find((fighter) => fighter.slot === resolvedLoserSlot)?.id || loserId || null;
  return {
    id: payload.id,
    revision,
    updatedAt,
    turn,
    fighters,
    finished,
    winnerId,
    loserId: resolvedLoserId,
    winnerSlot: resolvedWinnerSlot,
    loserSlot: resolvedLoserSlot,
    logs,
    lastAction,
    sharedState,
    presentation: createMatchPresentationState(previousMatch?.presentation),
  };
}
function createResolvedMatch(payload) {
  return buildCanonicalMatchSnapshot(payload);
}
function refreshAudioControlsUI() {
  const toggle = document.getElementById('audio-toggle');
  const slider = document.getElementById('audio-volume');
  const isMuted = audioManager.preferences.muted || audioManager.preferences.volume === 0;
  if (toggle) toggle.textContent = isMuted ? '🔇' : '🔊';
  if (slider) slider.value = String(Math.round(audioManager.preferences.volume * 100));
}
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
function wrapLogMatches(text, matcher, className) {
  if (!text) return text;
  return text.replace(matcher, (match) => `<span class="${className}">${match}</span>`);
}
function classifyBattleLogEvent(line) {
  const text = String(line || '').toLowerCase();
  if (!text) return 'neutral';
  if (/wins!|win!|victory|trophy|triumphs/.test(text)) return 'victory';
  if (/defeat|collapsed|collapses|falls/.test(text)) return 'defeat';
  if (/boomerang|backfire|backfires/.test(text)) return 'backfire';
  if (/prep|recharge|energy|charges/.test(text)) return 'charge';
  if (/hits|aromatic damage/.test(text)) return 'hit';
  if (/attack|lunges/.test(text)) return 'attack';
  return 'neutral';
}
function getLogEventMeta(type) {
  return LOG_EVENT_META[type] || LOG_EVENT_META.neutral;
}
function highlightLogText(line) {
  const fighters = state.match?.fighters ?? [];
  let html = escapeHtml(line);
  fighters
    .map((fighter) => fighter?.name)
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)
    .forEach((name) => {
      const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = wrapLogMatches(html, new RegExp(safeName, 'g'), 'log-name');
    });
  html = wrapLogMatches(html, /\b(attacks?|hits?|backfires?|triumphs?|collapses?|charges?|recharges?|draw|copied|manual|needed|wins?)\b/gi, 'log-action');
  html = wrapLogMatches(html, /\b\d+\b(?=( aromatic damage| damage|!))/gi, 'log-result');
  html = wrapLogMatches(html, /\b(aromatic damage|damage|boomerang blast|greenish haze|toxic draw|clipboard)\b/gi, 'log-result');
  return html;
}
function formatBattleFeedEntry(line, index) {
  const rawLine = String(line || '').trim();
  const eventType = classifyBattleLogEvent(rawLine);
  const patterns = [
    {
      regex: /^(.+?) charges a suspicious blast\.$/i,
      build: (match) => ({
        eventType: 'charge',
        headline: `${highlightLogText(match[1])} recharges`,
        detail: 'Suspicious blast primed.',
      }),
    },
    {
      regex: /^(.+?) hits (.+?) for (\d+) aromatic damage!$/i,
      build: (match) => ({
        eventType: 'hit',
        headline: `${highlightLogText(match[1])} hits ${highlightLogText(match[2])}`,
        detail: `${highlightLogText(match[2])} takes <span class="log-result">${match[3]}</span> <span class="log-result">aromatic damage</span>.`,
      }),
    },
    {
      regex: /^(.+?) backfires with a boomerang blast for (\d+)!$/i,
      build: (match) => ({
        eventType: 'backfire',
        headline: `${highlightLogText(match[1])} backfires`,
        detail: `Boomerang blast lands for <span class="log-result">${match[2]}</span> <span class="log-result">damage</span>.`,
      }),
    },
    {
      regex: /^(.+?) triumphs in the greenish haze\.$/i,
      build: (match) => ({
        eventType: 'victory',
        headline: `${highlightLogText(match[1])} wins`,
        detail: 'Last goblin standing in the greenish haze.',
      }),
    },
    {
      regex: /^Toxic draw: nobody actually collapses\.$/i,
      build: () => ({
        eventType: 'neutral',
        headline: 'Toxic draw',
        detail: 'Nobody actually collapses.',
      }),
    },
    {
      regex: /^Link copied to the clipboard\.$/i,
      build: () => ({
        eventType: 'neutral',
        headline: 'Link copied',
        detail: 'Clipboard ready to share.',
      }),
    },
    {
      regex: /^Manual copy needed: (.+)$/i,
      build: (match) => ({
        eventType: 'neutral',
        headline: 'Manual copy needed',
        detail: highlightLogText(match[1]),
      }),
    },
    {
      regex: /^The goblins sniff each other suspiciously\.\.\.$/i,
      build: () => ({
        eventType: 'neutral',
        headline: 'Battle starting',
        detail: 'Both goblins size up the opener.',
      }),
    },
  ];
  const formatted = patterns
    .map((entry) => ({ ...entry, match: rawLine.match(entry.regex) }))
    .find((entry) => entry.match);
  const content = formatted
    ? formatted.build(formatted.match)
    : { eventType, headline: highlightLogText(rawLine), detail: '' };
  const resolvedType = content.eventType || eventType;
  const meta = getLogEventMeta(resolvedType);
  return `<article class="battle-feed__item ${meta.className} ${index === 0 ? 'is-latest' : ''}" data-log-row="${index % 2}" data-log-type="${resolvedType}"><span class="battle-feed__icon" aria-hidden="true">${meta.icon}</span><div class="battle-feed__body"><div class="battle-feed__meta"><span class="battle-feed__tone">${meta.tone}</span><span class="battle-feed__count">#${String(index + 1).padStart(2, '0')}</span></div><p class="battle-feed__headline"><span class="sr-only">${meta.label}: </span>${content.headline}</p>${content.detail ? `<p class="battle-feed__detail">${content.detail}</p>` : ''}</div></article>`;
}
function renderBattleLogEntries() {
  if (!state.logs.length) {
    const neutralMeta = getLogEventMeta('neutral');
    return `<article class="battle-feed__item battle-feed__empty ${neutralMeta.className}" data-log-type="neutral"><span class="battle-feed__icon" aria-hidden="true">${neutralMeta.icon}</span><div class="battle-feed__body"><div class="battle-feed__meta"><span class="battle-feed__tone">${neutralMeta.tone}</span></div><p class="battle-feed__headline">Battle starting…</p><p class="battle-feed__detail">The goblins are eyeing each other and sizing up the stinkiest opener.</p></div></article>`;
  }
  return state.logs.map((line, index) => formatBattleFeedEntry(line, index)).join('');
}
function updateMatchUI() {
  if (!(state.screen === 'match' || state.screen === 'postmatch') || !state.match) return;
  state.match.fighters.forEach((fighter, index) => {
    const fill = document.querySelector(`[data-hp="${index}"]`);
    const label = document.querySelector(`[data-hp-label="${index}"]`);
    const fighterNode = document.querySelector(`[data-fighter="${index}"]`);
    const stateLabel = document.querySelector(`[data-fighter-state="${index}"]`);
    const previousDisplayedHp = Number.isFinite(Number(fighter.displayedHp))
      ? Number(fighter.displayedHp)
      : Number(fighterNode?.dataset.displayedHp ?? fighter.hp);
    const nextDisplayedHp = Math.max(0, Math.min(100, Number(fighter.hp) || 0));
    const hpDelta = nextDisplayedHp - previousDisplayedHp;
    fighter.displayedHp = nextDisplayedHp;
    if (fill) fill.style.setProperty('--hp', `${nextDisplayedHp}%`);
    if (label) label.textContent = `HP ${fighter.hp} · ${fighter.slot === 'A' ? 'Player A' : 'Player B'}`;
    if (stateLabel) stateLabel.textContent = getFighterVisualAnimation(index, state.match);
    if (fighterNode) {
      fighterNode.dataset.canonicalHp = String(fighter.hp);
      fighterNode.dataset.displayedHp = String(nextDisplayedHp);
    }
    if (hpDelta) {
      debugMatchLog('hp visual sync', {
        fighterId: fighter.id,
        slot: fighter.slot,
        previousDisplayedHp,
        nextDisplayedHp,
        canonicalHp: fighter.hp,
      });
      triggerHpChangeEffect(index, hpDelta);
    }
  });
  const turnLabel = document.querySelector('[data-turn-counter]');
  if (turnLabel) turnLabel.textContent = `Turn ${state.match.turn}`;
  const logPanel = document.getElementById('log-lines');
  if (logPanel) {
    const nextMarkup = renderBattleLogEntries();
    if (logPanel.dataset.lastMarkup !== nextMarkup) {
      const shouldPinToLatest = logPanel.scrollTop < 28;
      logPanel.innerHTML = nextMarkup;
      logPanel.dataset.lastMarkup = nextMarkup;
      if (state.logs.length && shouldPinToLatest) {
        logPanel.scrollTo({ top: 0, behavior: state.reducedMotion ? 'auto' : 'smooth' });
      }
      const firstNewEntry = logPanel.querySelector('.battle-feed__item');
      if (firstNewEntry) triggerTemporaryClass(firstNewEntry, 'log-entry-in', 220);
    }
  }
  if (state.screen === 'postmatch') triggerResultEffects();
  refreshAudioControlsUI();
}
function logLine(text) {
  state.logs = [text, ...state.logs].slice(0, MAX_BATTLE_LOG_ENTRIES);
  if (state.match) {
    state.match.logs = [...state.logs];
    state.match.sharedState = { ...(state.match.sharedState || {}), logs: [...state.logs] };
  }
  updateMatchUI();
}
function createSeededCombatRng(seed) {
  let stateSeed = seed >>> 0;
  return () => {
    stateSeed = hashString(String(stateSeed));
    return stateSeed / 0x100000000;
  };
}
function getFighterCombatBonuses(fighter) {
  if (!fighter?.id) return createCreatureCombatBonuses();
  if (state.me?.id === fighter.id) return createCreatureCombatBonuses(state.me.permanentCombatBonuses);
  return createCreatureCombatBonuses(fighter.permanentCombatBonuses);
}
function computeAction(attacker, defender, turn) {
  const seed = hashString(`${state.match.id}:${attacker.slot}:${turn}`);
  const combatRng = createSeededCombatRng(seed);
  const actionRoll1000 = roll1000(combatRng);
  const legacyRoll = Math.floor((actionRoll1000 * 100) / 1000);
  const intensity = 10 + turn * 2.75;
  const baseBackfireThreshold = 180;
  const attackerBonuses = getFighterCombatBonuses(attacker);
  const backfireThreshold = applyProgressionBonusOutOf1000(baseBackfireThreshold, -attackerBonuses.backfireReduction);
  // Combat audit / progression-readiness table:
  // - action roll: seed % 100 -> floor(actionRoll1000 * 100 / 1000) using a seeded 0..999 roll.
  // - backfire threshold: 18/100 -> 180/1000, now ready for integer progression bonuses in threshold space.
  // - self-damage: round(intensity * 0.75) -> unchanged and deterministic.
  // - hit damage: round(intensity + (roll % 8)) -> unchanged shape via round(intensity + (legacyRoll % 8)).
  // - progression-safe today: threshold mechanics like backfire because they resolve directly against actionRoll1000.
  // - not yet fine-grained: legacyRoll % 8 damage cadence still moves in 1/100-sized steps, so +1/1000 bonuses
  //   should not be applied to legacyRoll-derived outcomes without a dedicated table/weight refactor.
  if (actionRoll1000 < backfireThreshold) {
    const selfDamage = Math.round(intensity * 0.75);
    return { type: 'backfire', amount: selfDamage, text: `${attacker.name} backfires with a boomerang blast for ${selfDamage}!` };
  }
  const damage = Math.round(intensity + (legacyRoll % 8));
  return { type: 'attack', amount: damage, text: `${attacker.name} hits ${defender.name} for ${damage} aromatic damage!` };
}
async function updateLeaderboardForResult(winner, loser, draw = false) {
  if (!state.match?.id) return false;
  const matchId = state.match.id;
  const playerA = state.match.fighters.find((fighter) => fighter.slot === 'A') || null;
  const playerB = state.match.fighters.find((fighter) => fighter.slot === 'B') || null;
  const alreadyApplied = Boolean(state.appliedMatchResultIds[matchId]);
  state.resultApplyFeedback = '';
  console.info('[leaderboard] update result start', {
    currentPlayerId: state.me?.id || null,
    matchId,
    playerAId: playerA?.id || null,
    playerBId: playerB?.id || null,
    draw,
    winnerId: winner?.id || null,
    loserId: loser?.id || null,
    alreadyApplied,
  });
  if (alreadyApplied) {
    state.resultApplyFeedback = 'Result already synced. Leaderboards refreshed safely.';
    await loadLeaderboard({ silent: state.screen !== 'leaderboard' && state.screen !== 'postmatch' });
    render();
    return true;
  }
  try {
    const result = await applyMatchResultViaBackend(state.match, winner, draw);
    const didSucceed = didApplyMatchResultSucceed(result);
    if (didSucceed) {
      state.appliedMatchResultIds[matchId] = true;
    }
    if (result?.skipped) {
      state.resultApplyFeedback = 'Shared backend not configured; leaderboard sync skipped.';
    } else if (result?.already_processed && didSucceed) {
      state.resultApplyFeedback = 'Result already synced. Leaderboards refreshed safely.';
    } else if (result?.applied && didSucceed) {
      state.resultApplyFeedback = 'Result synced to the shared ladder.';
    } else {
      console.error('[leaderboard] apply_match_result returned invalid result', {
        currentPlayerId: state.me?.id || null,
        matchId,
        playerAId: playerA?.id || null,
        playerBId: playerB?.id || null,
        draw,
        winnerId: winner?.id || null,
        loserId: loser?.id || null,
        result,
      });
      state.resultApplyFeedback = 'Result sync failed; leaderboard refresh skipped.';
      render();
      return false;
    }
    await loadLeaderboard({ silent: state.screen !== 'leaderboard' && state.screen !== 'postmatch' });
    render();
    return true;
  } catch (error) {
    console.error('[leaderboard] apply_match_result failed', {
      currentPlayerId: state.me?.id || null,
      matchId,
      playerAId: playerA?.id || null,
      playerBId: playerB?.id || null,
      draw,
      winnerId: winner?.id || null,
      loserId: loser?.id || null,
      error: error?.message || error,
    });
    state.resultApplyFeedback = 'Result sync failed; leaderboard refresh skipped.';
    render();
    return false;
  }
}
async function syncSharedMatchState(extraState = {}) {
  if (!state.match || !isBackendConfigured()) return;
  const timestamp = new Date().toISOString();
  state.match.revision = Math.max(0, Number(state.match.revision) || 0) + 1;
  state.match.updatedAt = timestamp;
  state.match.logs = [...state.logs];
  const { winner, loser } = getCanonicalMatchResult(state.match);
  try {
    await updateSharedMatch(state.match.id, {
      status: state.match.finished ? 'finished' : 'active',
      shared_state: {
        ...state.match.sharedState,
        ...extraState,
        revision: state.match.revision,
        updatedAt: timestamp,
        finishedAt: state.match.finished ? timestamp : undefined,
        winner: winner ? { id: winner.id, name: winner.name, slot: winner.slot } : null,
        winnerId: winner?.id || null,
        loserId: loser?.id || null,
        turn: state.match.turn,
        lastAction: extraState.lastAction || state.match.lastAction || null,
        logs: [...state.logs],
        fighters: state.match.fighters.map((fighter, index) => {
          const resolvedVisualAction = getFighterVisualAnimation(index, state.match);
          const animationState = fighter.animationState || createAnimationState(resolvedVisualAction);
          return {
            slot: fighter.slot,
            id: fighter.id,
            name: fighter.name,
            hp: fighter.hp,
            variantIndex: fighter.variantIndex,
            state: fighter.state,
            resolvedVisualAction,
            visualAction: animationState.visualAction || resolvedVisualAction,
            persistentAction: animationState.persistentAction || null,
            lockUntil: serializeAnimationLock(animationState.lockUntil),
            lastRequestedAction: animationState.lastRequestedAction || resolvedVisualAction,
            lastRequestSource: animationState.lastRequestSource || 'syncSharedMatchState',
          };
        }),
      },
    });
    debugMatchLog('shared snapshot persisted', {
      matchId: state.match.id,
      revision: state.match.revision,
      updatedAt: timestamp,
      finished: state.match.finished,
      winnerId: winner?.id || null,
      loserId: loser?.id || null,
      lastAction: extraState.lastAction || state.match.lastAction || null,
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
  const finalLog = document.querySelector('#log-lines .battle-feed__item:first-child');
  if (finalLog && finalLog.dataset.finale !== 'true') {
    finalLog.dataset.finale = 'true';
    triggerTemporaryClass(finalLog, 'log-finale', COMBAT_EFFECT_DURATIONS.result);
  }
  state.match.fighters.forEach((fighter, index) => {
    if (!state.match.winnerId) return;
    const fighterNode = document.querySelector(`[data-fighter="${index}"]`);
    if (!fighterNode || fighterNode.dataset.outcomeFx === 'true') return;
    fighterNode.dataset.outcomeFx = 'true';
    if (fighter.id === state.match.winnerId) triggerFighterEffect(index, 'combat-victory', COMBAT_EFFECT_DURATIONS.victory);
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
function getResolvedMatchWinner(match = state.match) {
  return getCanonicalWinner(match);
}
function getTerminalAnimationForFighter(index, match = state.match) {
  if (!match?.finished) return null;
  const fighter = match.fighters?.[index];
  if (!fighter) return null;
  const { winner, loser } = getCanonicalMatchResult(match);
  if (winner?.id && fighter.id === winner.id) return 'victory';
  if (loser?.id && fighter.id === loser.id) return 'defeat';
  return 'idle';
}
function resolveTerminalMatchVisualState(source = 'unknown') {
  if (!state.match?.finished) return false;
  const { winner, loser } = getCanonicalMatchResult(state.match);
  const summary = {
    source,
    status: state.match.finished ? 'finished' : 'active',
    winnerId: winner?.id || state.match.winnerId || null,
    loserId: loser?.id || state.match.loserId || null,
    winnerSlot: winner?.slot || state.match.winnerSlot || null,
    loserSlot: loser?.slot || state.match.loserSlot || null,
    fighters: state.match.fighters.map((fighter, index) => ({
      index,
      id: fighter.id,
      slot: fighter.slot,
      side: fighter.side,
      hp: fighter.hp,
      before: fighter.state,
      final: getTerminalAnimationForFighter(index, state.match),
    })),
  };
  let changed = false;
  state.match.fighters.forEach((fighter, index) => {
    const finalAnimation = getTerminalAnimationForFighter(index, state.match);
    fighter.animationState ||= createAnimationState(finalAnimation);
    if (!finalAnimation) return;
    if (fighter.state !== finalAnimation) {
      fighter.state = finalAnimation;
      changed = true;
    }
    fighter.animationState.visualAction = finalAnimation;
    fighter.animationState.persistentAction = finalAnimation;
    fighter.animationState.lockUntil = Number.POSITIVE_INFINITY;
    fighter.animationState.lastRequestedAction = finalAnimation;
    fighter.animationState.lastRequestSource = source;
  });
  console.info('[match] final animation resolution', summary);
  return changed;
}
function getFighterVisualAnimation(index, match = state.match) {
  const fighter = match?.fighters?.[index];
  if (!fighter) return 'idle';
  const terminalAnimation = getTerminalAnimationForFighter(index, match);
  if (terminalAnimation) return terminalAnimation;
  fighter.animationState ||= createAnimationState(fighter.state || 'idle');
  if (fighter.animationState.persistentAction) return fighter.animationState.persistentAction;
  const now = Date.now();
  if (
    fighter.animationState.visualAction
    && fighter.animationState.visualAction !== 'idle'
    && (fighter.animationState.lockUntil === Number.POSITIVE_INFINITY || (Number.isFinite(fighter.animationState.lockUntil) && fighter.animationState.lockUntil > now))
  ) {
    return fighter.animationState.visualAction;
  }
  return 'idle';
}
function setFighterState(index, animation, reason = 'direct') {
  if (!state.match || index == null || !animation) return;
  const fighter = state.match.fighters[index];
  if (!fighter) return;
  const normalizedAction = normalizeAnimationAction(animation);
  const lockedAnimation = getTerminalAnimationForFighter(index, state.match);
  if (lockedAnimation && normalizedAction !== lockedAnimation) {
    console.info('[match] blocked animation overwrite', {
      reason,
      fighterId: fighter.id,
      slot: fighter.slot,
      side: fighter.side,
      attempted: normalizedAction,
      locked: lockedAnimation,
      status: state.match.finished ? 'finished' : 'active',
      winnerId: state.match.winnerId || null,
    });
    return;
  }
  fighter.state = lockedAnimation || normalizedAction;
}
function playFighterAnimation(index, animation, reason = 'play', { duration = 0, persistent = false, force = false } = {}) {
  if (!state.match || index == null || !animation) return;
  const fighter = state.match.fighters[index];
  if (!fighter) return;
  fighter.animationState ||= createAnimationState(fighter.state || 'idle');
  const lockedAnimation = getTerminalAnimationForFighter(index, state.match);
  const normalizedAction = lockedAnimation || normalizeAnimationAction(animation);
  const now = Date.now();
  const previousVisual = getFighterVisualAnimation(index, state.match);
  const hasActiveOneShotLock = previousVisual !== 'idle'
    && !fighter.animationState.persistentAction
    && Number.isFinite(fighter.animationState.lockUntil)
    && fighter.animationState.lockUntil > now;
  setFighterState(index, normalizedAction, reason);
  fighter.animationState.lastRequestedAction = normalizedAction;
  fighter.animationState.lastRequestSource = reason;
  console.info('[match] animation requested', {
    reason,
    fighterId: fighter.id,
    slot: fighter.slot,
    requested: normalizedAction,
    previousVisual,
    state: fighter.state,
    duration,
    persistent,
    force,
  });
  if (lockedAnimation || persistent) {
    fighter.animationState.visualAction = normalizedAction;
    fighter.animationState.persistentAction = normalizedAction;
    fighter.animationState.lockUntil = Number.POSITIVE_INFINITY;
  } else if (normalizedAction === 'idle') {
    fighter.animationState.persistentAction = null;
    if (hasActiveOneShotLock && !force) {
      console.info('[match] animation interrupted-blocked', {
        reason,
        fighterId: fighter.id,
        slot: fighter.slot,
        attempted: normalizedAction,
        activeVisual: previousVisual,
        lockUntil: fighter.animationState.lockUntil,
      });
    } else {
      fighter.animationState.visualAction = 'idle';
      fighter.animationState.lockUntil = now + Math.max(0, duration || 0);
    }
  } else {
    fighter.animationState.persistentAction = null;
    fighter.animationState.visualAction = normalizedAction;
    fighter.animationState.lockUntil = now + Math.max(0, duration || 0);
  }
  const nextVisual = getFighterVisualAnimation(index, state.match);
  const isActionChange = fighter.animationState?.currentAction !== nextVisual;
  const selection = selectCreatureAnimationState(fighter, nextVisual, { reroll: isActionChange });
  console.info('[match] animation applied', {
    reason,
    fighterId: fighter.id,
    slot: fighter.slot,
    requested: normalizedAction,
    applied: nextVisual,
    state: fighter.state,
    lockUntil: fighter.animationState.lockUntil,
    persistent: fighter.animationState.persistentAction,
  });
  state.match.animators?.[index]?.play(selection.action, undefined, {
    variant: selection.variant,
    src: selection.asset,
    fallbackSrc: getActionFallbackAsset(selection.action),
    timingMultiplier: selection.timingMultiplier,
  });
}
function setAllFighterStates(animation, reason = 'bulk') {
  if (!state.match || !animation) return;
  state.match.fighters.forEach((_, index) => setFighterState(index, animation, reason));
}
function restoreMatchAnimators({ force = false, source = 'restoreMatchAnimators' } = {}) {
  if (!state.match?.animators?.length) return;
  state.match.animators.forEach((animator, index) => {
    const fighter = state.match.fighters[index];
    const fighterState = getFighterVisualAnimation(index, state.match);
    const selection = selectCreatureAnimationState(fighter, fighterState, { reroll: false });
    const skipped = !force && animator.current?.stateName === fighterState && animator.current?.src === selection.asset;
    console.info('[match] animator restore', {
      source,
      fighterId: fighter?.id || null,
      slot: fighter?.slot || null,
      resolvedVisualAction: fighterState,
      currentAnimatorState: animator.current?.stateName || null,
      currentAnimatorSrc: animator.current?.src || null,
      nextAnimatorSrc: selection.asset,
      force,
      skipped,
    });
    if (skipped) return;
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
  const runId = state.activeMatchRunId;
  const matchId = state.match.id;
  const presentationToken = ensureMatchPresentation(state.match)?.token || 0;
  const canPresent = () => isActiveMatchRun(runId, matchId)
    && state.match?.id === matchId
    && (ensureMatchPresentation(state.match)?.token || 0) === presentationToken;
  const schedule = (fn, delay = 0) => {
    const guarded = () => {
      if (!canPresent()) return;
      fn();
    };
    if (delay <= 0) {
      guarded();
      return;
    }
    timers.push(window.setTimeout(guarded, delay));
  };
  actions.forEach((action) => {
    const startAt = Math.max(0, action.startAt || 0);
    schedule(() => {
      if (!consumePresentationEvent(`${action.eventId || `${action.type || 'action'}:${startAt}`}:visual`, {
        source: 'runMatchActionGroup',
        phase: 'visual',
        type: action.type || action.animation,
      })) return;
      if (action.animation === 'idle-all') {
        setAllFighterStates('idle', `${action.type || 'idle'}-state`);
        state.match.fighters.forEach((_, index) => playFighterAnimation(index, 'idle', `${action.type || 'idle'}-visual`, {
          duration: action.duration || totalDuration || 0,
        }));
      } else {
        playFighterAnimation(action.sourceIndex, action.animation, action.type || action.animation, {
          duration: action.duration || totalDuration || 0,
          persistent: action.animation === 'victory' || action.animation === 'defeat',
        });
        if (action.targetAnimation) {
          playFighterAnimation(action.targetIndex, action.targetAnimation, `${action.type || action.targetAnimation}-target`, {
            duration: action.targetDuration || action.duration || totalDuration || 0,
            persistent: action.targetAnimation === 'victory' || action.targetAnimation === 'defeat',
          });
        }
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
      schedule(() => {
        if (!consumePresentationEvent(`${action.eventId || `${action.type || 'action'}:${startAt}`}:sound`, {
          source: 'runMatchActionGroup',
          phase: 'sound',
          type: action.type || action.animation,
        })) return;
        if (action.soundGroup === 'result') playResultSfx(action.sound);
        else playBattleSfx(action.sound);
      }, startAt + (action.soundDelay ?? 0));
    }
    if (action.apply) {
      schedule(() => {
        if (!consumePresentationEvent(`${action.eventId || `${action.type || 'action'}:${startAt}`}:apply`, {
          source: 'runMatchActionGroup',
          phase: 'apply',
          type: action.type || action.animation,
        })) return;
        action.apply();
        if (Number.isInteger(action.targetIndex)) triggerFighterEffect(action.targetIndex, 'has-state-pop', 280);
        updateMatchUI();
      }, startAt + (action.applyDelay ?? 0));
    }
    if (action.log) {
      schedule(() => {
        if (!consumePresentationEvent(`${action.eventId || `${action.type || 'action'}:${startAt}`}:log`, {
          source: 'runMatchActionGroup',
          phase: 'log',
          type: action.type || action.animation,
        })) return;
        logLine(action.log);
      }, startAt + (action.logDelay ?? 0));
    }
  });
  await wait(totalDuration || 0);
  timers.forEach((timer) => window.clearTimeout(timer));
}
function buildTurnActionGroups(attackerIndex, defenderIndex, action) {
  const attacker = state.match.fighters[attackerIndex];
  const defender = state.match.fighters[defenderIndex];
  const turn = Number(state.match?.turn) || 0;
  const groups = [{
    duration: MATCH_ACTION_TIMINGS.recharge,
    actions: [{
      eventId: `turn:${turn}:recharge:${attacker.slot}`,
      type: 'recharge',
      sourceIndex: attackerIndex,
      targetIndex: defenderIndex,
      animation: 'recharge',
      sound: 'charge',
      soundDelay: MATCH_SOUND_OFFSETS.charge,
      duration: MATCH_ACTION_TIMINGS.recharge,
      log: `${attacker.name} charges a suspicious blast.`,
      logDelay: 120,
    }],
  }];
  if (action.type === 'backfire') {
    const nextHp = Math.max(0, attacker.hp - action.amount);
    const reactionType = nextHp <= 0 ? 'defeat' : 'hit';
    const reactionDuration = reactionType === 'defeat' ? MATCH_ACTION_TIMINGS.defeat : MATCH_ACTION_TIMINGS.hit;
    groups.push({
      duration: Math.max(MATCH_ACTION_TIMINGS.backfire, MATCH_ACTION_OVERLAP.backfireImpactLeadIn + reactionDuration),
      actions: [{
        eventId: `turn:${turn}:backfire:${attacker.slot}`,
        type: 'backfire',
        sourceIndex: attackerIndex,
        targetIndex: attackerIndex,
        animation: 'backfire',
        sound: 'backfire',
        soundDelay: MATCH_SOUND_OFFSETS.backfire,
        apply: () => applyCanonicalHpChange(attacker, nextHp, { source: 'local-sequence', eventId: `turn:${turn}:backfire:${attacker.slot}` }),
        applyDelay: MATCH_ACTION_OVERLAP.backfireImpactLeadIn,
        log: action.text,
        logDelay: MATCH_ACTION_OVERLAP.backfireImpactLeadIn,
      }, {
        eventId: `turn:${turn}:${reactionType}:${attacker.slot}`,
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
      eventId: `turn:${turn}:attack:${attacker.slot}`,
      type: 'attack',
      sourceIndex: attackerIndex,
      targetIndex: defenderIndex,
      animation: 'attack',
      sound: 'attack',
      soundDelay: MATCH_SOUND_OFFSETS.attack,
      duration: MATCH_ACTION_TIMINGS.attack,
    }, {
      eventId: `turn:${turn}:${reactionType}:${defender.slot}`,
      type: reactionType,
      sourceIndex: defenderIndex,
      targetIndex: defenderIndex,
      animation: reactionType,
      sound: reactionType,
      startAt: MATCH_ACTION_OVERLAP.attackImpactLeadIn,
      duration: reactionDuration,
      apply: () => applyCanonicalHpChange(defender, nextHp, { source: 'local-sequence', eventId: `turn:${turn}:${reactionType}:${defender.slot}` }),
      log: action.text,
    }],
  });
  return groups;
}
function isActiveMatchRun(runId, matchId) {
  return Boolean(state.match && state.activeMatchRunId === runId && state.match.id === matchId);
}
async function runMatchSequence() {
  const initialMatch = state.match;
  if (!initialMatch?.id) return;
  const runId = state.activeMatchRunId;
  const matchId = initialMatch.id;
  const guardActive = () => isActiveMatchRun(runId, matchId);
  const guardStep = async (step) => {
    if (!guardActive()) return false;
    await step();
    return guardActive();
  };
  const getFighters = () => (guardActive() ? state.match.fighters : []);
  audioManager.syncHomePlayback();
  invalidateMatchPresentation(state.match, 'run-sequence-start');
  if (!(await guardStep(() => runMatchAction({ eventId: 'match:intro', type: 'intro', animation: 'idle-all', sound: 'intro', soundGroup: 'result', duration: MATCH_ACTION_TIMINGS.intro })))) return;
  while (guardActive() && !state.match.finished) {
    state.match.turn += 1;
    state.match.lastAction = null;
    const attackerIndex = state.match.turn % 2 === 1 ? 0 : 1;
    const defenderIndex = attackerIndex === 0 ? 1 : 0;
    const fighters = getFighters();
    const attacker = fighters[attackerIndex];
    const defender = fighters[defenderIndex];
    if (!attacker || !defender) return;
    const turnAction = computeAction(attacker, defender, state.match.turn);
    for (const group of buildTurnActionGroups(attackerIndex, defenderIndex, turnAction)) {
      if (!guardActive()) return;
      if (!(await guardStep(() => runMatchActionGroup(group.actions, group.duration)))) return;
    }
    state.match.lastAction = turnAction.type;
    if (!(await guardStep(() => syncSharedMatchState({ lastAction: turnAction.type })))) return;
    const [a, b] = getFighters();
    if (!a || !b) return;
    if (a.hp <= 0 || b.hp <= 0 || state.match.turn >= 12) {
      if (guardActive()) await finishMatch({ runId, matchId });
      return;
    }
    if (!(await guardStep(() => runMatchAction({ eventId: `turn:${state.match.turn}:idle-all`, type: 'idle', animation: 'idle-all', duration: MATCH_ACTION_TIMINGS.idle })))) return;
  }
  if (!guardActive() || !state.match?.finished) return;
  resolveTerminalMatchVisualState('sequence-exit');
  if (state.screen === 'match') state.screen = 'postmatch';
  render();
}
async function finishMatch({ runId = state.activeMatchRunId, matchId = state.match?.id } = {}) {
  if (!isActiveMatchRun(runId, matchId) || !state.match?.fighters?.length) return;
  const [a, b] = state.match.fighters;
  if (!a || !b) return;
  state.match.finished = true;
  debugMatchLog('finished transition', {
    matchId: state.match.id,
    revision: state.match.revision || null,
    updatedAt: state.match.updatedAt || null,
  });
  console.info('[match] finish start', {
    status: 'finished',
    fighterA: { id: a.id, slot: a.slot, side: a.side, hp: a.hp },
    fighterB: { id: b.id, slot: b.slot, side: b.side, hp: b.hp },
  });
  if (a.hp === b.hp) {
    state.match.winnerId = null;
    state.match.loserId = null;
    state.match.winnerSlot = null;
    state.match.loserSlot = null;
    setAllFighterStates('idle', 'finish-draw');
    resolveTerminalMatchVisualState('finish-draw');
    await updateLeaderboardForResult(null, null, true);
    await runMatchAction({ eventId: 'match:draw', type: 'draw', animation: 'idle-all', sound: 'reveal', soundGroup: 'result', duration: MATCH_ACTION_TIMINGS.draw, log: 'Toxic draw: nobody actually collapses.' });
  } else {
    const winner = a.hp > b.hp ? a : b;
    const loser = winner === a ? b : a;
    state.match.winnerId = winner.id;
    state.match.loserId = loser.id;
    state.match.winnerSlot = winner.slot;
    state.match.loserSlot = loser.slot;
    debugMatchLog('final result resolved', {
      matchId: state.match.id,
      winnerId: winner.id,
      loserId: loser.id,
      winnerSlot: winner.slot,
      loserSlot: loser.slot,
      turn: state.match.turn,
    });
    winner.state = 'victory';
    loser.state = 'defeat';
    resolveTerminalMatchVisualState('finish-local');
    await runMatchAction({
      eventId: 'match:finish',
      type: 'finish',
      sourceIndex: winner === a ? 0 : 1,
      targetIndex: winner === a ? 1 : 0,
      animation: 'victory',
      targetAnimation: 'defeat',
      targetDuration: MATCH_ACTION_TIMINGS.defeat,
      sound: 'reveal',
      soundGroup: 'result',
      duration: MATCH_ACTION_TIMINGS.victory,
      log: `${winner.name} triumphs in the greenish haze.`,
    });
    playResultSfx('victory');
    playResultSfx('defeat');
    if (winner.id === state.me?.id) {
      updateGoblinProgression((current) => {
        const nextWins = Math.max(0, Math.floor(Number(current.wins) || 0)) + 1;
        const milestoneReward = awardCreatureBonusAtThreeWinMilestone(nextWins, current.permanentCombatBonuses);
        return {
          wins: nextWins,
          level: Math.max(1, Math.floor(nextWins / 3) + 1),
          permanentCombatBonuses: milestoneReward.bonuses,
        };
      });
    }
    await updateLeaderboardForResult(winner, loser, false);
  }
  if (!isActiveMatchRun(runId, matchId) || !state.match) return;
  state.screen = 'postmatch';
  render();
  restoreMatchAnimators({ force: true, source: 'finishMatch:post-render' });
  syncSharedMatchResult();
}

function renderAnimatedPreview(label = '', variantIndex = state.me?.variantIndex, extraAttributes = '', className = 'goblin-frame home-preview-render') {
  return `
    <div class="${className}" data-home-animator="${label}" data-variant-index="${variantIndex ?? ''}" ${extraAttributes}>
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
  const candidate = getFeaturedFighterCandidate();
  const isSelected = Boolean(state.selectedCreature && state.selectedCreature.id === candidate.id);
  const isSavedGoblin = Boolean(state.selectedCreature && state.selectedCreature.id === candidate.id);
  const isChallengerView = state.homeView === 'challenger' && state.pendingMatch?.payload?.playerA?.id === state.me.id;
  const liveItems = [
    { label: 'Live arenas', value: state.pendingMatch?.opponentJoined ? '01' : '03', meta: state.pendingMatch?.opponentJoined ? 'A lobby is about to pop off.' : 'Goblins are hunting for challengers.' },
    { label: 'Recent winner', value: 'Bogbelch', meta: 'Wrapped up a duel in 52 sec.' },
    { label: 'Fresh lobby', value: 'Share link', meta: 'Create a match and send it in 1 tap.' },
  ];
  const leaderboardPreview = (state.leaderboard.rating?.length ? state.leaderboard.rating : state.leaderboard.daily).slice(0, 3);
  const copyFeedbackMarkup = state.copyFeedback
    ? `<div class="copy-feedback" aria-live="polite">${state.copyFeedback}</div>`
    : '<div class="copy-feedback sr-only" aria-live="polite"></div>';



  const challengePanel = isChallengerView ? `
    <div id="home-challenge-controls" class="world-card challenge-card challenge-card-active card-lift">
      <div class="section-heading compact">
        <span class="section-kicker">Live lobby</span>
        <h3>Challenge link ready</h3>
      </div>
      ${renderShareLinkRow(state.pendingMatch.link, { buttonClass: 'btn-primary btn-bounce share-link-copy', buttonLabel: 'Copy link' })}
      <div id="home-status-text">${copyFeedbackMarkup}</div>
      <div class="status-chip-row">
        <span class="status-chip chip-bounce" data-live="true">${state.pendingMatch.payload.status === 'active' ? 'Match active' : 'Waiting for Player B'}</span>
        <span class="status-chip chip-bounce">Player B · ${escapeHtml(state.pendingMatch.payload.playerB?.name || 'Not connected')}</span>
      </div>
    </div>` : state.pendingMatch ? `
    <div id="home-challenge-controls" class="world-card challenge-card card-lift">
      <div class="section-heading compact">
        <span class="section-kicker">Share challenge</span>
        <h3>Link ready for the showdown</h3>
      </div>
      <p class="muted challenge-card-text">Create the match without leaving Home, then send the link to Player B.</p>
      ${renderShareLinkRow(state.pendingMatch.link, { buttonClass: 'btn-primary btn-bounce share-link-copy', buttonLabel: 'Copy link' })}
      <div id="home-status-text">${copyFeedbackMarkup}</div>
      ${state.pendingMatch.opponentJoined ? '<p class="muted challenge-card-text">Opponent found: the match will start on its own.</p>' : ''}
    </div>` : `
    <div id="home-challenge-controls" class="hero-cta-block cta-alive card-lift">
      <div class="inline-actions hero-actions">
        <button class="btn-primary hero-cta btn-bounce" id="home-create" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Creating…' : 'Create match'}</button>
      </div>
      <p id="home-status-text" class="cta-note">Create a link, send it, fight live. Average match: ~45–60 sec.</p>
      <div class="how-it-works" aria-label="How it works">
        <div class="flow-chip chip-bounce"><span>1</span>Create match</div>
        <div class="flow-chip chip-bounce"><span>2</span>Share link</div>
        <div class="flow-chip chip-bounce"><span>3</span>Fight live</div>
      </div>
    </div>`;

  return `
    <section id="home-main" class="home-layout screen-panel">
      <section class="panel hero hero-redesign world-card main-showcase" style="--home-world-image:url('${HOME_WORLD_BACKGROUND}')">
        <div class="hero-atmosphere" aria-hidden="true">
          <span class="world-wash"></span>
          <span class="mist mist-a"></span>
          <span class="mist mist-b"></span>
          <span class="spark spark-a"></span>
          <span class="spark spark-b"></span>
        </div>
        <div class="hero-copy">
          <h1>Fast goblin duels in a bright little cartoon world.</h1>
          <div class="hero-meta">
            <div class="meta-pill card-lift"><strong>Avg match</strong><span>45–60 sec</span></div>
            <div class="meta-pill card-lift"><strong>Mode</strong><span>Share link multiplayer</span></div>
            <div class="meta-pill card-lift"><strong>Mood</strong><span>Green cartoon mischief</span></div>
          </div>
          ${challengePanel}
        </div>
        <aside class="featured-fighter world-card card-lift" id="featured-fighter">
          <div id="featured-fighter-content" class="featured-fighter-content">
            <div class="section-heading compact">
              <span class="section-kicker">Featured fighter</span>
              <h3 id="featured-fighter-name">${escapeHtml(candidate.name)}</h3>
            </div>
            <div id="featured-fighter-label-row" class="featured-fighter-label-row">
              ${isSavedGoblin ? '<span class="featured-fighter-tag">Your goblin · Saved locally</span>' : '<span class="featured-fighter-tag is-preview">Preview candidate</span>'}
            </div>
            <div class="fighter-showcase idle-float">
              <div id="featured-preview" class="goblin-frame home-preview-render" aria-live="polite">
                <canvas class="sprite-canvas" aria-hidden="true"></canvas>
                <div class="sprite-fallback" hidden></div>
              </div>
            </div>
            <p id="featured-fighter-copy" class="subtext">${isSavedGoblin ? getFeaturedFighterSummary(candidate, { isSavedGoblin }) : 'Small, loud, unpredictable. Built for ridiculous live duels.'}</p>
            ${isChallengerView ? `<div id="featured-fighter-supporting" class="subtext">Match ID: ${escapeHtml(state.pendingMatch.payload.id)}</div>` : '<div id="featured-fighter-supporting" class="subtext" hidden></div>'}
          </div>
          <div class="featured-fighter-actions">
            <button id="featured-skip" class="ghost btn-ghost btn-bounce" type="button">Skip</button>
            <button id="featured-choose" class="btn-primary btn-bounce" type="button" ${isSelected ? 'disabled' : ''}>${isSelected ? 'Current fighter' : 'Choose'}</button>
          </div>
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
                  <strong>${escapeHtml(row.name)}</strong>
                  <span>${row.wins}W · ${row.losses}L · ${row.draws}D</span>
                </div>
                <div class="preview-score">${row.rating || row.wins}</div>
              </article>`).join('') : '<div class="leaderboard-empty">The leaderboard will fill up after the first few matches.</div>'}
          </div>
          <div class="footer-actions align-start">
            <button class="ghost btn-ghost btn-bounce" id="home-leaderboard">Open leaderboard</button>
          </div>
        </section>
      </section>
    </section>`;
}
function syncFeaturedPreview(candidate = getFeaturedFighterCandidate()) {
  const container = document.getElementById('featured-preview');
  if (!container) return;
  const animator = state.featuredPreviewAnimator;
  if (!animator || animator.host !== container) {
    state.featuredPreviewAnimator?.destroy?.();
    state.featuredPreviewAnimator = new SpriteSheetAnimator(container, {
      variant: candidate.variant,
    });
  } else {
    state.featuredPreviewAnimator.setVariant(candidate.variant);
  }
  const previewAnimator = state.featuredPreviewAnimator;
  if (!previewAnimator) return;
  previewAnimator.play(candidate.animation.action, undefined, {
    variant: candidate.animation.variant,
    timingMultiplier: candidate.animation.timingMultiplier,
  });
}
function updateFeaturedFighter(candidate = getFeaturedFighterCandidate()) {
  const isSelected = Boolean(state.selectedCreature && state.selectedCreature.id === candidate.id);
  const isSavedGoblin = isSelected;
  const nameNode = document.getElementById('featured-fighter-name');
  const labelNode = document.getElementById('featured-fighter-label-row');
  const copyNode = document.getElementById('featured-fighter-copy');
  const supportingNode = document.getElementById('featured-fighter-supporting');
  const chooseButton = document.getElementById('featured-choose');
  if (nameNode) nameNode.textContent = candidate.name;
  if (labelNode) {
    labelNode.innerHTML = isSavedGoblin
      ? '<span class="featured-fighter-tag">Your goblin · Saved locally</span>'
      : '<span class="featured-fighter-tag is-preview">Preview candidate</span>';
  }
  if (copyNode) copyNode.textContent = getFeaturedFighterSummary(candidate, { isSavedGoblin });
  if (supportingNode) {
    if (state.pendingMatch && state.homeView === 'challenger') {
      supportingNode.hidden = false;
      supportingNode.textContent = `Match ID: ${state.pendingMatch.payload.id}`;
    } else {
      supportingNode.hidden = true;
      supportingNode.textContent = '';
    }
  }
  if (chooseButton) {
    chooseButton.disabled = isSelected;
    chooseButton.textContent = isSelected ? 'Current fighter' : 'Choose';
  }
  syncFeaturedPreview(candidate);
}
function chooseCurrentFeaturedFighter() {
  const candidate = getFeaturedFighterCandidate();
  replaceSavedGoblin(candidate);
  state.currentCandidateCreature = null;
  updateFeaturedFighter(state.selectedCreature);
}
function skipFeaturedFighter() {
  if (state.featuredFighterTransitioning) return;
  const nextCandidate = ensureCurrentCandidateCreature(true);
  const contentNode = document.getElementById('featured-fighter-content');
  const skipButton = document.getElementById('featured-skip');
  const transitionToken = state.featuredFighterTransitionToken + 1;
  state.featuredFighterTransitionToken = transitionToken;
  window.clearTimeout(state.featuredFighterTransitionTimer);
  if (skipButton) skipButton.disabled = true;
  if (!contentNode || state.reducedMotion) {
    updateFeaturedFighter(nextCandidate);
    if (skipButton) skipButton.disabled = false;
    state.featuredFighterTransitioning = false;
    return;
  }
  state.featuredFighterTransitioning = true;
  contentNode.classList.remove('is-transitioning-in');
  void contentNode.offsetWidth;
  contentNode.classList.add('is-transitioning-out');
  state.featuredFighterTransitionTimer = window.setTimeout(() => {
    if (state.featuredFighterTransitionToken !== transitionToken) return;
    updateFeaturedFighter(nextCandidate);
    contentNode.classList.remove('is-transitioning-out');
    contentNode.classList.add('is-transitioning-in');
    state.featuredFighterTransitionTimer = window.setTimeout(() => {
      if (state.featuredFighterTransitionToken !== transitionToken) return;
      contentNode.classList.remove('is-transitioning-in');
      state.featuredFighterTransitioning = false;
      if (skipButton) skipButton.disabled = false;
    }, FEATURED_FIGHTER_TRANSITION_MS);
  }, FEATURED_FIGHTER_TRANSITION_MS);
}
function bindHomeFeaturedFighterControls() {
  state.featuredFighterTransitioning = false;
  window.clearTimeout(state.featuredFighterTransitionTimer);
  document.getElementById('featured-skip')?.addEventListener('click', skipFeaturedFighter);
  document.getElementById('featured-choose')?.addEventListener('click', chooseCurrentFeaturedFighter);
  updateFeaturedFighter(getFeaturedFighterCandidate());
}

function renderCreate() {
  return `
    <section class="panel screen-panel">
      <h1 class="screen-title">Create match</h1>
      <p class="muted">Copy and send this link to your opponent. The shared match waits on the backend until they join.</p>
      ${renderShareLinkRow(state.pendingMatch.link, { buttonClass: 'btn-bounce share-link-copy', buttonLabel: 'Copy link' })}
      <div class="copy-feedback" aria-live="polite">${state.copyFeedback}</div>
      <p class="muted">This screen checks the shared match every few seconds. When Player B joins, the match starts here automatically with no refresh needed.</p>
      <div class="goblin-preview" style="margin-top:18px;">
        ${renderAnimatedPreview('create', state.pendingMatch.payload.playerA.variantIndex)}
        <div class="nameplate">${escapeHtml(state.pendingMatch.payload.playerA.name)}</div>
      </div>
    </section>`;
}
function getSharedMatchProgress(sharedMatch) {
  const snapshot = buildCanonicalMatchSnapshot(sharedMatch, { previousMatch: state.match });
  return {
    snapshot,
    revision: snapshot.revision,
    updatedAt: snapshot.updatedAt,
    finished: snapshot.finished,
    winnerId: snapshot.winnerId,
    loserId: snapshot.loserId,
  };
}
function isSharedSnapshotNewer(incomingSnapshot, currentSnapshot = state.match) {
  if (!incomingSnapshot?.id) return false;
  if (!currentSnapshot?.id) return true;
  const progressComparison = compareMatchProgress(incomingSnapshot, currentSnapshot);
  if (progressComparison.direction !== 0) return progressComparison.direction > 0;
  const incomingRevision = Number(incomingSnapshot.revision);
  const currentRevision = Number(currentSnapshot.revision);
  if (Number.isFinite(incomingRevision) && Number.isFinite(currentRevision) && incomingRevision !== currentRevision) {
    return incomingRevision > currentRevision;
  }
  const incomingUpdatedAt = Date.parse(incomingSnapshot.updatedAt || '');
  const currentUpdatedAt = Date.parse(currentSnapshot.updatedAt || '');
  if (Number.isFinite(incomingUpdatedAt) && Number.isFinite(currentUpdatedAt) && incomingUpdatedAt !== currentUpdatedAt) {
    return incomingUpdatedAt > currentUpdatedAt;
  }
  return false;
}
// Shared snapshots may replace local combat state only when their combat progress is ahead; revision/updatedAt only break exact ties.
function getSharedHydrationDecision(sharedMatch, currentSnapshot = state.match) {
  if (!sharedMatch?.id || !sharedMatch?.sharedState) {
    return { accept: false, reason: 'missing-shared-state', snapshot: null };
  }
  const incomingSnapshot = buildCanonicalMatchSnapshot(sharedMatch, { previousMatch: currentSnapshot });
  const accept = isSharedSnapshotNewer(incomingSnapshot, currentSnapshot);
  const reason = !currentSnapshot ? 'no-local-snapshot' : accept ? 'newer-shared-snapshot' : 'stale-or-duplicate-shared-snapshot';
  const progressComparison = compareMatchProgress(incomingSnapshot, currentSnapshot);
  debugMatchLog('hydration decision', {
    matchId: sharedMatch.id,
    reason,
    currentRevision: currentSnapshot?.revision || null,
    incomingRevision: incomingSnapshot.revision || null,
    currentUpdatedAt: currentSnapshot?.updatedAt || null,
    incomingUpdatedAt: incomingSnapshot.updatedAt || null,
    finished: incomingSnapshot.finished,
    winnerId: incomingSnapshot.winnerId,
    loserId: incomingSnapshot.loserId,
    progressField: progressComparison.field,
    progressDirection: progressComparison.direction,
    currentProgress: progressComparison.right.progressKey,
    incomingProgress: progressComparison.left.progressKey,
  });
  return { accept, reason, snapshot: incomingSnapshot };
}
function hydrateMatchFromSharedState(sharedMatch) {
  const previousMatch = state.match;
  const decision = getSharedHydrationDecision(sharedMatch, previousMatch);
  if (!decision.accept || !decision.snapshot) return { transitionedToPostmatch: false, resolvedTerminalState: false, accepted: false };
  state.match = decision.snapshot;
  ensureMatchPresentation(state.match).lastHydratedProgressKey = getMatchCombatProgress(decision.snapshot).progressKey;
  invalidateMatchPresentation(state.match, 'hydrate-shared');
  state.logs = [...decision.snapshot.logs];
  const resolvedTerminalState = resolveTerminalMatchVisualState('hydrate-shared');
  const transitionedToPostmatch = Boolean(decision.snapshot.finished && state.screen === 'match');
  if (transitionedToPostmatch) state.screen = 'postmatch';
  debugMatchLog('hydration applied', {
    matchId: sharedMatch.id,
    previousProgress: getMatchCombatProgress(previousMatch).progressKey,
    nextProgress: getMatchCombatProgress(decision.snapshot).progressKey,
  });
  return { transitionedToPostmatch, resolvedTerminalState, accepted: true };
}

function renderShareLinkRow(url, { buttonClass = 'btn-bounce', buttonLabel = 'Copy link' } = {}) {
  const safeUrl = escapeHtml(url || '');
  const safeButtonClass = escapeHtml(buttonClass);
  const safeButtonLabel = escapeHtml(buttonLabel);
  return `<div class="share-link-row">
    <input class="share-link-input" type="text" value="${safeUrl}" title="${safeUrl}" aria-label="Generated match link" readonly spellcheck="false" autocomplete="off">
    <button id="copy-link" class="share-link-copy ${safeButtonClass}" type="button">${safeButtonLabel}</button>
  </div>`;
}

function renderJoin() {
  const playerB = state.pendingMatch.payload.playerB;
  return `
    <section class="panel hero hero-redesign world-card join-screen screen-panel">
      <div>
        <div class="section-heading compact">
          <span class="section-kicker">Lobby accepted</span>
          <h1 class="screen-title">Opponent found</h1>
        </div>
        <p class="muted">You are Player B. The goblins are marching into the arena…</p>
        <div class="info-card world-card card-lift">
          <strong>Host</strong><br/>${escapeHtml(state.pendingMatch.payload.playerA.name)}
        </div>
      </div>
      <div class="goblin-preview">
        ${renderAnimatedPreview('join', playerB.variantIndex)}
        <div class="nameplate">${escapeHtml(playerB.name)}</div>
        <div class="subtext">Get ready: the match starts by itself in a moment.</div>
      </div>
    </section>`;
}
function renderMatchOrPost() {
  const isPost = state.screen === 'postmatch';
  const resolvedWinner = getCanonicalWinner(state.match);
  const result = resolvedWinner
    ? `${escapeHtml(resolvedWinner.name)} wins!`
    : 'Draw!';
  return `
    <section class="panel match-layout world-card screen-panel">
      <div class="match-shell">
        <div class="match-head">
          <div class="match-meta">
            <div class="section-heading compact">
              <span class="section-kicker">Live arena</span>
              <h1 class="screen-title">${isPost ? 'Match result' : 'Match'}</h1>
            </div>
            <div class="match-status-cluster">
              <span class="status-chip chip-bounce" data-turn-counter>Turn ${state.match.turn}</span>
              <span class="status-chip chip-bounce" data-live="true">${isPost ? 'Fight ended' : 'Fight in progress'}</span>
            </div>
          </div>
          ${isPost ? `<div class="result-banner"><strong>${result}</strong>${resolvedWinner ? '' : 'Both fighters survive the final stink burst.'}</div>
          ${state.resultApplyFeedback ? `<div class="copy-feedback" aria-live="polite">${escapeHtml(state.resultApplyFeedback)}</div>` : ''}` : ''}
        </div>
        <div class="match-content-row">
          <div class="match-main match-arena-column">
            <div class="arena-shell">
              <section class="arena world-card">
                <div class="arena-background" aria-hidden="true" style="--arena-image:url('${ARENA_BACKGROUND}')"></div>
                <div class="arena-floor" aria-hidden="true"></div>
                ${state.match.fighters.map((fighter, index) => `
                  <article class="fighter fighter-${fighter.side}" data-fighter="${index}" data-canonical-hp="${fighter.hp}" data-displayed-hp="${Number.isFinite(Number(fighter.displayedHp)) ? fighter.displayedHp : fighter.hp}">
                    <div class="fighter-header ${fighter.side === 'left' ? 'align-left' : 'align-right'}" data-fighter-header="${index}">
                      <div class="fighter-label-row">
                        <span class="fighter-side">${getMatchPlayerLabel(fighter.slot)}</span>
                        <span class="fighter-state" data-fighter-state="${index}">${getFighterVisualAnimation(index, state.match)}</span>
                      </div>
                      <div class="nameplate">${escapeHtml(fighter.name)}</div>
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
                    <div class="health-bar" data-hp-wrap="${index}"><div class="health-fill" data-hp="${index}" style="--hp:${Number.isFinite(Number(fighter.displayedHp)) ? fighter.displayedHp : fighter.hp}%"></div></div>
                  </article>`).join('')}
              </section>
            </div>
          </div>
          <aside class="match-sidebar match-feed-column">
            <div class="battle-log-wrap">
              <div class="log-panel world-card battle-feed-card">
                <div class="log-head-row">
                  <div class="log-heading-group">
                    <p class="log-heading">Battle Feed</p>
                    <p class="log-subheading">Compact combat updates stay pinned in the side panel for quick scanning.</p>
                  </div>
                  <span class="status-chip" data-live="true">Live feed</span>
                </div>
                <div id="log-lines" class="battle-feed battle-feed-card__body" aria-live="polite" aria-atomic="false">
                  ${renderBattleLogEntries()}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>`;
}
function clampLeaderboardPage(type, totalEntries) {
  const totalPages = Math.max(1, Math.ceil(totalEntries / LEADERBOARD_PAGE_SIZE));
  const nextPage = Math.min(Math.max(1, Number(state.leaderboardPage[type]) || 1), totalPages);
  state.leaderboardPage = { ...state.leaderboardPage, [type]: nextPage };
  return totalPages;
}
function setLeaderboardPage(type, page) {
  const totalPages = Math.max(1, Math.ceil((state.leaderboard[type]?.length || 0) / LEADERBOARD_PAGE_SIZE));
  const nextPage = Math.min(Math.max(1, page), totalPages);
  if (state.leaderboardPage[type] === nextPage) return;
  state.leaderboardPage = { ...state.leaderboardPage, [type]: nextPage };
  render();
}
function getFeaturedFighterRankMeta(candidate = getFeaturedFighterCandidate()) {
  const playerId = candidate?.id || state.me?.id || state.selectedCreature?.id;
  if (!playerId) return 'Unranked';
  const ratingRank = state.leaderboard.rating.findIndex((row) => row.playerId === playerId);
  if (ratingRank >= 0) return `Rank #${ratingRank + 1}`;
  const dailyRank = state.leaderboard.daily.findIndex((row) => row.playerId === playerId);
  if (dailyRank >= 0) return `Today #${dailyRank + 1}`;
  return 'Unranked';
}
function getFeaturedFighterSummary(candidate = getFeaturedFighterCandidate(), { isSavedGoblin = false } = {}) {
  if (!isSavedGoblin) return 'Choose to save this goblin locally, or skip to preview another candidate.';
  return `${getFeaturedFighterRankMeta(candidate)} · ${candidate.wins || 0} wins · Level ${candidate.level || 1}`;
}
function renderLeaderboardRows(rows, type, page = 1) {
  const pageOffset = (page - 1) * LEADERBOARD_PAGE_SIZE;
  return rows.map((row, index) => {
    const rank = pageOffset + index + 1;
    const isTopThree = rank <= 3;
    const badge = rank === 1 ? 'Crown' : rank === 2 ? 'Silver' : rank === 3 ? 'Bronze' : null;
    const primaryValue = type === 'rating'
      ? `<div class="leaderboard-score">${row.rating}<span>rating</span></div>`
      : `<div class="leaderboard-score">${row.wins}<span>wins</span></div>`;
    return `<article class="leaderboard-entry card-lift ${isTopThree ? `podium podium-${rank}` : ''}">
      <div class="leaderboard-main">
        <div class="leaderboard-identity">
          <div class="leaderboard-identity-meta">
            <span class="leaderboard-rank">#${rank}</span>
            <div class="leaderboard-name">${escapeHtml(row.name)}</div>
            ${badge ? `<div class="leaderboard-badge">${badge}</div>` : ''}
          </div>
        </div>
        <div class="leaderboard-stats">
          <span>W ${row.wins}</span><span>L ${row.losses}</span><span>D ${row.draws}</span><span>${row.matchesPlayed} ${row.matchesPlayed === 1 ? 'match' : 'matches'}</span><span>${row.winRate}% WR</span>
        </div>
      </div>
      ${primaryValue}
    </article>`;
  }).join('');
}
function renderLeaderboardSection(title, description, rows, status, type) {
  const message = status === 'loading'
    ? 'Loading…'
    : status === 'error'
      ? 'Unable to load this leaderboard.'
      : 'No results yet.';
  const totalPages = clampLeaderboardPage(type, rows.length);
  const currentPage = state.leaderboardPage[type];
  const startIndex = (currentPage - 1) * LEADERBOARD_PAGE_SIZE;
  const paginatedRows = rows.slice(startIndex, startIndex + LEADERBOARD_PAGE_SIZE);
  const showPagination = rows.length > LEADERBOARD_PAGE_SIZE;
  return `<section class="leaderboard-section leaderboard-section-${type} world-card card-lift">
    <div class="leaderboard-section-head">
      <div class="leaderboard-section-title">
        <p class="leaderboard-kicker">${type === 'daily' ? 'Daily board' : 'Global ladder'}</p>
        <h2>${title}</h2>
      </div>
      <p class="muted">${description}</p>
    </div>
    <div class="leaderboard-list list-stagger">
      ${rows.length ? renderLeaderboardRows(paginatedRows, type, currentPage) : `<div class="leaderboard-empty">${message}</div>`}
    </div>
    <div class="leaderboard-section-footer">
      <div class="leaderboard-section-meta">
        <span class="leaderboard-section-count muted">${rows.length ? `${rows.length} total contenders` : message}</span>
        ${showPagination ? `<div class="leaderboard-pagination" aria-label="${title} pages">
          <button class="leaderboard-page-btn ghost btn-ghost" data-page-dir="prev" data-page-type="${type}" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous ${title} page">‹</button>
          <span class="leaderboard-page-indicator">${currentPage} / ${totalPages}</span>
          <button class="leaderboard-page-btn ghost btn-ghost" data-page-dir="next" data-page-type="${type}" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next ${title} page">›</button>
        </div>` : '<span class="leaderboard-pagination-spacer" aria-hidden="true"></span>'}
      </div>
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
        </div>
      </div>
      <div class="leaderboard-columns">
        ${renderLeaderboardSection('Daily leaderboard', `Today's results (${LEADERBOARD_DAY_TIMEZONE}).`, state.leaderboard.daily, state.leaderboardStatus.daily, 'daily')}
        ${renderLeaderboardSection('Global rating leaderboard', 'Persistent rating with a starting Elo of 1000.', state.leaderboard.rating, state.leaderboardStatus.rating, 'rating')}
      </div>
    </section>`;
}
function render() {
  if (state.screen === 'home') audioManager.initializeForHome();
  window.clearTimeout(state.featuredFighterTransitionTimer);
  state.featuredFighterTransitionTimer = null;
  state.featuredFighterTransitioning = false;
  state.previewAnimators.forEach((animator) => animator.destroy?.());
  state.previewAnimators = [];
  state.featuredPreviewAnimator?.destroy?.();
  state.featuredPreviewAnimator = null;
  const app = document.getElementById('app');
  if (!app) {
    console.warn('Missing element: app');
    return;
  }
  app.innerHTML = `
    <main class="app-shell">
      <nav id="primary-nav" class="topbar world-card">
        <div class="brand-pill">
          <span class="brand-mark">FF</span>
          <div>
            <strong>Fart & Furious</strong>
          </div>
        </div>
        <div class="topbar-nav">
          <ul class="topbar-nav-list" role="list">
            <li><button class="nav-pill btn-bounce ${state.screen === 'home' ? 'is-active' : ''}" id="nav-home">Home</button></li>
            ${state.screen === 'home' || state.screen === 'boot' ? '' : `<li><button class="nav-pill nav-pill-accent btn-bounce" id="nav-create" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Creating…' : 'Create match'}</button></li>`}
            <li><button class="nav-pill btn-bounce ${state.screen === 'leaderboard' ? 'is-active' : ''}" id="nav-leaderboard">Leaderboard</button></li>
          </ul>
        </div>
        <div class="audio-controls" aria-label="Audio controls">
          <button class="ghost audio-toggle nav-pill btn-bounce" id="audio-toggle">${audioManager.preferences.muted || audioManager.preferences.volume === 0 ? '🔇' : '🔊'}</button>
          <label class="audio-slider-wrap" for="audio-volume">
            <span>Vol</span>
            <input id="audio-volume" type="range" min="0" max="100" value="${Math.round(audioManager.preferences.volume * 100)}" />
          </label>
        </div>
      </nav>
      ${state.loading ? renderStatusCard('Connecting to the shared match', 'Syncing the Lite match with the shared backend…') : ''}
      ${state.screen === 'boot' ? renderStatusCard('Opening the shared match', 'Resolving the shared link before showing the lobby or the match…', { showHomeButton: false }) : ''}
      ${state.screen === 'home' ? renderHome() : ''}
      ${state.screen === 'create' ? renderCreate() : ''}
      ${state.screen === 'join' ? renderJoin() : ''}
      ${state.screen === 'match' || state.screen === 'postmatch' ? renderMatchOrPost() : ''}
      ${state.screen === 'leaderboard' ? renderLeaderboard() : ''}
      ${state.screen === 'error' ? renderStatusCard('Shared match problem', state.errorMessage) : ''}
    </main>`;

  document.getElementById('nav-home')?.addEventListener('click', resetToHome);
  document.getElementById('home-leaderboard')?.addEventListener('click', showLeaderboardScreen);
  document.getElementById('status-home')?.addEventListener('click', resetToHome);
  document.getElementById('nav-create')?.addEventListener('click', startCreateFlow);
  document.getElementById('audio-toggle')?.addEventListener('click', () => {
    audioManager.setMuted(!audioManager.preferences.muted);
    playUiSfx('audioToggle');
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
  document.querySelectorAll('[data-page-type][data-page-dir]').forEach((button) => {
    button.addEventListener('click', () => {
      const { pageType, pageDir } = button.dataset;
      if (!pageType || !pageDir) return;
      const delta = pageDir === 'next' ? 1 : -1;
      setLeaderboardPage(pageType, (state.leaderboardPage[pageType] || 1) + delta);
    });
  });
  document.getElementById('copy-link')?.addEventListener('click', async () => {
    const copyButton = document.getElementById('copy-link');
    try {
      await navigator.clipboard.writeText(state.pendingMatch.link);
      state.copyFeedback = 'Link copied!';
      playUiSfx('copySuccess');
      copyButton?.classList.add('copy-success');
      triggerTemporaryClass(copyButton, 'is-pop', 230);
      logLine('Link copied to the clipboard.');
    } catch {
      state.copyFeedback = 'Copy unavailable — use manual copy.';
      logLine('Manual copy needed: the browser will not allow clipboard access.');
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

  document.querySelectorAll('[data-home-animator]').forEach((node) => {
    if (node.id === 'featured-preview') return;
    const variantIndex = Number(node.dataset.variantIndex);
    const animator = new SpriteSheetAnimator(node, {
      variant: Number.isInteger(variantIndex) ? PALETTE_VARIANTS[variantIndex] : null,
    });
    state.previewAnimators.push(animator);
    animator.playSheet(HOME_ANIMATION);
  });

  if (state.screen === 'home') bindHomeFeaturedFighterControls();

  if (state.screen === 'match' || state.screen === 'postmatch') {
    const nodes = [...document.querySelectorAll('[data-animator]')];
    const previous = state.match.animators || [];
    const canReuse = previous.length === nodes.length;
    preloadBattleAnimationAssets();
    state.match.animators = nodes.map((node, index) => {
      const existing = canReuse ? previous[index] : null;
      const recreated = Boolean(existing);
      if (existing) {
        existing.destroy?.();
      }
      console.info('[match] animator instance prepared', {
        source: 'render',
        fighterId: state.match.fighters[index]?.id || null,
        slot: state.match.fighters[index]?.slot || null,
        recreated,
      });
      return new SpriteSheetAnimator(node, {
      flip: state.match.fighters[index].side === 'left' ? -1 : 1,
      variant: state.match.fighters[index].variant,
    });
    });
    previous.forEach((animator, index) => { if (!canReuse || !state.match.animators[index]) animator.destroy?.(); });
    restoreMatchAnimators({ force: true, source: 'render:match-animators' });
  }

  attachButtonJuice(app);
  refreshAudioControlsUI();
}

function bootApp() {
  audioManager.initializeForHome();
  const joinMatchId = parseJoinMatchId();
  if (joinMatchId) {
    logSharedLink('boot-app-join-detected', { matchId: joinMatchId });
    state.screen = 'boot';
    render();
    startJoinedFlow(joinMatchId);
    return;
  }
  render();
}

bindReducedMotionPreference();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp, { once: true });
} else {
  bootApp();
}
