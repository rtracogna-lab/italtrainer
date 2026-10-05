import { Injectable } from '@angular/core';

// Lettura ad alta voce con la Web Speech API del browser: nessuna libreria né
// chiave API. La qualità della voce dipende dal dispositivo.
@Injectable({ providedIn: 'root' })
export class Tts {
  readonly supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (!this.supported) {
      return;
    }
    // Le voci arrivano in modo asincrono: all'avvio la lista può essere vuota.
    this.pickVoice();
    speechSynthesis.addEventListener('voiceschanged', () => this.pickVoice());
  }

  speak(text: string): void {
    if (!this.supported) {
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 0.85;
    if (this.voice) {
      utterance.voice = this.voice;
    }
    speechSynthesis.speak(utterance);
  }

  cancel(): void {
    if (this.supported) {
      speechSynthesis.cancel();
    }
  }

  private pickVoice(): void {
    const italian = speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('it'));
    // Le voci "Natural"/"Online" (Edge) e Google sono le più naturali.
    this.voice =
      italian.find((voice) => /natural|online/i.test(voice.name)) ??
      italian.find((voice) => /google/i.test(voice.name)) ??
      italian[0] ??
      null;
  }
}
