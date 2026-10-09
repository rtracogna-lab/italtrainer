import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tts } from '../../shared/tts';
import {
  DETTATI,
  Dettato as DettatoText,
  DettatoLevel,
  LEVELS,
  paragraphs,
  plainText,
  sentenceEndingAt,
  splitIntoChunks,
} from './dettati';

type Phase = 'preview' | 'dictation' | 'done';

// Lettura iniziale: il testo intero viene letto due volte a velocità normale.
const NORMAL_RATE = 1;
const PAUSE_BETWEEN_READINGS_MS = 2000;
const DICTATION_RATE = 0.7;
// Ogni gruppo viene letto prima di fila, poi ripetuto lentamente una parola
// alla volta, con una pausa tra una lettura e l'altra. Quante ripetizioni e
// quanta attesa prima del gruppo successivo dipende dal livello.
const PAUSE_BETWEEN_DICTATIONS_MS = 2000;
const PACING: Record<DettatoLevel, { slowRepeats: number; pauseAfterChunkMs: number }> = {
  base: { slowRepeats: 3, pauseAfterChunkMs: 0 },
  avanzato: { slowRepeats: 1, pauseAfterChunkMs: 3000 },
};
// Rilettura di ogni frase per controllare (solo nei dettati con rereadSentences).
const REREAD_INTRO = 'Ora rileggo la frase, controlla.';
const REREAD_RATE = 0.8;
// Pausa tra una parola e l'altra nelle ripetizioni lente.
const DICTATION_WORD_PAUSE_MS = 1000;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

@Component({
  imports: [RouterLink],
  selector: 'app-dettato',
  styleUrl: './dettato.scss',
  templateUrl: './dettato.html',
})
export class Dettato implements OnDestroy {
  protected readonly tts = inject(Tts);
  protected readonly levels = LEVELS.map((level) => ({
    ...level,
    dettati: DETTATI.filter((dettato) => dettato.level === level.id),
  }));

  protected readonly selected = signal<DettatoText | null>(null);
  protected readonly phase = signal<Phase>('preview');
  // Lettura iniziale del testo intero (due volte).
  protected readonly listening = signal(false);
  protected readonly chunkIndex = signal(0);
  protected readonly paused = signal(false);
  // Rilettura dell'ultima frase dettata.
  protected readonly rereading = signal(false);

  protected readonly text = computed(() => plainText(this.selected()?.text ?? ''));
  protected readonly paragraphs = computed(() => paragraphs(this.selected()?.text ?? ''));
  protected readonly chunks = computed(() => {
    const dettato = this.selected();
    return dettato ? splitIntoChunks(dettato.text) : [];
  });
  protected readonly progress = computed(() => ((this.chunkIndex() + 1) / this.chunks().length) * 100);

  // Ogni nuova azione incrementa il contatore: le letture ancora in corso di
  // azioni precedenti se ne accorgono e si fermano.
  private run = 0;

  protected choose(dettato: DettatoText): void {
    this.selected.set(dettato);
    this.phase.set('preview');
    this.listen();
  }

  protected backToList(): void {
    this.stop();
    this.selected.set(null);
  }

  protected async listen(): Promise<void> {
    const text = this.text();
    if (!text) {
      return;
    }
    const id = this.stop();
    this.listening.set(true);
    await this.tts.speak(text, NORMAL_RATE);
    if (id === this.run) {
      await delay(PAUSE_BETWEEN_READINGS_MS);
    }
    if (id === this.run) {
      await this.tts.speak(text, NORMAL_RATE);
    }
    if (id === this.run) {
      this.listening.set(false);
    }
  }

  protected startDictation(): void {
    this.phase.set('dictation');
    this.playFrom(0);
  }

  protected togglePause(): void {
    if (this.paused()) {
      this.playFrom(this.chunkIndex());
    } else {
      this.stop();
      this.paused.set(true);
    }
  }

  // Rilegge l'ultimo gruppo di parole e poi prosegue.
  protected repeat(): void {
    this.playFrom(this.chunkIndex());
  }

  // Passa subito al gruppo successivo (dall'ultimo, chiude il dettato).
  protected nextChunk(): void {
    this.playFrom(this.chunkIndex() + 1);
  }

  // Torna al gruppo precedente e lo detta di nuovo.
  protected previousChunk(): void {
    this.playFrom(Math.max(0, this.chunkIndex() - 1));
  }

  protected restartDictation(): void {
    this.playFrom(0);
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private async playFrom(start: number): Promise<void> {
    const id = this.stop();
    const chunks = this.chunks();
    const { slowRepeats, pauseAfterChunkMs } = PACING[this.selected()!.level];
    for (let index = start; index < chunks.length; index++) {
      this.chunkIndex.set(index);
      await this.tts.speak(chunks[index].spoken.join(' '), DICTATION_RATE);
      if (id !== this.run) {
        return;
      }
      for (let repeat = 0; repeat < slowRepeats; repeat++) {
        await delay(PAUSE_BETWEEN_DICTATIONS_MS);
        if (
          id !== this.run ||
          !(await this.speakWords(chunks[index].spoken, DICTATION_RATE, DICTATION_WORD_PAUSE_MS, id))
        ) {
          return;
        }
      }
      if (pauseAfterChunkMs > 0) {
        await delay(pauseAfterChunkMs);
        if (id !== this.run) {
          return;
        }
      }
      const sentence = this.selected()!.rereadSentences ? sentenceEndingAt(chunks, index) : null;
      if (sentence && !(await this.reread(sentence, id))) {
        return;
      }
    }
    this.phase.set('done');
  }

  // Annuncia la rilettura e rilegge la frase appena dettata.
  // Restituisce false se nel frattempo è partita un'altra azione.
  private async reread(sentence: string, id: number): Promise<boolean> {
    this.rereading.set(true);
    await this.tts.speak(REREAD_INTRO, NORMAL_RATE);
    if (id === this.run) {
      await delay(PAUSE_BETWEEN_DICTATIONS_MS);
    }
    if (id === this.run) {
      await this.tts.speak(sentence, REREAD_RATE);
    }
    if (id === this.run) {
      await delay(PAUSE_BETWEEN_DICTATIONS_MS);
    }
    if (id !== this.run) {
      return false;
    }
    this.rereading.set(false);
    return true;
  }

  // Legge le parole una alla volta, con una pausa tra l'una e l'altra.
  // Restituisce false se nel frattempo è partita un'altra azione.
  private async speakWords(words: string[], rate: number, pauseMs: number, id: number): Promise<boolean> {
    for (let index = 0; index < words.length; index++) {
      if (index > 0) {
        await delay(pauseMs);
        if (id !== this.run) {
          return false;
        }
      }
      await this.tts.speak(words[index], rate);
      if (id !== this.run) {
        return false;
      }
    }
    return true;
  }

  // Interrompe qualsiasi lettura in corso e restituisce il nuovo contatore.
  private stop(): number {
    this.tts.cancel();
    this.listening.set(false);
    this.paused.set(false);
    this.rereading.set(false);
    return ++this.run;
  }
}
