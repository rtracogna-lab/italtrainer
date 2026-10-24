import { Component, computed, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { sentenceParts } from '../hanno-anno/frasi';
import { Card, makeCards, rightText, shownText } from './carte';

type Phase = 'start' | 'gioco' | 'fine';

export const GAME_SECONDS = 60;
const RECORD_KEY = 'italtrainer.giusto-sbagliato.record';

interface Result {
  card: Card;
  // true se il bambino ha detto "giusta".
  saidRight: boolean;
  correct: boolean;
}

function readRecord(): number {
  try {
    return Number(localStorage.getItem(RECORD_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveRecord(points: number): void {
  try {
    localStorage.setItem(RECORD_KEY, String(points));
  } catch {
    // Senza memoria del browser il record semplicemente non si salva.
  }
}

// Gara a tempo: in 60 secondi dire di più frasi possibile se sono giuste o
// sbagliate. Ogni errore toglie un punto, così non conviene tirare a caso.
@Component({
  imports: [RouterLink],
  selector: 'app-giusto-sbagliato',
  styleUrl: './giusto-sbagliato.scss',
  templateUrl: './giusto-sbagliato.html',
})
export class GiustoSbagliato implements OnDestroy {
  protected readonly gameSeconds = GAME_SECONDS;

  protected readonly phase = signal<Phase>('start');
  protected readonly cards = signal<Card[]>(makeCards());
  protected readonly index = signal(0);
  protected readonly secondsLeft = signal(GAME_SECONDS);
  protected readonly results = signal<Result[]>([]);
  protected readonly record = signal(readRecord());
  protected readonly isNewRecord = signal(false);

  protected readonly current = computed(() => this.cards()[this.index()]);
  protected readonly text = computed(() => shownText(this.current()));
  protected readonly last = computed(() => this.results().at(-1));
  protected readonly rightCount = computed(() => this.results().filter((result) => result.correct).length);
  protected readonly mistakes = computed(() => this.results().filter((result) => !result.correct));
  protected readonly points = computed(() => Math.max(0, this.rightCount() - this.mistakes().length));

  private endsAt = 0;
  private clock: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.stopClock();
  }

  protected rightText(card: Card): string {
    return rightText(card);
  }

  protected shownText(card: Card): string {
    return shownText(card);
  }

  // La frase giusta divisa intorno alla parola, per evidenziarla.
  protected parts(card: Card): { prefix: string; suffix: string } {
    return sentenceParts(card.sentence);
  }

  protected start(): void {
    this.cards.set(makeCards());
    this.index.set(0);
    this.results.set([]);
    this.isNewRecord.set(false);
    this.secondsLeft.set(GAME_SECONDS);
    this.phase.set('gioco');
    this.endsAt = Date.now() + GAME_SECONDS * 1000;
    this.stopClock();
    this.clock = setInterval(() => this.tick(), 250);
  }

  protected answer(saidRight: boolean): void {
    if (this.phase() !== 'gioco') {
      return;
    }
    const card = this.current();
    this.results.update((list) => [...list, { card, saidRight, correct: saidRight === card.isRight }]);
    // Finite le frasi (difficile in un minuto!) si ricomincia da un nuovo mazzo.
    if (this.index() + 1 >= this.cards().length) {
      this.cards.set(makeCards());
      this.index.set(0);
    } else {
      this.index.update((value) => value + 1);
    }
  }

  private tick(): void {
    const left = Math.max(0, Math.ceil((this.endsAt - Date.now()) / 1000));
    this.secondsLeft.set(left);
    if (left === 0) {
      this.finish();
    }
  }

  private finish(): void {
    this.stopClock();
    this.phase.set('fine');
    this.isNewRecord.set(this.points() > this.record());
    if (this.isNewRecord()) {
      this.record.set(this.points());
      saveRecord(this.points());
    }
  }

  private stopClock(): void {
    if (this.clock !== null) {
      clearInterval(this.clock);
      this.clock = null;
    }
  }
}
