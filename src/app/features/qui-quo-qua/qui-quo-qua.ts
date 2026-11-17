import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GIOCO_QUI_QUO_QUA } from '../../core/risultati';
import { Leaderboard } from '../../shared/leaderboard/leaderboard';
import { computeScore, readRecord, saveRecord, TimedAnswer } from '../../shared/punteggio';
import { ScoreCard } from '../../shared/score-card/score-card';
import { shuffle } from '../../shared/shuffle';

interface QuCuWord {
  clue: string;
  prefix: string;
  missing: 'qu' | 'cu' | 'cqu';
  suffix: string;
}

export const OPTIONS = ['qu', 'cu', 'cqu'];

// Parole che allenano la scelta tra "qu", "cu" e "cqu" (l'eccezione di
// "acqua" e derivati). Le opzioni sono sempre le stesse tre per ogni parola.
export const WORDS: QuCuWord[] = [
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
  { clue: '🌳', prefix: '', missing: 'qu', suffix: 'ercia' },
  { clue: '1️⃣5️⃣', prefix: '', missing: 'qu', suffix: 'indici' },
  { clue: '⚽', prefix: 's', missing: 'qu', suffix: 'adra' },
  { clue: '🦈', prefix: 's', missing: 'qu', suffix: 'alo' },
  { clue: '🦅', prefix: 'a', missing: 'qu', suffix: 'ila' },
  { clue: '🧴', prefix: 'li', missing: 'qu', suffix: 'ido' },
  { clue: '🤸', prefix: 'e', missing: 'qu', suffix: 'ilibrio' },
  { clue: '🍲', prefix: '', missing: 'cu', suffix: 'ocere' },
  { clue: '🌑', prefix: 's', missing: 'cu', suffix: 'ro' },
  { clue: '🛋️', prefix: '', missing: 'cu', suffix: 'scino' },
  { clue: '👦', prefix: '', missing: 'cu', suffix: 'gino' },
  { clue: '🎧', prefix: '', missing: 'cu', suffix: 'ffia' },
  { clue: '🎨', prefix: 'a', missing: 'cqu', suffix: 'erello' },
  { clue: '🚿', prefix: 'scia', missing: 'cqu', suffix: 'are' },
  { clue: '🏛️', prefix: 'a', missing: 'cqu', suffix: 'edotto' },
];

const QUESTIONS_PER_ROUND = 10;
const RECORD_KEY = 'italtrainer.qui-quo-qua.record';

function pickRound(): QuCuWord[] {
  return shuffle(WORDS).slice(0, QUESTIONS_PER_ROUND);
}

@Component({
  imports: [Leaderboard, RouterLink, ScoreCard],
  selector: 'app-qui-quo-qua',
  styleUrl: './qui-quo-qua.scss',
  templateUrl: './qui-quo-qua.html',
})
export class QuiQuoQua {
  protected readonly total = QUESTIONS_PER_ROUND;
  protected readonly options = OPTIONS;
  protected readonly game = GIOCO_QUI_QUO_QUA;

  protected readonly words = signal(pickRound());
  protected readonly currentIndex = signal(0);
  protected readonly score = signal(0);
  protected readonly selected = signal<string | null>(null);
  protected readonly answered = signal(false);
  // Tempo di risposta di ogni parola: dalla comparsa della parola alla scelta.
  protected readonly timedAnswers = signal<TimedAnswer[]>([]);
  protected readonly finalScore = computed(() => computeScore(this.timedAnswers()));
  protected readonly record = signal(readRecord(RECORD_KEY));
  protected readonly isNewRecord = signal(false);
  private questionStart = Date.now();

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
    const seconds = (Date.now() - this.questionStart) / 1000;
    this.timedAnswers.update((list) => [...list, { correct: option === this.current().missing, seconds }]);
    if (option === this.current().missing) {
      this.score.update((value) => value + 1);
    }
  }

  protected next(): void {
    this.selected.set(null);
    this.answered.set(false);
    this.currentIndex.update((index) => index + 1);
    this.questionStart = Date.now();
    if (this.isFinished()) {
      this.checkRecord();
    }
  }

  private checkRecord(): void {
    const points = this.finalScore().total;
    this.isNewRecord.set(points > this.record());
    if (this.isNewRecord()) {
      this.record.set(points);
      saveRecord(RECORD_KEY, points);
    }
  }

  protected restart(): void {
    this.words.set(pickRound());
    this.currentIndex.set(0);
    this.score.set(0);
    this.timedAnswers.set([]);
    this.isNewRecord.set(false);
    this.questionStart = Date.now();
    this.selected.set(null);
    this.answered.set(false);
  }
}
