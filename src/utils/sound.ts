/**
 * Web Audio API Sound Synthesizer & Web Speech API TTS
 * Zero external audio files required - works completely offline
 */

class SoundEffects {
    private ctx: AudioContext | null = null;
    private enabled: boolean = true;

    private getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    public toggleSound(enable?: boolean): boolean {
        this.enabled = enable !== undefined ? enable : !this.enabled;
        return this.enabled;
    }

    public isSoundEnabled(): boolean {
        return this.enabled;
    }

    // Soft subtle click sound
    public playClick(): void {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch {
            // Ignore audio context errors
        }
    }

    // Happy positive chord for correct match
    public playCorrect(): void {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();
            if (!ctx) return;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);

                gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
                gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.06 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.35);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime + i * 0.06);
                osc.stop(ctx.currentTime + i * 0.06 + 0.35);
            });
        } catch {
            // Ignore
        }
    }

    // Low error buzz for incorrect match
    public playIncorrect(): void {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch {
            // Ignore
        }
    }

    // Triumphant victory fanfare on puzzle completion
    public playVictory(): void {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();
            if (!ctx) return;
            const melody = [
                { freq: 523.25, time: 0, dur: 0.12 },     // C5
                { freq: 659.25, time: 0.12, dur: 0.12 },  // E5
                { freq: 783.99, time: 0.24, dur: 0.12 },  // G5
                { freq: 1046.50, time: 0.36, dur: 0.45 }, // C6
            ];

            melody.forEach(({ freq, time, dur }) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

                gain.gain.setValueAtTime(0.25, ctx.currentTime + time);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime + time);
                osc.stop(ctx.currentTime + time + dur);
            });
        } catch {
            // Ignore
        }
    }

    // Pronounce a word using browser SpeechSynthesis
    public speakWord(word: string, lang: 'vi-VN' | 'en-US' = 'en-US'): void {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel(); // Stop ongoing speech
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = lang;
            utterance.rate = 0.9; // Slightly slower for clear teaching pronunciation
            utterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const matchingVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
            if (matchingVoice) {
                utterance.voice = matchingVoice;
            }

            window.speechSynthesis.speak(utterance);
        } catch {
            // Ignore
        }
    }
}

export const soundFx = new SoundEffects();
