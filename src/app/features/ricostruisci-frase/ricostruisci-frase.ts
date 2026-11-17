import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GIOCO_RICOSTRUISCI_FRASE } from '../../core/risultati';
import { Leaderboard } from '../../shared/leaderboard/leaderboard';
import { computeScore, readRecord, saveRecord, SLOW_BONUS_SECONDS, TimedAnswer } from '../../shared/punteggio';
import { ScoreCard } from '../../shared/score-card/score-card';
import { shuffle } from '../../shared/shuffle';

interface SentenceDef {
  clue: string;
  words: string[];
}

interface RoundItem {
  clue: string;
  correctOrder: string[];
}

interface WordChip {
  id: number;
  text: string;
}

// Frasi semplici da ricostruire: il bambino tocca le parole mescolate
// nell'ordine giusto per ricomporre la frase.
const SENTENCES: SentenceDef[] = [
  { clue: '🐱', words: ['Il', 'gatto', 'dorme', 'sul', 'divano.'] },
  { clue: '👩‍🍳', words: ['La', 'mamma', 'prepara', 'la', 'cena.'] },
  { clue: '🏖️', words: ['Domani', 'andiamo', 'al', 'mare.'] },
  { clue: '🐕', words: ['Il', 'cane', 'insegue', 'la', 'palla.'] },
  { clue: '☀️', words: ['Oggi', 'il', 'sole', 'splende', 'forte.'] },
  { clue: '📖', words: ['Mia', 'sorella', 'legge', 'un', 'libro.'] },
  { clue: '🧒', words: ['I', 'bambini', 'giocano', 'in', 'giardino.'] },
  { clue: '👴', words: ['Il', 'nonno', 'racconta', 'una', 'storia.'] },
  { clue: '🍕', words: ['Stasera', 'mangiamo', 'la', 'pizza.'] },
  { clue: '🚂', words: ['Il', 'treno', 'arriva', 'in', 'stazione.'] },
  { clue: '🦋', words: ['La', 'farfalla', 'vola', 'sui', 'fiori.'] },
  { clue: '👵', words: ['Domenica', 'andremo', 'dai', 'nonni.'] },
  // Frasi più lunghe e complesse (7-9 parole).
  { clue: '🐾', words: ['Ogni', 'mattina', 'portiamo', 'il', 'cane', 'a', 'spasso.'] },
  {
    clue: '👩‍🏫',
    words: ['La', 'maestra', 'ha', 'raccontato', 'una', 'storia', 'molto', 'divertente.'],
  },
  {
    clue: '🌈',
    words: ['Dopo', 'la', 'pioggia', 'è', 'apparso', 'un', 'bellissimo', 'arcobaleno.'],
  },
  {
    clue: '🎁',
    words: ['I', 'miei', 'amici', 'mi', 'hanno', 'regalato', 'un', 'libro', 'nuovo.'],
  },
  { clue: '🌊', words: ["D'estate", 'andiamo', 'sempre', 'al', 'mare', 'con', 'i', 'nonni.'] },
  { clue: '🐦', words: ['Il', 'piccolo', 'uccellino', 'è', 'caduto', 'dal', 'suo', 'nido.'] },
  {
    clue: '☕',
    words: ['Quando', 'fa', 'freddo', 'mi', 'piace', 'bere', 'una', 'cioccolata', 'calda.'],
  },
  {
    clue: '🏫',
    words: ['Il', 'mio', 'migliore', 'amico', 'abita', 'vicino', 'alla', 'scuola.'],
  },
];

const QUESTIONS_PER_ROUND = 10;
const RECORD_KEY = 'italtrainer.ricostruisci-frase.record';

function pickRound(): RoundItem[] {
  return shuffle(SENTENCES)
    .slice(0, QUESTIONS_PER_ROUND)
    .map((sentence) => ({ clue: sentence.clue, correctOrder: sentence.words }));
}

function shuffledBank(words: string[]): WordChip[] {
  return shuffle(words.map((text, id) => ({ id, text })));
}

@Component({
  imports: [Leaderboard, RouterLink, ScoreCard],
  selector: 'app-ricostruisci-frase',
  styleUrl: './ricostruisci-frase.scss',
  templateUrl: './ricostruisci-frase.html',
})
export class RicostruisciFrase {
  protected readonly total = QUESTIONS_PER_ROUND;
  protected readonly game = GIOCO_RICOSTRUISCI_FRASE;

  protected readonly items = signal(pickRound());
  protected readonly currentIndex = signal(0);
  protected readonly score = signal(0);
  // Tempo di risposta di ogni domanda: dalla comparsa alla risposta.
  protected readonly timedAnswers = signal<TimedAnswer[]>([]);
  protected readonly finalScore = computed(() => computeScore(this.timedAnswers(), SLOW_BONUS_SECONDS));
  protected readonly record = signal(readRecord(RECORD_KEY));
  protected readonly isNewRecord = signal(false);
  private questionStart = Date.now();
  protected readonly checked = signal(false);
  protected readonly bank = signal<WordChip[]>([]);
  protected readonly answer = signal<WordChip[]>([]);

  protected readonly isFinished = computed(() => this.currentIndex() >= this.total);
  protected readonly current = computed(() => this.items()[this.currentIndex()]);
  protected readonly isCorrect = computed(() => {
    const chips = this.answer();
    return (
      chips.length === this.current().correctOrder.length &&
      chips.every((chip, index) => chip.id === index)
    );
  });

  constructor() {
    this.bank.set(shuffledBank(this.current().correctOrder));
  }

  protected placeWord(chip: WordChip): void {
    if (this.checked()) {
      return;
    }
    this.bank.update((chips) => chips.filter((c) => c.id !== chip.id));
    this.answer.update((chips) => [...chips, chip]);
  }

  protected removeWord(chip: WordChip): void {
    if (this.checked()) {
      return;
    }
    this.answer.update((chips) => chips.filter((c) => c.id !== chip.id));
    this.bank.update((chips) => [...chips, chip]);
  }

  protected clearAnswer(): void {
    if (this.checked() || this.answer().length === 0) {
      return;
    }
    this.bank.update((chips) => [...chips, ...this.answer()]);
    this.answer.set([]);
  }

  protected check(): void {
    if (this.checked() || this.bank().length > 0) {
      return;
    }
    const seconds = (Date.now() - this.questionStart) / 1000;
    this.timedAnswers.update((list) => [...list, { correct: this.isCorrect(), seconds }]);
    this.checked.set(true);
    if (this.isCorrect()) {
      this.score.update((value) => value + 1);
    }
  }

  protected next(): void {
    const nextIndex = this.currentIndex() + 1;
    this.checked.set(false);
    this.answer.set([]);
    this.currentIndex.set(nextIndex);
    this.questionStart = Date.now();
    if (this.isFinished()) {
      this.checkRecord();
    }
    this.bank.set(nextIndex < this.total ? shuffledBank(this.items()[nextIndex].correctOrder) : []);
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
    const freshItems = pickRound();
    this.items.set(freshItems);
    this.currentIndex.set(0);
    this.score.set(0);
    this.timedAnswers.set([]);
    this.isNewRecord.set(false);
    this.questionStart = Date.now();
    this.checked.set(false);
    this.answer.set([]);
    this.bank.set(shuffledBank(freshItems[0].correctOrder));
  }
}
