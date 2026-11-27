// All sound is synthesized with WebAudio — no audio files, no network.
// One clear job: gobbles, flaps, alarms and jingles for the whole game.
export function createAudio() {
  let context = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  // A cheerful autumn walk: C major pentatonic, one soft triangle note a beat.
  const MELODY = [523, 587, 659, 784, 880, 784, 659, 587, 523, 587, 659, 523, 440, 523, 587, 659];

  function ensure() {
    if (!context) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
      } catch {
        context = null;
      }
    }
    if (context && context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function tone(frequency, seconds, type, volume, when = 0, slideTo = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const start = ctx.currentTime + when;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo > 0) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.02);
  }

  function gobble() {
    // Three quick low honks: the turkey's signature.
    tone(220, 0.09, 'sawtooth', 0.12, 0, 140);
    tone(200, 0.09, 'sawtooth', 0.12, 0.11, 130);
    tone(240, 0.14, 'sawtooth', 0.14, 0.22, 150);
  }

  function flap() {
    tone(500, 0.08, 'triangle', 0.08, 0, 900);
  }

  function pickup() {
    tone(880, 0.07, 'sine', 0.12);
    tone(1318, 0.1, 'sine', 0.1, 0.06);
  }

  function alarm() {
    tone(660, 0.12, 'square', 0.07, 0, 880);
    tone(660, 0.12, 'square', 0.07, 0.16, 880);
  }

  function thud() {
    tone(160, 0.18, 'sawtooth', 0.18, 0, 60);
  }

  function dash() {
    tone(300, 0.16, 'sine', 0.1, 0, 980);
  }

  function fanfare() {
    [523, 659, 784, 1046].forEach((frequency, index) => tone(frequency, 0.22, 'triangle', 0.14, index * 0.13));
  }

  function sadTrombone() {
    [392, 370, 349, 330].forEach((frequency, index) => tone(frequency, 0.28, 'sawtooth', 0.08, index * 0.22));
  }

  function startMusic() {
    stopMusic();
    if (!ensure()) return;
    musicTimer = window.setInterval(() => {
      if (muted) return;
      const note = MELODY[musicStep % MELODY.length];
      tone(note, 0.24, 'triangle', 0.045);
      musicStep += 1;
    }, 260);
  }

  function stopMusic() {
    if (musicTimer !== null) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  return {
    unlock() { ensure(); },
    gobble,
    flap,
    pickup,
    alarm,
    thud,
    dash,
    fanfare,
    sadTrombone,
    startMusic,
    stopMusic,
    toggleMute() {
      muted = !muted;
      if (muted) stopMusic();
      return muted;
    },
    isMuted() { return muted; },
  };
}
