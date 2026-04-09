// ---------------------------------------------------------
// 사운드 생성기 (Web Audio API)
// ---------------------------------------------------------
export let audioCtx: AudioContext;

export function initAudioContext(ctx: any) {
  if (!audioCtx) audioCtx = ctx;
}

function playSound(freq: number, type: OscillatorType, duration: number, volume = 0.1, slide = 0) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  if (slide !== 0) {
    osc.frequency.exponentialRampToValueAtTime(freq + slide, audioCtx.currentTime + duration);
  }
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export const SFX = {
  punch: () => playSound(150, 'sine', 0.1, 0.2, -100),
  evoPunch: () => playSound(100, 'sawtooth', 0.3, 0.15, 200),
  gem: () => playSound(800, 'sine', 0.1, 0.1, 400),
  levelUp: () => {
    playSound(400, 'triangle', 0.2, 0.1);
    setTimeout(() => playSound(500, 'triangle', 0.2, 0.1), 100);
    setTimeout(() => playSound(600, 'triangle', 0.4, 0.1), 200);
  },
  hit: () => playSound(80, 'square', 0.1, 0.1),
  meow: () => playSound(600, 'triangle', 0.3, 0.05, 200),
  evo: () => playSound(200, 'sawtooth', 0.5, 0.1, 800),
  alarm: () => {
    playSound(600, 'square', 0.3, 0.15, -200);
    setTimeout(() => playSound(600, 'square', 0.3, 0.15, -200), 400);
    setTimeout(() => playSound(600, 'square', 0.3, 0.15, -200), 800);
  },
  box: () => {
    playSound(300, 'sine', 0.5, 0.2, 500);
    setTimeout(() => playSound(400, 'sine', 0.5, 0.2, 500), 200);
  },
  coin: () => playSound(1200, 'sine', 0.05, 0.1, 100),
  buy: () => playSound(1000, 'sine', 0.1, 0.1, 300)
};

import { MusicManager } from './ProceduralAudio';

export const BGM = {
  playLobby: () => {
    resumeAudio();
    MusicManager.startLobby();
  },
  playGame: () => {
    resumeAudio();
    MusicManager.startGame();
  },
  stop: () => {
    MusicManager.stop();
  },
  setVolume: (v: number) => {
    MusicManager.setVolume(v);
  }
};

export function resumeAudio() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}
