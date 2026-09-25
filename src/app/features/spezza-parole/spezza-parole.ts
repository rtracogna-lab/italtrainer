import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { shuffle } from '../../shared/shuffle';

interface SplitPhrase {
  clue: string;
  text: string;
}

interface RoundItem {
  clue: string;
  text: string;
  letters: string[];
  correctGaps: Set<number>;
}

// Frasi brevi da presentare "attaccate": il bambino deve cliccare tra le
// lettere per rimettere gli spazi nel posto giusto.
const PHRASES: SplitPhrase[] = [
  { clue: '🐱', text: 'il gatto dorme' },
  { clue: '👩‍🍳', text: 'la mamma cucina' },
  { clue: '🍽️', text: 'ho tanta fame' },
  { clue: '👍', text: 'sei molto bravo' },
  { clue: '☀️', text: 'il sole splende' },
  { clue: '🏠', text: 'andiamo a casa' },
  { clue: '📖', text: 'mi piace leggere' },
  { clue: '⚽', text: 'voglio giocare fuori' },
  { clue: '🐕', text: 'il cane corre veloce' },
  { clue: '🎉', text: 'domani è festa' },
  { clue: '❄️', text: 'oggi fa freddo' },
  { clue: '🍰', text: 'la torta è buona' },
];

function buildRoundItem(phrase: SplitPhrase): RoundItem {
  const letters: string[] = [];
  const correctGaps = new Set<number>();
  for (const char of phrase.text) {
    if (char === ' ') {
      correctGaps.add(letters.length - 1);
    } else {
      letters.push(char);
    }
  }
  return { clue: phrase.clue, text: phrase.text, letters, correctGaps };
}

const QUESTIONS_PER_ROUND = 10;

function pickRound(): RoundItem[] {
  return shuffle(PHRASES)
    .slice(0, QUESTIONS_PER_ROUND)
    .map(buildRoundItem);
}

function gapSetsMatch(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const gap of a) {
    if (!b.has(gap)) {
      return false;
    }
  }
  return true;
}

@Component({
  imports: [RouterLink],
  selector: 'app-spezza-parole',
  styleUrl: './spezza-parole.scss',
  templateUrl: './spezza-parole.html',
})
export class SpezzaParole {
  protected readonly total = QUESTIONS_PER_ROUND;

  protected readonly items = signal(pickRound());
  protected readonly currentIndex = signal(0);
  protected readonly score = signal(0);
  protected readonly userGaps = signal<Set<number>>(new Set());
  protected readonly checked = signal(false);

  protected readonly isFinished = computed(() => this.currentIndex() >= this.total);
  protected readonly current = computed(() => this.items()[this.currentIndex()]);
  protected readonly isCorrect = computed(() =>
    gapSetsMatch(this.userGaps(), this.current().correctGaps),
  );

  protected toggleGap(index: number): void {
    if (this.checked()) {
      return;
    }
    const next = new Set(this.userGaps());
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    this.userGaps.set(next);
  }

  protected check(): void {
    if (this.checked()) {
      return;
    }
    this.checked.set(true);
    if (this.isCorrect()) {
      this.score.update((value) => value + 1);
    }
  }

  protected next(): void {
    this.userGaps.set(new Set());
    this.checked.set(false);
    this.currentIndex.update((index) => index + 1);
  }

  protected restart(): void {
    this.items.set(pickRound());
    this.currentIndex.set(0);
    this.score.set(0);
    this.userGaps.set(new Set());
    this.checked.set(false);
  }
}
