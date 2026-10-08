import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PAROLE_DIFFICILI } from '../../shared/parole-difficili';
import { RoundSummary, SummaryWord } from '../../shared/round-summary/round-summary';
import { shuffle } from '../../shared/shuffle';
import { Tts } from '../../shared/tts';

interface MissingLetterItem {
  word: string;
  // Posizione della lettera tolta e la lettera stessa.
  index: number;
  letter: string;
  // La parola come appare, senza la lettera.
  shown: string;
  options: string[];
}

const VOWELS = 'aeiou';
const CONSONANTS = 'rlnmtdpbscgvf';
const QUESTIONS_PER_ROUND = 10;

const pickOne = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

function buildItem(word: string, index: number): MissingLetterItem {
  const letter = word[index];
  const pool = (VOWELS.includes(letter) ? VOWELS : CONSONANTS).replace(letter, '');
  const distractors = shuffle([...pool]).slice(0, 3);
  return {
    word,
    index,
    letter,
    shown: word.slice(0, index) + word.slice(index + 1),
    options: shuffle([letter, ...distractors]),
  };
}

function pickRound(): MissingLetterItem[] {
  return shuffle(PAROLE_DIFFICILI)
    .slice(0, QUESTIONS_PER_ROUND)
    .map(({ word, tricky }) => buildItem(word, pickOne(tricky)));
}

// Il bambino vede la parola senza una lettera, senza sapere dove manca:
// prima tocca il punto giusto, poi sceglie la lettera.
@Component({
  imports: [RouterLink, RoundSummary],
  selector: 'app-lettera-mancante',
  styleUrl: './lettera-mancante.scss',
  templateUrl: './lettera-mancante.html',
})
export class LetteraMancante {
  protected readonly tts = inject(Tts);
  protected readonly total = QUESTIONS_PER_ROUND;

  protected readonly items = signal(pickRound());
  protected readonly currentIndex = signal(0);
  protected readonly score = signal(0);
  protected readonly chosenGap = signal<number | null>(null);
  protected readonly chosenLetter = signal<string | null>(null);
  protected readonly answered = signal(false);
  protected readonly results = signal<{ given: string; note?: string }[]>([]);

  protected readonly isFinished = computed(() => this.currentIndex() >= this.total);
  protected readonly current = computed(() => this.items()[this.currentIndex()]);
  // Punti tra le lettere (anche prima della prima e dopo l'ultima).
  protected readonly gaps = computed(() => Array.from({ length: this.current().shown.length + 1 }, (_, i) => i));
  // Con le lettere uguali vicine ("fratelo") più punti sono giusti.
  protected readonly validGaps = computed(() => {
    const { word, letter, shown } = this.current();
    return new Set(this.gaps().filter((gap) => shown.slice(0, gap) + letter + shown.slice(gap) === word));
  });
  protected readonly gapIsRight = computed(() => {
    const gap = this.chosenGap();
    return gap !== null && this.validGaps().has(gap);
  });
  protected readonly isCorrect = computed(() => this.gapIsRight() && this.chosenLetter() === this.current().letter);

  protected readonly summary = computed<SummaryWord[]>(() =>
    this.items().map(({ word, index, letter }, i) => ({
      prefix: word.slice(0, index),
      missing: letter,
      suffix: word.slice(index + 1),
      given: this.results()[i]?.given ?? '',
      note: this.results()[i]?.note,
    })),
  );

  protected speakWord(): void {
    this.tts.speak(this.current().word);
  }

  protected chooseGap(gap: number): void {
    if (this.answered() || this.chosenGap() !== null) {
      return;
    }
    this.chosenGap.set(gap);
    if (!this.validGaps().has(gap)) {
      this.finish({ given: '', note: 'lettera nel posto sbagliato' });
    }
  }

  protected chooseLetter(letter: string): void {
    if (this.answered() || !this.gapIsRight()) {
      return;
    }
    this.chosenLetter.set(letter);
    this.finish({ given: letter });
  }

  protected next(): void {
    this.chosenGap.set(null);
    this.chosenLetter.set(null);
    this.answered.set(false);
    this.currentIndex.update((index) => index + 1);
  }

  protected restart(): void {
    this.items.set(pickRound());
    this.currentIndex.set(0);
    this.score.set(0);
    this.results.set([]);
    this.chosenGap.set(null);
    this.chosenLetter.set(null);
    this.answered.set(false);
  }

  private finish(result: { given: string; note?: string }): void {
    this.answered.set(true);
    this.results.update((list) => [...list, result]);
    if (this.isCorrect()) {
      this.score.update((value) => value + 1);
    }
  }
}
