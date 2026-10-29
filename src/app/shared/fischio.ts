import { Injectable } from '@angular/core';

// Fischietto dell'arbitro sintetizzato con la Web Audio API: nessun file
// audio. Il trillo viene da una rapida oscillazione della frequenza, come la
// pallina dentro il fischietto.
@Injectable({ providedIn: 'root' })
export class Whistle {
  readonly supported = typeof window !== 'undefined' && 'AudioContext' in window;

  private context: AudioContext | null = null;

  // I browser fanno suonare l'audio solo dopo un gesto dell'utente: la prima
  // chiamata va fatta dentro un clic, poi si può fischiare anche dal timer.
  // `blasts` sono le durate dei fischi in millisecondi.
  play(blasts: number[], gapMs = 180): void {
    if (!this.supported) {
      return;
    }
    this.context ??= new AudioContext();
    void this.context.resume();
    let start = this.context.currentTime + 0.05;
    for (const ms of blasts) {
      this.blast(this.context, start, ms / 1000);
      start += (ms + gapMs) / 1000;
    }
  }

  private blast(context: AudioContext, start: number, duration: number): void {
    const tone = context.createOscillator();
    tone.frequency.value = 3000;

    const trill = context.createOscillator();
    trill.frequency.value = 35;
    const trillDepth = context.createGain();
    trillDepth.gain.value = 180;
    trill.connect(trillDepth).connect(tone.frequency);

    // Attacco e chiusura rapidi, per non fare "clic".
    const volume = context.createGain();
    volume.gain.setValueAtTime(0, start);
    volume.gain.linearRampToValueAtTime(0.2, start + 0.02);
    volume.gain.setValueAtTime(0.2, start + duration - 0.04);
    volume.gain.linearRampToValueAtTime(0, start + duration);
    tone.connect(volume).connect(context.destination);

    tone.start(start);
    trill.start(start);
    tone.stop(start + duration);
    trill.stop(start + duration);
  }
}
