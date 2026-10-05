import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tts } from '../../shared/tts';
import { DETTATI, Dettato as DettatoText, LEVELS, paragraphs, plainText, splitIntoChunks } from './dettati';

type Phase = 'preview' | 'dictation' | 'done';

// Lettura iniziale: il testo intero viene letto due volte a velocità normale.
const NORMAL_RATE = 1;
const PAUSE_BETWEEN_READINGS_MS = 2000;
const DICTATION_RATE = 0.7;
// Tempo per scrivere un gruppo di parole: una base più un tanto a parola.
const WRITING_BASE_MS = 2000;
const WRITING_PER_WORD_MS = 1000;
// Ogni gruppo viene letto prima di fila, poi, dopo una breve pausa, ripetuto
// lentamente una parola alla volta per SLOW_REPEATS volte.
const PAUSE_BEFORE_REPEAT_MS = 1000;
const SLOW_REPEATS = 2;
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

  protected restartDictation(): void {
    this.playFrom(0);
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private async playFrom(start: number): Promise<void> {
    const id = this.stop();
    const chunks = this.chunks();
    for (let index = start; index < chunks.length; index++) {
      this.chunkIndex.set(index);
      await this.tts.speak(chunks[index].spoken.join(' '), DICTATION_RATE);
      if (id !== this.run) {
        return;
      }
      for (let repeat = 0; repeat < SLOW_REPEATS; repeat++) {
        await delay(PAUSE_BEFORE_REPEAT_MS);
        if (
          id !== this.run ||
          !(await this.speakWords(chunks[index].spoken, DICTATION_RATE, DICTATION_WORD_PAUSE_MS, id))
        ) {
          return;
        }
      }
      await delay(WRITING_BASE_MS + chunks[index].words * WRITING_PER_WORD_MS);
      if (id !== this.run) {
        return;
      }
    }
    this.phase.set('done');
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
    return ++this.run;
  }
}
