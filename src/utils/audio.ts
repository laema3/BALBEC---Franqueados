// High-fidelity Audio Synthesizer & Speech Announcer for BALBEC TV Pickup Panel
class AudioNotifier {
  private ctx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {});
    } else if (this.ctx && this.ctx.state === 'running') {
      this.isUnlocked = true;
    }
    return this.ctx;
  }

  public unlock(): boolean {
    const ctx = this.getContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      this.isUnlocked = true;
      return true;
    }
    return false;
  }

  public isAudioReady(): boolean {
    return this.isUnlocked && !!this.ctx && this.ctx.state === 'running';
  }

  /**
   * Play a clean, resonant, attention-grabbing airport/retail call chime (Ding-Dong-Ding)
   */
  public playChime(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note sequence for elegant retail chime:
      // Note 1: E5 (659.25 Hz)
      // Note 2: G#5 (830.61 Hz)
      // Note 3: B5 (987.77 Hz)
      // Note 4: E6 (1318.51 Hz) - high ringing bell note
      const notes = [
        { freq: 659.25, start: now + 0.0, duration: 0.7, gain: 0.35 },
        { freq: 830.61, start: now + 0.18, duration: 0.7, gain: 0.38 },
        { freq: 987.77, start: now + 0.36, duration: 0.8, gain: 0.40 },
        { freq: 1318.51, start: now + 0.54, duration: 1.4, gain: 0.45 },
      ];

      notes.forEach(({ freq, start, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Sine wave with soft triangle harmonic for warm bell sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gainNode.gain.setValueAtTime(0.001, start);
        gainNode.gain.linearRampToValueAtTime(gain, start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      });
    } catch (err) {
      console.warn('Audio chime playback failed:', err);
    }
  }

  /**
   * Announce the order verbally using Brazilian Portuguese text-to-speech
   */
  public announceOrder(orderNumber: number | string, customerName?: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const text = customerName
        ? `Atenção: Pedido número ${orderNumber}, para ${customerName}, está pronto para retirada no balcão.`
        : `Atenção: Pedido número ${orderNumber}, está pronto para retirada no balcão.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      // Prefer pt-BR voices if available
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find((v) => v.lang.startsWith('pt') || v.lang.includes('BR'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      // Play chime first, then voice after chime completes (approx 800ms)
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 750);
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
    }
  }
}

export const audioNotifier = new AudioNotifier();
