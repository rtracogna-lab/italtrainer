import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoundSummary, SummaryWord } from '../../shared/round-summary/round-summary';
import { shuffle } from '../../shared/shuffle';
import { Tts } from '../../shared/tts';
import { MatchQuestion, pickMatchQuestions } from './domande';

type Phase = 'prepartita' | 'gioco' | 'intervallo' | 'fine';
type Side = 'noi' | 'loro';

// Due tempi da 45 minuti: un minuto di gioco dura 3 secondi veri, quindi la
// partita intera dura circa 4 minuti e mezzo.
export const HALF_MINUTES = 45;
export const REAL_MS_PER_MINUTE = 3000;
// Gol dopo 5 risposte giuste di fila, gol degli avversari dopo 2 errori di fila.
export const STREAK_FOR_GOAL = 5;
export const MISTAKES_FOR_GOAL = 2;
// Quanto resta a schermo l'esito prima della domanda seguente. Il cronometro
// intanto corre, come in una partita vera.
export const RIGHT_PAUSE_MS = 700;
export const WRONG_PAUSE_MS = 2500;
export const GOAL_PAUSE_MS = 2000;
const QUESTIONS_PER_BATCH = 20;
const WINS_KEY = 'italtrainer.partita.vittorie';
const RECORD_GOALS_KEY = 'italtrainer.partita.record-gol';

interface Opponent {
  name: string;
  badge: string;
}

interface Goal {
  side: Side;
  minute: number;
}

interface Mistake {
  question: MatchQuestion;
  given: string;
}

const OPPONENTS: Opponent[] = [
  { name: 'Leoni Ruggenti', badge: '🦁' },
  { name: 'Aquile Volanti', badge: '🦅' },
  { name: 'Lupi Grigi', badge: '🐺' },
  { name: 'Squali Blu', badge: '🦈' },
  { name: 'Tigri Arancioni', badge: '🐯' },
  { name: 'Draghi Verdi', badge: '🐲' },
];

function readNumber(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

function saveNumber(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Senza memoria del browser il record semplicemente non si salva.
  }
}

function pickOpponent(): Opponent {
  return shuffle(OPPONENTS)[0];
}

@Component({
  imports: [RouterLink, RoundSummary],
  selector: 'app-partita',
  styleUrl: './partita.scss',
  templateUrl: './partita.html',
})
export class Partita implements OnDestroy {
  protected readonly tts = inject(Tts);

  protected readonly halfMinutes = HALF_MINUTES;
  protected readonly streakForGoal = STREAK_FOR_GOAL;
  protected readonly mistakesForGoal = MISTAKES_FOR_GOAL;
  protected readonly realMinutes = Math.round((2 * HALF_MINUTES * REAL_MS_PER_MINUTE) / 6000) / 10;
  protected readonly streakSlots = Array.from({ length: STREAK_FOR_GOAL }, (_, index) => index);

  protected readonly phase = signal<Phase>('prepartita');
  protected readonly half = signal<1 | 2>(1);
  // Minuto di gioco, con i decimali: da 0 a 45 nel primo tempo, da 45 a 90
  // nel secondo.
  protected readonly minute = signal(0);
  protected readonly opponent = signal(pickOpponent());
  protected readonly questions = signal(pickMatchQuestions(QUESTIONS_PER_BATCH));
  protected readonly currentIndex = signal(0);
  protected readonly selected = signal<string | null>(null);
  protected readonly answered = signal(false);
  protected readonly rightStreak = signal(0);
  protected readonly wrongStreak = signal(0);
  protected readonly bestStreak = signal(0);
  protected readonly rightAnswers = signal(0);
  protected readonly goals = signal<Goal[]>([]);
  protected readonly mistakes = signal<Mistake[]>([]);
  // Gol appena segnato (da una parte o dall'altra), per festeggiarlo.
  protected readonly justScored = signal<Side | null>(null);
  protected readonly wins = signal(readNumber(WINS_KEY));
  protected readonly recordGoals = signal(readNumber(RECORD_GOALS_KEY));
  protected readonly isNewRecord = signal(false);

  protected readonly current = computed(() => this.questions()[this.currentIndex()]);
  protected readonly isCorrect = computed(() => this.selected() === this.current().missing);
  protected readonly goalsFor = computed(() => this.goals().filter((goal) => goal.side === 'noi').length);
  protected readonly goalsAgainst = computed(() => this.goals().filter((goal) => goal.side === 'loro').length);
  protected readonly clock = computed(() => Math.min(Math.floor(this.minute()) + 1, this.half() * HALF_MINUTES));
  protected readonly halfProgress = computed(
    () => ((this.minute() - (this.half() - 1) * HALF_MINUTES) / HALF_MINUTES) * 100,
  );
  protected readonly summary = computed<SummaryWord[]>(() =>
    this.mistakes().map(({ question, given }) => ({
      prefix: question.prefix,
      missing: question.missing,
      suffix: question.suffix,
      given,
    })),
  );

  private halfStart = 0;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private advance: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    this.stopTimers();
  }

  protected speak(): void {
    const { prefix, missing, suffix } = this.current();
    this.tts.speak(prefix + missing + suffix);
  }

  // Fischio d'inizio, sia del primo che del secondo tempo.
  protected kickOff(): void {
    this.phase.set('gioco');
    this.minute.set((this.half() - 1) * HALF_MINUTES);
    this.halfStart = Date.now();
    this.ticker = setInterval(() => this.tick(), 200);
  }

  protected selectOption(option: string): void {
    if (this.answered() || this.phase() !== 'gioco') {
      return;
    }
    this.selected.set(option);
    this.answered.set(true);
    let pause: number;
    if (option === this.current().missing) {
      this.rightAnswers.update((value) => value + 1);
      this.wrongStreak.set(0);
      this.rightStreak.update((value) => value + 1);
      this.bestStreak.update((value) => Math.max(value, this.rightStreak()));
      pause = this.rightStreak() === STREAK_FOR_GOAL ? this.score('noi') : RIGHT_PAUSE_MS;
    } else {
      this.mistakes.update((list) => [...list, { question: this.current(), given: option }]);
      this.rightStreak.set(0);
      this.wrongStreak.update((value) => value + 1);
      pause = this.wrongStreak() === MISTAKES_FOR_GOAL ? this.score('loro') : WRONG_PAUSE_MS;
    }
    this.advance = setTimeout(() => this.nextQuestion(), pause);
  }

  protected restart(): void {
    this.stopTimers();
    this.phase.set('prepartita');
    this.half.set(1);
    this.minute.set(0);
    this.opponent.set(pickOpponent());
    this.questions.set(pickMatchQuestions(QUESTIONS_PER_BATCH));
    this.currentIndex.set(0);
    this.resetAction();
    this.resetStreaks();
    this.bestStreak.set(0);
    this.rightAnswers.set(0);
    this.goals.set([]);
    this.mistakes.set([]);
    this.isNewRecord.set(false);
  }

  // Segna il gol e restituisce quanto far durare la festa.
  private score(side: Side): number {
    this.goals.update((list) => [...list, { side, minute: this.clock() }]);
    this.justScored.set(side);
    this.resetStreaks();
    return GOAL_PAUSE_MS;
  }

  private nextQuestion(): void {
    this.advance = null;
    this.resetAction();
    const index = this.currentIndex() + 1;
    // Le domande non finiscono mai: quando stanno per finire se ne aggiungono altre.
    if (index >= this.questions().length) {
      this.questions.update((list) => [...list, ...pickMatchQuestions(QUESTIONS_PER_BATCH)]);
    }
    this.currentIndex.set(index);
  }

  private tick(): void {
    const end = this.half() * HALF_MINUTES;
    const minute = (this.half() - 1) * HALF_MINUTES + (Date.now() - this.halfStart) / REAL_MS_PER_MINUTE;
    this.minute.set(Math.min(minute, end));
    if (minute >= end) {
      this.endHalf();
    }
  }

  // Fischio di fine tempo: la domanda in corso resta a metà.
  private endHalf(): void {
    this.stopTimers();
    if (this.answered()) {
      this.nextQuestion();
    }
    this.resetAction();
    this.resetStreaks();
    if (this.half() === 1) {
      this.half.set(2);
      this.phase.set('intervallo');
    } else {
      this.finish();
    }
  }

  private finish(): void {
    this.phase.set('fine');
    if (this.goalsFor() > this.goalsAgainst()) {
      this.wins.update((value) => value + 1);
      saveNumber(WINS_KEY, this.wins());
    }
    this.isNewRecord.set(this.goalsFor() > this.recordGoals());
    if (this.isNewRecord()) {
      this.recordGoals.set(this.goalsFor());
      saveNumber(RECORD_GOALS_KEY, this.goalsFor());
    }
  }

  private resetAction(): void {
    this.selected.set(null);
    this.answered.set(false);
    this.justScored.set(null);
  }

  private resetStreaks(): void {
    this.rightStreak.set(0);
    this.wrongStreak.set(0);
  }

  private stopTimers(): void {
    if (this.ticker !== null) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
    if (this.advance !== null) {
      clearTimeout(this.advance);
      this.advance = null;
    }
  }
}
