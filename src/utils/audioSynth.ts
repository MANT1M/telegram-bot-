// Web Audio API & HTML5 Audio player for authentic playback in browser
class SimpleAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private currentLessonId: string | null = null;
  private currentTime = 0;
  private duration = 180;
  private timer: number | null = null;
  private listeners: ((time: number, isPlaying: boolean) => void)[] = [];
  private oscNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private activeAudioElement: HTMLAudioElement | null = null;

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
  }

  public subscribe(cb: (time: number, isPlaying: boolean) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    for (const cb of this.listeners) {
      cb(this.currentTime, this.isPlaying);
    }
  }

  public play(lessonId: string, duration: number, startFrom?: number, audioUrl?: string) {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.currentLessonId !== lessonId) {
      this.stopAll();
      this.currentLessonId = lessonId;
      this.currentTime = startFrom || 0;
      this.duration = duration || 180;
    } else if (startFrom !== undefined) {
      this.currentTime = startFrom;
    }

    this.isPlaying = true;

    // If an audioUrl is available (uploaded audio or external link), stream real audio
    if (audioUrl) {
      try {
        if (!this.activeAudioElement || this.activeAudioElement.src !== audioUrl) {
          if (this.activeAudioElement) {
            this.activeAudioElement.pause();
          }
          const audio = new Audio(audioUrl);
          this.activeAudioElement = audio;

          audio.addEventListener('loadedmetadata', () => {
            if (audio.duration && !isNaN(audio.duration)) {
              this.duration = Math.round(audio.duration);
              this.notify();
            }
          });

          audio.addEventListener('timeupdate', () => {
            this.currentTime = Math.floor(audio.currentTime);
            this.notify();
          });

          audio.addEventListener('ended', () => {
            this.pause();
            this.currentTime = 0;
            this.notify();
          });
        }

        if (this.currentTime > 0) {
          this.activeAudioElement.currentTime = this.currentTime;
        }

        this.activeAudioElement.play().catch(() => {
          // If browser blocks audio element or file unavailable, use pleasant harmonic tone
          this.startSound();
          this.startTimer();
        });
      } catch {
        this.startSound();
        this.startTimer();
      }
    } else {
      // Harmonic synth simulation when no audio file URL provided
      this.startSound();
      this.startTimer();
    }

    this.notify();
  }

  private startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = window.setInterval(() => {
      if (this.currentTime >= this.duration) {
        this.pause();
        this.currentTime = 0;
      } else {
        this.currentTime += 1;
      }
      this.notify();
    }, 1000);
  }

  public pause() {
    this.isPlaying = false;
    this.stopSound();
    if (this.activeAudioElement) {
      this.activeAudioElement.pause();
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.notify();
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
    if (this.activeAudioElement) {
      this.activeAudioElement.currentTime = this.currentTime;
    }
    this.notify();
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      currentLessonId: this.currentLessonId,
      currentTime: this.currentTime,
      duration: this.duration,
    };
  }

  private stopAll() {
    this.stopSound();
    if (this.activeAudioElement) {
      this.activeAudioElement.pause();
      this.activeAudioElement = null;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startSound() {
    if (!this.audioCtx) return;
    try {
      this.stopSound();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Soft harmonic sound simulating voice tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(330, this.audioCtx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, this.audioCtx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.015, this.audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();

      this.oscNode = osc;
      this.gainNode = gain;
    } catch {
      // ignore audio context restrictions
    }
  }

  private stopSound() {
    if (this.oscNode) {
      try {
        this.oscNode.stop();
        this.oscNode.disconnect();
      } catch {
        // ignore
      }
      this.oscNode = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {
        // ignore
      }
      this.gainNode = null;
    }
  }
}

export const audioPlayer = new SimpleAudioPlayer();
