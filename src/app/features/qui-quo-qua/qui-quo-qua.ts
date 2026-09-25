import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { shuffle } from '../../shared/shuffle';

interface QuCuWord {
  clue: string;
  prefix: string;
  missing: 'qu' | 'cu' | 'cqu';
  suffix: string;
}

const OPTIONS = ['qu', 'cu', 'cqu'];

// Parole che allenano la scelta tra "qu", "cu" e "cqu" (l'eccezione di
// "acqua" e derivati). Le opzioni sono sempre le stesse tre per ogni parola.
const WORDS: QuCuWord[] = [
  { clue: '⬜', prefix: '', missing: 'qu', suffix: 'adrato' },
  { clue: '📓', prefix: '', missing: 'qu', suffix: 'aderno' },
  { clue: '⏰', prefix: '', missing: 'qu', suffix: 'ando' },
  { clue: '4️⃣', prefix: '', missing: 'qu', suffix: 'attro' },
  { clue: '👉', prefix: '', missing: 'qu', suffix: 'esto' },
  { clue: '👈', prefix: '', missing: 'qu', suffix: 'ello' },
  { clue: '📍', prefix: '', missing: 'qu', suffix: 'i' },
  { clue: '🖼️', prefix: '', missing: 'qu', suffix: 'adro' },
  { clue: '📅', prefix: '', missing: 'qu', suffix: 'otidiano' },
  { clue: '➡️', prefix: '', missing: 'qu', suffix: 'indi' },
  { clue: '💧', prefix: 'a', missing: 'cqu', suffix: 'a' },
  { clue: '🐠', prefix: 'a', missing: 'cqu', suffix: 'ario' },
  { clue: '🌧️', prefix: 'a', missing: 'cqu', suffix: 'azzone' },
  { clue: '🛒', prefix: 'a', missing: 'cqu', suffix: 'istare' },
  { clue: '❤️', prefix: '', missing: 'cu', suffix: 'ore' },
  { clue: '👨‍🍳', prefix: '', missing: 'cu', suffix: 'oco' },
  { clue: '🏫', prefix: 's', missing: 'cu', suffix: 'ola' },
  { clue: '👜', prefix: '', missing: 'cu', suffix: 'oio' },
  { clue: '📚', prefix: '', missing: 'cu', suffix: 'ltura' },
  { clue: '🍳', prefix: '', missing: 'cu', suffix: 'cina' },
  { clue: '🧐', prefix: '', missing: 'cu', suffix: 'rioso' },
];

const QUESTIONS_PER_ROUND = 10;

function pickRound(): QuCuWord[] {
  return shuffle(WORDS).slice(0, QUESTIONS_PER_ROUND);
}

@Component({
  imports: [RouterLink],
  selector: 'app-qui-quo-qua',
  styleUrl: './qui-quo-qua.scss',
  templateUrl: './qui-quo-qua.html',
})
export class QuiQuoQua {
  protected readonly total = QUESTIONS_PER_ROUND;
  protected readonly options = OPTIONS;

  protected readonly words = signal(pickRound());
  protected readonly currentIndex = signal(0);
  protected readonly score = signal(0);
  protected readonly selected = signal<string | null>(null);
  protected readonly answered = signal(false);

  protected readonly isFinished = computed(() => this.currentIndex() >= this.total);
  protected readonly current = computed(() => this.words()[this.currentIndex()]);
  protected readonly shuffledOptions = computed(() => shuffle(this.options));
  protected readonly isCorrect = computed(() => this.selected() === this.current().missing);

  protected selectOption(option: string): void {
    if (this.answered()) {
      return;
    }
    this.selected.set(option);
    this.answered.set(true);
    if (option === this.current().missing) {
      this.score.update((value) => value + 1);
    }
  }

  protected next(): void {
    this.selected.set(null);
    this.answered.set(false);
    this.currentIndex.update((index) => index + 1);
  }

  protected restart(): void {
    this.words.set(pickRound());
    this.currentIndex.set(0);
    this.score.set(0);
    this.selected.set(null);
    this.answered.set(false);
  }
}
