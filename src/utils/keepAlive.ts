/**
 * Background Keep-Alive Audio Engine
 * Keeps mobile browser JavaScript thread active when app is minimized or hidden from screen
 */

class BackgroundKeepAliveEngine {
  private audio: HTMLAudioElement | null = null;
  private isRunning: boolean = false;

  /**
   * Start silent background audio to prevent mobile OS (Android/iOS) from freezing background timers
   */
  start(): void {
    if (typeof window === 'undefined') return;
    if (this.isRunning && this.audio) return;

    try {
      // 1-second silent WAV base64 loop
      const silentWav =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      const el = new Audio(silentWav);
      el.loop = true;
      el.volume = 0.001; // nearly silent, maintains audio session

      el.play()
        .then(() => {
          this.audio = el;
          this.isRunning = true;
        })
        .catch(() => {
          // Will be triggered on next user touch/interaction
          this.isRunning = false;
        });
    } catch {
      this.isRunning = false;
    }
  }

  stop(): void {
    if (this.audio) {
      try {
        this.audio.pause();
      } catch {}
      this.audio = null;
    }
    this.isRunning = false;
  }

  getStatus(): boolean {
    return this.isRunning;
  }
}

export const keepAliveEngine = new BackgroundKeepAliveEngine();
