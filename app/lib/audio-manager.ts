/**
 * Audio Manager for synthetic sound feedback using Web Audio API.
 * No asset dependencies required.
 */

class AudioManager {
  private context: AudioContext | null = null;

  private init() {
    if (!this.context) {
      this.context = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
  }

  private playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    volume: number,
  ) {
    try {
      this.init();
      if (!this.context) return;

      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.context.currentTime);

      gain.gain.setValueAtTime(volume, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        this.context.currentTime + duration,
      );

      osc.connect(gain);
      gain.connect(this.context.destination);

      osc.start();
      osc.stop(this.context.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }

  /**
   * High-pitch pleasant beep for success
   */
  playSuccess() {
    this.playTone(880, "sine", 0.15, 0.1);
  }

  /**
   * Double beep for info/neutral
   */
  playInfo() {
    this.playTone(440, "sine", 0.1, 0.1);
    setTimeout(() => this.playTone(660, "sine", 0.1, 0.1), 100);
  }

  /**
   * Low-pitch buzzer for error/not-found
   */
  playError() {
    this.playTone(150, "sawtooth", 0.3, 0.05);
  }
}

export const audioManager =
  typeof window !== "undefined" ? new AudioManager() : ({} as AudioManager);
