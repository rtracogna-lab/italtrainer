import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoundSummary, SummaryWord } from '../../shared/round-summary/round-summary';
import { shuffle } from '../../shared/shuffle';
import { Whistle } from '../../shared/fischio';
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
// intanto corre, come in una partita vera. Dopo un errore invece la partita
// si ferma finché non si preme "Riprendi", per avere il tempo di capire.
export const RIGHT_PAUSE_MS = 700;
// Il gol dura di più: c'è l'animazione e il telecronista che urla.
export const GOAL_PAUSE_MS = 5000;
// Il grido del gol: tre "Gol!" con una pausa tra l'uno e l'altro, poi un
// "Goool" lungo, letto lentamente.
export const GOAL_CRY = ['Gol!', 'Gol!', 'Gol!', 'Gooooooool!'];
const CRY_PAUSE_MS = 350;
const CRY_RATE = 1.1;
const LONG_CRY_RATE = 0.5;
// Fischi dell'arbitro (durate in ms): uno per iniziare, due per l'intervallo,
// il triplice fischio per la fine.
export const KICK_OFF_WHISTLE = [500];
export const HALF_TIME_WHISTLE = [300, 700];
export const FULL_TIME_WHISTLE = [250, 250, 1000];
// Contropiede: ogni tanto, a caso, gli avversari ripartono e torna una domanda
// sbagliata in precedenza. Se si sbaglia di nuovo, è gol per loro. Una domanda
// torna solo dopo almeno qualche risposta, sennò sarebbe troppo facile.
export const COUNTER_CHANCE = 0.2;
export const COUNTER_MIN_AGE = 3;
export const COUNTER_SAVED_PAUSE_MS = 1500;
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
  // Numero della risposta in cui è arrivato l'errore.
  at: number;
  // Rifatta giusta durante un contropiede: non torna più.
  redeemed: boolean;
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

function questionText({ prefix, missing, suffix }: MatchQuestion): string {
  return prefix + missing + suffix;
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
  private readonly whistle = inject(Whistle);

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
  // Partita ferma dopo un errore, in attesa di "Riprendi".
  protected readonly paused = signal(false);
  // La domanda in corso è un contropiede degli avversari.
  protected readonly counter = signal(false);
  protected readonly counters = signal(0);
  protected readonly countersStopped = signal(0);
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
  private pausedAt = 0;
  private answeredCount = 0;
  // Sostituibile nei test per decidere quando scatta il contropiede.
  private random = Math.random;
  // Ogni gol incrementa il contatore: un grido ancora in corso di un gol
  // precedente se ne accorge e si ferma.
  private cry = 0;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private advance: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    this.stopTimers();
    this.cry++;
  }

  protected speak(): void {
    const { prefix, missing, suffix } = this.current();
    this.tts.speak(prefix + missing + suffix);
  }

  // Fischio d'inizio, sia del primo che del secondo tempo.
  protected kickOff(): void {
    this.whistle.play(KICK_OFF_WHISTLE);
    this.phase.set('gioco');
    this.minute.set((this.half() - 1) * HALF_MINUTES);
    this.halfStart = Date.now();
    this.startTicker();
  }

  // Dopo un errore: il cronometro riparte da dove si era fermato.
  protected resume(): void {
    if (!this.paused()) {
      return;
    }
    this.halfStart += Date.now() - this.pausedAt;
    this.paused.set(false);
    this.startTicker();
    this.nextQuestion();
  }

  protected selectOption(option: string): void {
    if (this.answered() || this.phase() !== 'gioco') {
      return;
    }
    this.selected.set(option);
    this.answered.set(true);
    this.answeredCount++;
    if (this.counter()) {
      this.answerCounter(option === this.current().missing);
    } else if (option === this.current().missing) {
      this.rightAnswers.update((value) => value + 1);
      this.wrongStreak.set(0);
      this.rightStreak.update((value) => value + 1);
      this.bestStreak.update((value) => Math.max(value, this.rightStreak()));
      const pause = this.rightStreak() === STREAK_FOR_GOAL ? this.score('noi') : RIGHT_PAUSE_MS;
      this.advance = setTimeout(() => this.nextQuestion(), pause);
    } else {
      this.mistakes.update((list) => [
        ...list,
        { question: this.current(), given: option, at: this.answeredCount, redeemed: false },
      ]);
      this.rightStreak.set(0);
      this.wrongStreak.update((value) => value + 1);
      if (this.wrongStreak() === MISTAKES_FOR_GOAL) {
        this.score('loro');
      }
      this.pause();
    }
  }

  protected restart(): void {
    this.stopTimers();
    this.paused.set(false);
    this.cry++;
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
    this.counters.set(0);
    this.countersStopped.set(0);
    this.answeredCount = 0;
    this.isNewRecord.set(false);
  }

  // Contropiede: se si risponde giusto è fermato e la domanda non torna più,
  // senza toccare le serie; se si sbaglia di nuovo gli avversari segnano.
  private answerCounter(right: boolean): void {
    const text = questionText(this.current());
    if (right) {
      this.countersStopped.update((value) => value + 1);
      this.mistakes.update((list) =>
        list.map((mistake) => (questionText(mistake.question) === text ? { ...mistake, redeemed: true } : mistake)),
      );
      this.advance = setTimeout(() => this.nextQuestion(), COUNTER_SAVED_PAUSE_MS);
    } else {
      this.score('loro');
      this.pause();
    }
  }

  // Una domanda sbagliata abbastanza tempo fa e non ancora rifatta giusta.
  private pickCounterQuestion(): MatchQuestion | null {
    const candidates = this.mistakes().filter(
      (mistake) => !mistake.redeemed && this.answeredCount - mistake.at >= COUNTER_MIN_AGE,
    );
    if (candidates.length === 0 || this.random() >= COUNTER_CHANCE) {
      return null;
    }
    return candidates[Math.floor(this.random() * candidates.length)].question;
  }

  // Segna il gol e restituisce quanto far durare la festa.
  private score(side: Side): number {
    this.goals.update((list) => [...list, { side, minute: this.clock() }]);
    this.justScored.set(side);
    this.resetStreaks();
    if (side === 'noi') {
      void this.cheer();
    }
    return GOAL_PAUSE_MS;
  }

  private async cheer(): Promise<void> {
    const id = ++this.cry;
    for (let index = 0; index < GOAL_CRY.length; index++) {
      if (index > 0) {
        await new Promise((resolve) => setTimeout(resolve, CRY_PAUSE_MS));
      }
      if (id !== this.cry) {
        return;
      }
      const last = index === GOAL_CRY.length - 1;
      await this.tts.speak(GOAL_CRY[index], last ? LONG_CRY_RATE : CRY_RATE);
    }
  }

  private pause(): void {
    this.stopTimers();
    this.pausedAt = Date.now();
    this.paused.set(true);
  }

  private startTicker(): void {
    this.ticker = setInterval(() => this.tick(), 200);
  }

  private nextQuestion(): void {
    this.advance = null;
    // Niente contropiede subito dopo un gol, né due di fila.
    const calm = this.justScored() === null && !this.counter();
    this.resetAction();
    const index = this.currentIndex() + 1;
    const counterQuestion = calm ? this.pickCounterQuestion() : null;
    if (counterQuestion) {
      this.questions.update((list) => [
        ...list.slice(0, index),
        { ...counterQuestion, options: shuffle(counterQuestion.options) },
        ...list.slice(index),
      ]);
      this.counter.set(true);
      this.counters.update((value) => value + 1);
    }
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
      this.whistle.play(HALF_TIME_WHISTLE);
    } else {
      this.finish();
    }
  }

  private finish(): void {
    this.phase.set('fine');
    this.whistle.play(FULL_TIME_WHISTLE);
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
    this.counter.set(false);
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
