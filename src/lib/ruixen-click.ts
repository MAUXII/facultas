/** Ticks de clique estilo Ruixen UI (Web Audio). */

export type ClickSoundKind = "nav" | "action" | "tab" | "soft";

type SoundPreset = {
  duration: number;
  gain: number;
  noise: number;
  sineFreq: number | null;
  sineGain: number;
};

const PRESETS: Record<ClickSoundKind, SoundPreset> = {
  nav: {
    duration: 0.004,
    gain: 0.07,
    noise: 1,
    sineFreq: 920,
    sineGain: 0.03,
  },
  action: {
    duration: 0.006,
    gain: 0.09,
    noise: 0.7,
    sineFreq: 640,
    sineGain: 0.05,
  },
  tab: {
    duration: 0.003,
    gain: 0.055,
    noise: 1,
    sineFreq: null,
    sineGain: 0,
  },
  soft: {
    duration: 0.0035,
    gain: 0.05,
    noise: 0.85,
    sineFreq: 1180,
    sineGain: 0.02,
  },
};

let audioCtx: AudioContext | null = null;
let lastPlayedAt = 0;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext ||
      (
        window as unknown as {
          webkitAudioContext: typeof AudioContext;
        }
      ).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

export function playRuixenClick(kind: ClickSoundKind = "soft") {
  const now = performance.now();
  if (now - lastPlayedAt < 30) return;
  lastPlayedAt = now;

  const ctx = getCtx();
  if (!ctx) return;

  const preset = PRESETS[kind];
  const len = Math.max(1, (ctx.sampleRate * preset.duration) | 0);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < len; i++) {
    const env = (1 - i / len) ** 4;
    const noise = (Math.random() * 2 - 1) * preset.noise * env;
    const sine =
      preset.sineFreq == null
        ? 0
        : Math.sin((2 * Math.PI * preset.sineFreq * i) / ctx.sampleRate) *
          preset.sineGain *
          env;
    data[i] = noise * 0.7 + sine;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = preset.gain;
  source.connect(gain).connect(ctx.destination);
  source.start();
}
