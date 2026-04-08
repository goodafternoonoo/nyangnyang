import { audioCtx } from './audio';

class ProceduralBGM {
  private sequencer: number | null = null;
  private currentVolume: GainNode | null = null;

  constructor() {}

  private initVolume() {
    if (this.currentVolume || !audioCtx) return;
    this.currentVolume = audioCtx.createGain();
    this.currentVolume.connect(audioCtx.destination);
    this.currentVolume.gain.value = 0.3; // 볼륨 상향 조정! 0.1 -> 0.3
  }

  private playNote(freq: number, type: OscillatorType, duration: number, volume: number) {
    this.initVolume();
    if (!this.currentVolume || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.4, audioCtx.currentTime + 0.05); // 0.2 -> 0.4로 상향
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.currentVolume!);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  startLobby() {
    this.stop();
    let step = 0;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    
    this.sequencer = window.setInterval(() => {
      // Bass line
      if (step % 8 === 0) this.playNote(130.81, 'sine', 0.8, 0.2); // C3
      if (step % 8 === 4) this.playNote(98.00, 'sine', 0.8, 0.2); // G2
      
      // Melody
      if (step % 4 === 0) {
        const note = notes[Math.floor(Math.random() * notes.length)];
        this.playNote(note, 'triangle', 0.4, 0.1);
      }
      
      step++;
    }, 500);
  }

  startGame() {
    this.stop();
    let step = 0;
    const scales = [440, 493.88, 523.25, 587.33, 659.25, 783.99]; // A, B, C, D, E, G
    
    this.sequencer = window.setInterval(() => {
      // Fast Bass
      if (step % 4 === 0) this.playNote(110.00, 'square', 0.2, 0.1); // A2
      
      // Fast Arpeggio
      const note = scales[step % scales.length];
      this.playNote(note, 'square', 0.1, 0.05);
      
      step++;
    }, 150);
  }

  stop() {
    if (this.sequencer) {
      clearInterval(this.sequencer);
      this.sequencer = null;
    }
  }

  setVolume(v: number) {
    this.initVolume();
    if (this.currentVolume) {
      this.currentVolume.gain.setTargetAtTime(v, audioCtx.currentTime, 0.1);
    }
  }
}

export const MusicManager = new ProceduralBGM();
