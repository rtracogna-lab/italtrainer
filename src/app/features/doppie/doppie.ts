import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { shuffle } from '../../shared/shuffle';

interface DoppieWord {
  clue: string;
  prefix: string;
  missing: string;
  suffix: string;
  options: string[];
}

// Parole con una doppia da indovinare. L'emoji chiarisce il significato:
// molte coppie singola/doppia in italiano sono entrambe parole valide
// (carrello/carretto, nonna/nona, cane/canne...), quindi senza un indizio
// l'esercizio sarebbe ambiguo.
const DOUBLE_LETTER_WORDS: DoppieWord[] = [
  { clue: '🏀', prefix: 'pa', missing: 'll', suffix: 'a', options: ['l', 'll', 'tt', 'nn'] },
  { clue: '🐱', prefix: 'ga', missing: 'tt', suffix: 'o', options: ['t', 'tt', 'nn', 'ss'] },
  { clue: '🐴', prefix: 'cava', missing: 'll', suffix: 'o', options: ['l', 'll', 'rr', 'tt'] },
  { clue: '🦋', prefix: 'farfa', missing: 'll', suffix: 'a', options: ['l', 'll', 'nn', 'tt'] },
  { clue: '☂️', prefix: 'ombre', missing: 'll', suffix: 'o', options: ['l', 'll', 'nn', 'rr'] },
  { clue: '🎩', prefix: 'cappe', missing: 'll', suffix: 'o', options: ['l', 'll', 'tt', 'nn'] },
  { clue: '🐔', prefix: 'ga', missing: 'll', suffix: 'ina', options: ['l', 'll', 'rr', 'nn'] },
  { clue: '👧', prefix: 'sore', missing: 'll', suffix: 'a', options: ['l', 'll', 'nn', 'mm'] },
  { clue: '👩', prefix: 'ma', missing: 'mm', suffix: 'a', options: ['m', 'mm', 'bb', 'ff'] },
  { clue: '👵', prefix: 'no', missing: 'nn', suffix: 'a', options: ['n', 'nn', 'bb', 'ff'] },
  { clue: '🛒', prefix: 'carre', missing: 'll', suffix: 'o', options: ['l', 'll', 'tt', 'nn'] },
  { clue: '🍕', prefix: 'pi', missing: 'zz', suffix: 'a', options: ['z', 'zz', 'bb', 'ff'] },
  { clue: '🔴', prefix: 'ro', missing: 'ss', suffix: 'o', options: ['s', 'ss', 'nn', 'tt'] },
  { clue: '🔵', prefix: 'a', missing: 'zz', suffix: 'urro', options: ['z', 'zz', 'ss', 'nn'] },
  { clue: '🎲', prefix: 'a', missing: 'zz', suffix: 'ardo', options: ['z', 'zz', 'ss', 'nn'] },
  { clue: '🤪', prefix: 'pa', missing: 'zz', suffix: 'ia', options: ['z', 'zz', 'ss', 'nn'] },
  { clue: '📼', prefix: 'ca', missing: 'ss', suffix: 'etta', options: ['s', 'ss', 'tt', 'nn'] },
  { clue: '📦', prefix: 'ca', missing: 'ss', suffix: 'apanca', options: ['s', 'ss', 'tt', 'nn'] },
  { clue: '💰', prefix: 'ca', missing: 'ss', suffix: 'iere', options: ['s', 'ss', 'tt', 'nn'] },
  { clue: '👣', prefix: 'pa', missing: 'ss', suffix: 'o', options: ['s', 'ss', 'nn', 'zz'] },
  { clue: '🐦', prefix: 'pa', missing: 'ss', suffix: 'ero', options: ['s', 'ss', 'nn', 'zz'] },
  { clue: '🐤', prefix: 'passero', missing: 'tt', suffix: 'o', options: ['t', 'tt', 'ss', 'nn'] },
  { clue: '🛋️', prefix: 'tappe', missing: 'zz', suffix: 'iere', options: ['z', 'zz', 'ss', 'nn'] },
  { clue: '🧥', prefix: 'atta', missing: 'cc', suffix: 'apanni', options: ['c', 'cc', 'ss', 'zz'] },
  { clue: '👠', prefix: 'ta', missing: 'cc', suffix: 'o', options: ['c', 'cc', 'ss', 'zz'] },
  { clue: '🦃', prefix: 'ta', missing: 'cc', suffix: 'hino', options: ['c', 'cc', 'pp', 'nn'] },
  { clue: '⚔️', prefix: 'a', missing: 'tt', suffix: 'acco', options: ['t', 'tt', 'ss', 'nn'] },
];

// Parole in cui NON ci va la doppia: allenano a non raddoppiare sempre.
const SINGLE_LETTER_WORDS: DoppieWord[] = [
  { clue: '🐶', prefix: 'ca', missing: 'n', suffix: 'e', options: ['n', 'nn', 'q', 'v'] },
  { clue: '🍞', prefix: 'pa', missing: 'n', suffix: 'e', options: ['n', 'nn', 'q', 'l'] },
  { clue: '🐭', prefix: 'to', missing: 'p', suffix: 'o', options: ['p', 'pp', 'q', 's'] },
  { clue: '🌙', prefix: 'lu', missing: 'n', suffix: 'a', options: ['n', 'nn', 'q', 'm'] },
  { clue: '☀️', prefix: 'so', missing: 'l', suffix: 'e', options: ['l', 'll', 'q', 'n'] },
  { clue: '✋', prefix: 'ma', missing: 'n', suffix: 'o', options: ['n', 'nn', 'q', 'l'] },
];

const WORDS: DoppieWord[] = [...DOUBLE_LETTER_WORDS, ...SINGLE_LETTER_WORDS];
const QUESTIONS_PER_ROUND = 10;

function pickRound(): DoppieWord[] {
  return shuffle(WORDS).slice(0, QUESTIONS_PER_ROUND);
}

@Component({
  imports: [RouterLink],
  selector: 'app-doppie',
  styleUrl: './doppie.scss',
  templateUrl: './doppie.html',
})
export class Doppie {
  protected readonly total = QUESTIONS_PER_ROUND;

  protected readonly words = signal(pickRound());
  protected readonly currentIndex = signal(0);
  protected readonly score = signal(0);
  protected readonly selected = signal<string | null>(null);
  protected readonly answered = signal(false);

  protected readonly isFinished = computed(() => this.currentIndex() >= this.total);
  protected readonly current = computed(() => this.words()[this.currentIndex()]);
  protected readonly shuffledOptions = computed(() => shuffle(this.current().options));
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
