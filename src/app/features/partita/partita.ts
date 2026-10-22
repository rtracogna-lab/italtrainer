import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoundSummary, SummaryWord } from '../../shared/round-summary/round-summary';
import { shuffle } from '../../shared/shuffle';
import { Tts } from '../../shared/tts';
import { pickMatchQuestions } from './domande';

type Phase = 'prepartita' | 'gioco' | 'intervallo' | 'fine';
export type Outcome = 'gol' | 'parata' | 'gol-subito';

export const ACTIONS_PER_HALF = 5;
const TOTAL_ACTIONS = ACTIONS_PER_HALF * 2;
// Entro questo tempo la risposta giusta è gol, dopo il portiere para.
export const GOAL_SECONDS = 20;
const MINUTES_PER_ACTION = 90 / TOTAL_ACTIONS;
const WINS_KEY = 'italtrainer.partita.vittorie';
const RECORD_GOALS_KEY = 'italtrainer.partita.record-gol';

interface Opponent {
  name: string;
  badge: string;
}

const OPPONENTS: Opponent[] = [
  { name: 'Leoni Ruggenti', badge: '🦁' },
  { name: 'Aquile Volanti', badge: '🦅' },
  { name: 'Lupi Grigi', badge: '🐺' },
  { name: 'Squali Blu', badge: '🦈' },
  { name: 'Tigri Arancioni', badge: '🐯' },
  { name: 'Draghi Verdi', badge: '🐲' },
];

// Risposta giusta e veloce: gol. Giusta ma lenta: parata. Sbagliata:
// contropiede e gol degli avversari.
export function shotOutcome(correct: boolean, seconds: number): Outcome {
  if (!correct) {
    return 'gol-subito';
  }
  return seconds <= GOAL_SECONDS ? 'gol' : 'parata';
}

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

  protected readonly actionsPerHalf = ACTIONS_PER_HALF;
  protected readonly total = TOTAL_ACTIONS;
  protected readonly goalSeconds = GOAL_SECONDS;

  protected readonly phase = signal<Phase>('prepartita');
  protected readonly opponent = signal(pickOpponent());
  protected readonly questions = signal(pickMatchQuestions(TOTAL_ACTIONS));
  protected readonly currentIndex = signal(0);
  protected readonly selected = signal<string | null>(null);
  protected readonly answered = signal(false);
  protected readonly answers = signal<string[]>([]);
  protected readonly outcomes = signal<Outcome[]>([]);
  // Secondi passati dall'inizio dell'azione, per la barra del tiro.
  protected readonly elapsed = signal(0);
  protected readonly wins = signal(readNumber(WINS_KEY));
  protected readonly recordGoals = signal(readNumber(RECORD_GOALS_KEY));
  protected readonly isNewRecord = signal(false);

  protected readonly current = computed(() => this.questions()[this.currentIndex()]);
  protected readonly isCorrect = computed(() => this.selected() === this.current().missing);
  protected readonly lastOutcome = computed(() => this.outcomes().at(-1));
  protected readonly goalsFor = computed(() => this.count('gol'));
  protected readonly goalsAgainst = computed(() => this.count('gol-subito'));
  protected readonly saves = computed(() => this.count('parata'));
  protected readonly half = computed(() => (this.currentIndex() < ACTIONS_PER_HALF ? 1 : 2));
  protected readonly minute = computed(() => Math.round((this.currentIndex() + 1) * MINUTES_PER_ACTION));
  protected readonly timeLeftPercent = computed(() => Math.max(0, 1 - this.elapsed() / GOAL_SECONDS) * 100);
  // Solo i gol, con il minuto in cui sono arrivati.
  protected readonly goals = computed(() =>
    this.outcomes()
      .map((outcome, index) => ({ outcome, minute: Math.round((index + 1) * MINUTES_PER_ACTION) }))
      .filter(({ outcome }) => outcome !== 'parata'),
  );
  protected readonly summary = computed<SummaryWord[]>(() =>
    this.questions().map(({ prefix, missing, suffix }, index) => ({
      prefix,
      missing,
      suffix,
      given: this.answers()[index],
    })),
  );

  private actionStart = Date.now();
  private clock: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.stopClock();
  }

  protected speak(): void {
    const { prefix, missing, suffix } = this.current();
    this.tts.speak(prefix + missing + suffix);
  }

  // Fischio d'inizio, sia del primo che del secondo tempo.
  protected kickOff(): void {
    this.phase.set('gioco');
    this.startClock();
  }

  protected selectOption(option: string): void {
    if (this.answered()) {
      return;
    }
    this.stopClock();
    const seconds = (Date.now() - this.actionStart) / 1000;
    this.selected.set(option);
    this.answered.set(true);
    this.answers.update((list) => [...list, option]);
    this.outcomes.update((list) => [...list, shotOutcome(option === this.current().missing, seconds)]);
  }

  protected next(): void {
    this.selected.set(null);
    this.answered.set(false);
    const index = this.currentIndex() + 1;
    this.currentIndex.set(index);
    if (index === ACTIONS_PER_HALF) {
      this.phase.set('intervallo');
    } else if (index >= TOTAL_ACTIONS) {
      this.finish();
    } else {
      this.startClock();
    }
  }

  protected restart(): void {
    this.stopClock();
    this.phase.set('prepartita');
    this.opponent.set(pickOpponent());
    this.questions.set(pickMatchQuestions(TOTAL_ACTIONS));
    this.currentIndex.set(0);
    this.selected.set(null);
    this.answered.set(false);
    this.answers.set([]);
    this.outcomes.set([]);
    this.elapsed.set(0);
    this.isNewRecord.set(false);
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

  private count(outcome: Outcome): number {
    return this.outcomes().filter((value) => value === outcome).length;
  }

  private startClock(): void {
    this.stopClock();
    this.actionStart = Date.now();
    this.elapsed.set(0);
    this.clock = setInterval(() => {
      const seconds = (Date.now() - this.actionStart) / 1000;
      this.elapsed.set(Math.min(seconds, GOAL_SECONDS));
      if (seconds >= GOAL_SECONDS) {
        this.stopClock();
      }
    }, 100);
  }

  private stopClock(): void {
    if (this.clock !== null) {
      clearInterval(this.clock);
      this.clock = null;
    }
  }
}
