import { Component, computed, inject, input, OnDestroy, signal } from '@angular/core';
import { Tts } from '../tts';

export interface SummaryWord {
  prefix: string;
  missing: string;
  suffix: string;
  // Risposta data dal bambino durante il round.
  given: string;
}

const SECONDS_PER_WORD = 30;
const REPEATS_PER_WORD = 3;
const REPEAT_EVERY = SECONDS_PER_WORD / REPEATS_PER_WORD;

// Riepilogo di fine round: elenco delle parole con le lettere inserite in
// verde (giuste) o rosso (sbagliate), più la prova di dettatura sul foglio.
@Component({
  selector: 'app-round-summary',
  styleUrl: './round-summary.scss',
  templateUrl: './round-summary.html',
})
export class RoundSummary implements OnDestroy {
  readonly words = input.required<SummaryWord[]>();
  // Mostra il pulsante della dettatura (ha senso solo per parole singole).
  readonly dictation = input(true);

  protected readonly tts = inject(Tts);
  protected readonly secondsPerWord = SECONDS_PER_WORD;

  // Indice della parola in dettatura, null quando la dettatura non è attiva.
  protected readonly dictating = signal<number | null>(null);
  protected readonly secondsLeft = signal(SECONDS_PER_WORD);
  protected readonly dictationDone = signal(false);

  protected readonly currentWord = computed(() => {
    const index = this.dictating();
    return index === null ? null : this.words()[index];
  });

  private timer: ReturnType<typeof setInterval> | null = null;

  protected text(word: SummaryWord): string {
    return word.prefix + word.missing + word.suffix;
  }

  protected startDictation(): void {
    this.dictationDone.set(false);
    this.dictateWord(0);
  }

  protected skipWord(): void {
    const index = this.dictating();
    if (index !== null) {
      this.dictateWord(index + 1);
    }
  }

  protected stopDictation(): void {
    this.clearTimer();
    this.tts.cancel();
    this.dictating.set(null);
  }

  ngOnDestroy(): void {
    this.stopDictation();
  }

  private dictateWord(index: number): void {
    this.clearTimer();
    if (index >= this.words().length) {
      this.stopDictation();
      this.dictationDone.set(true);
      return;
    }
    this.dictating.set(index);
    this.secondsLeft.set(SECONDS_PER_WORD);
    this.speakCurrent();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  // Ogni secondo: ripete la parola a intervalli regolari e, finito il tempo,
  // passa alla successiva.
  private tick(): void {
    const left = this.secondsLeft() - 1;
    if (left <= 0) {
      this.skipWord();
      return;
    }
    this.secondsLeft.set(left);
    if (left % REPEAT_EVERY === 0) {
      this.speakCurrent();
    }
  }

  private speakCurrent(): void {
    const word = this.currentWord();
    if (word) {
      this.tts.speak(this.text(word));
    }
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
