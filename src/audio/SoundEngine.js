// Web Audio API Synthesizer & Sequencer for Kedi Terbiyecisi
// 4 original cozy game music tracks + cute cat & Turkish SFX

const NOTE_FREQ = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Gs3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
  C6: 1046.50
};

const TRACK_PATTERNS = {
  bogaz: {
    stepMs: 268,
    leadWave: 'triangle',
    bassWave: 'sine',
    // Hicaz / Aegean warm cozy melody
    lead: [
      'E4', null, 'G4', 'A4', 'C5', null, 'B4', 'A4',
      'G4', null, 'E4', 'G4', 'A4', null, null, null,
      'D5', null, 'C5', 'B4', 'A4', 'G4', 'E4', null,
      'F4', 'G4', 'A4', 'G4', 'E4', null, null, null
    ],
    bass: [
      'A3', null, 'E3', null, 'A3', null, 'E3', null,
      'G3', null, 'D3', null, 'A3', null, 'E3', null,
      'D3', null, 'A3', null, 'C3', null, 'G3', null,
      'F3', null, 'G3', null, 'A3', null, 'E3', null
    ],
    arp: [
      'C4', 'E4', 'A4', 'E4', 'C4', 'E4', 'A4', 'E4',
      'B3', 'D4', 'G4', 'D4', 'C4', 'E4', 'A4', 'E4',
      'A3', 'D4', 'F4', 'D4', 'G3', 'C4', 'E4', 'C4',
      'A3', 'C4', 'F4', 'G4', 'A3', 'E4', 'A4', null
    ]
  },
  akdeniz: {
    stepMs: 245,
    leadWave: 'sine',
    bassWave: 'triangle',
    // Sunny Mediterranean marimba groove
    lead: [
      'G4', 'B4', 'D5', null, 'E5', 'D5', 'B4', null,
      'C5', 'E5', 'G5', null, 'Fs5', 'D5', null, null,
      'E5', 'D5', 'C5', 'B4', 'A4', 'B4', 'C5', 'A4',
      'G4', 'B4', 'D5', 'B4', 'G4', null, null, null
    ],
    bass: [
      'G3', null, null, 'D3', 'G3', null, 'D3', null,
      'C3', null, null, 'G3', 'D3', null, 'A3', null,
      'C3', null, 'G3', null, 'D3', null, 'A3', null,
      'G3', null, 'D3', null, 'G3', null, 'D3', null
    ],
    arp: [
      'B4', null, 'D4', null, 'B4', null, 'G4', null,
      'E4', null, 'G4', null, 'A4', null, 'D4', null,
      'G4', null, 'E4', null, 'Fs4', null, 'D4', null,
      'B3', null, 'D4', null, 'G4', null, 'B4', null
    ]
  },
  pati_valsi: {
    stepMs: 280,
    leadWave: 'sine',
    bassWave: 'sine',
    // Cute playful glockenspiel/music-box cat waltz (3/4 feel over 24 steps)
    lead: [
      'C5', null, 'E5', 'G5', null, 'E5',
      'F5', null, 'D5', 'B4', null, null,
      'C5', 'D5', 'E5', 'G5', 'A5', 'G5',
      'E5', null, 'D5', 'C5', null, null
    ],
    bass: [
      'C3', 'G3', 'E3', 'C3', 'G3', 'E3',
      'F3', 'C4', 'A3', 'G3', 'D4', 'B3',
      'C3', 'G3', 'E3', 'A3', 'E4', 'C4',
      'G3', 'D4', 'B3', 'C3', 'G3', null
    ],
    arp: [
      null, 'E4', 'G4', null, 'E4', 'G4',
      null, 'A4', 'C5', null, 'G4', 'B4',
      null, 'E4', 'G4', null, 'C4', 'E4',
      null, 'F4', 'G4', null, 'E4', null
    ]
  },
  karadeniz: {
    stepMs: 185,
    leadWave: 'sawtooth',
    bassWave: 'triangle',
    // Energetic cheerful Black Sea kemence-like 7/8 bounce!
    lead: [
      'A4', 'B4', 'C5', 'D5', 'E5', 'D5', 'C5',
      'D5', 'C5', 'B4', 'A4', 'G4', 'A4', null,
      'E5', 'F5', 'E5', 'D5', 'C5', 'D5', 'E5',
      'D5', 'C5', 'B4', 'G4', 'A4', 'A4', null
    ],
    bass: [
      'A3', null, 'E3', null, 'A3', 'E3', null,
      'G3', null, 'D3', null, 'A3', null, 'E3',
      'C3', null, 'G3', null, 'D3', 'A3', null,
      'G3', null, 'E3', null, 'A3', null, null
    ],
    arp: [
      'E4', null, 'A4', null, 'E4', null, 'C4',
      'D4', null, 'G4', null, 'E4', null, 'A4',
      'G4', null, 'C5', null, 'F4', null, 'A4',
      'D4', null, 'G4', null, 'E4', null, null
    ]
  }
};

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.currentTrack = 'bogaz';
    this.stepIndex = 0;
    this.timerId = null;
    this.isPlayingMusic = false;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.72;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? 0.34 : 0;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? 0.7 : 0;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  unlock() {
    const ctx = this.ensureContext();
    if (ctx && this.musicEnabled && !this.isPlayingMusic) {
      this.startMusic();
    }
  }

  setTrack(trackId) {
    if (!TRACK_PATTERNS[trackId]) return;
    this.currentTrack = trackId;
    this.stepIndex = 0;
    if (this.isPlayingMusic) {
      this.stopMusic();
      this.startMusic();
    }
  }

  toggleMusic(forceState) {
    this.musicEnabled = typeof forceState === 'boolean' ? forceState : !this.musicEnabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicEnabled ? 0.34 : 0, this.ctx.currentTime, 0.05);
    }
    if (this.musicEnabled && !this.isPlayingMusic) {
      this.startMusic();
    }
    return this.musicEnabled;
  }

  toggleSfx(forceState) {
    this.sfxEnabled = typeof forceState === 'boolean' ? forceState : !this.sfxEnabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxEnabled ? 0.7 : 0, this.ctx.currentTime, 0.05);
    }
    return this.sfxEnabled;
  }

  startMusic() {
    const ctx = this.ensureContext();
    if (!ctx || this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    const track = TRACK_PATTERNS[this.currentTrack] || TRACK_PATTERNS.bogaz;

    const tick = () => {
      if (!this.isPlayingMusic) return;
      if (this.musicEnabled && this.ctx.state === 'running') {
        this._playMusicStep(track);
      }
      this.timerId = window.setTimeout(tick, track.stepMs);
    };
    tick();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  _playMusicStep(track) {
    const now = this.ctx.currentTime;
    const len = track.lead.length;
    const idx = this.stepIndex % len;
    this.stepIndex++;

    const leadNote = track.lead[idx];
    const bassNote = track.bass[idx];
    const arpNote = track.arp[idx];
    const dur = (track.stepMs / 1000) * 0.92;

    if (leadNote && NOTE_FREQ[leadNote]) {
      this._playTone(NOTE_FREQ[leadNote], now, dur, track.leadWave, 0.24, this.musicGain, true);
    }
    if (bassNote && NOTE_FREQ[bassNote]) {
      this._playTone(NOTE_FREQ[bassNote], now, dur * 1.1, track.bassWave, 0.22, this.musicGain, false);
    }
    if (arpNote && NOTE_FREQ[arpNote]) {
      this._playTone(NOTE_FREQ[arpNote], now, dur * 0.65, 'sine', 0.11, this.musicGain, false);
    }
    // Soft shaker/kick pulse on beat
    if (idx % 2 === 0) {
      this._playSoftPerc(now, idx % 4 === 0 ? 110 : 0);
    }
  }

  _playTone(freq, startTime, duration, wave, peakGain, dest, softFilter = false) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    if (softFilter) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(wave === 'sawtooth' ? 1650 : 2800, startTime);
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(dest);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.03);
  }

  _playSoftPerc(startTime, kickFreq) {
    if (kickFreq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(kickFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(45, startTime + 0.08);
      gain.gain.setValueAtTime(0.14, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(startTime);
      osc.stop(startTime + 0.1);
    } else {
      // Gentle hi-hat tick
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(3200, startTime);
      gain.gain.setValueAtTime(0.025, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(startTime);
      osc.stop(startTime + 0.035);
    }
  }

  // Cute synthesized Meow + ascending combo chime!
  playMeow(combo = 1, isRare = false) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Meow formant sweep ("Miii-aaa-ov")
    const basePitch = 460 + Math.min(combo, 8) * 32 + (Math.random() * 60 - 30);
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(basePitch * 0.85, now);
    osc.frequency.exponentialRampToValueAtTime(basePitch * 1.38, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(basePitch * 0.92, now + 0.24);

    filter.type = 'bandpass';
    filter.Q.value = 2.6;
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(1950, now + 0.09);
    filter.frequency.exponentialRampToValueAtTime(1050, now + 0.24);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.28);

    // 2. Pentatonic combo sparkle
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5];
    const chimeFreq = pentatonic[(combo - 1) % pentatonic.length];
    this._playTone(chimeFreq, now + 0.03, 0.22, 'sine', 0.22, this.sfxGain);
    if (isRare) {
      this._playTone(chimeFreq * 1.25, now + 0.1, 0.28, 'sine', 0.24, this.sfxGain);
      this._playTone(chimeFreq * 1.5, now + 0.18, 0.35, 'triangle', 0.24, this.sfxGain);
    }
  }

  playPowerup(type) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = type === 'nazar' ? [523, 659, 784, 1046] : [440, 554, 659, 880];
    notes.forEach((f, i) => {
      this._playTone(f, now + i * 0.055, 0.2, 'sine', 0.22, this.sfxGain);
    });
  }

  playDash() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.16);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playShieldBreak() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 622, 440].forEach((f, i) => {
      this._playTone(f, now + i * 0.05, 0.18, 'triangle', 0.28, this.sfxGain);
    });
  }

  playVictory() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const times = [0, 0.1, 0.2, 0.32, 0.48, 0.62];
    fanfare.forEach((f, i) => {
      this._playTone(f, now + times[i], i === 5 ? 0.5 : 0.18, 'triangle', 0.28, this.sfxGain);
    });
  }

  playGameOver() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [392, 349.23, 311.13, 261.63].forEach((f, i) => {
      this._playTone(f, now + i * 0.14, 0.25, 'triangle', 0.24, this.sfxGain);
    });
  }

  playClick() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this._playTone(680, ctx.currentTime, 0.06, 'sine', 0.14, this.sfxGain);
  }
}
