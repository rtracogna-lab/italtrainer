import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Whistle } from '../../shared/fischio';
import { Tts } from '../../shared/tts';
import { pickMatchQuestions, QUESTION_SOURCES } from './domande';
import {
  COUNTER_SAVED_PAUSE_MS,
  FULL_TIME_WHISTLE,
  GOAL_PAUSE_MS,
  HALF_MINUTES,
  HALF_TIME_WHISTLE,
  KICK_OFF_WHISTLE,
  Partita,
  REAL_MS_PER_MINUTE,
  GOAL_CRY,
} from './partita';

describe('pickMatchQuestions', () => {
  it('should mix questions from every challenge', () => {
    const count = QUESTION_SOURCES.length * 2;
    const questions = pickMatchQuestions(count);
    expect(questions.length).toBe(count);
    for (const source of QUESTION_SOURCES) {
      const missings = new Set(source.map((q) => q.prefix + q.missing + q.suffix));
      expect(questions.some((q) => missings.has(q.prefix + q.missing + q.suffix))).toBe(true);
    }
  });

  it('should always include the right answer among the options', () => {
    for (const question of QUESTION_SOURCES.flat()) {
      expect(question.options).toContain(question.missing);
    }
  });
});

describe('Partita', () => {
  let fixture: ComponentFixture<Partita>;
  let c: any;
  let spoken: string[];
  let whistles: number[][];

  beforeEach(async () => {
    vi.useFakeTimers();
    spoken = [];
    whistles = [];
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Partita],
      providers: [
        provideRouter([]),
        {
          provide: Tts,
          useValue: {
            supported: false,
            speak: (text: string) => spoken.push(text),
            cancel: () => {},
          },
        },
        { provide: Whistle, useValue: { play: (blasts: number[]) => whistles.push(blasts) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Partita);
    c = fixture.componentInstance;
    fixture.detectChanges();
    // Nessun contropiede, se non nei test che lo chiedono.
    c.random = () => 1;
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  // Risponde e passa alla domanda seguente: dopo un errore premendo "Riprendi".
  function answer(right: boolean): void {
    const question = c.current();
    c.selectOption(
      right ? question.missing : question.options.find((o: string) => o !== question.missing),
    );
    if (right) {
      vi.advanceTimersByTime(GOAL_PAUSE_MS);
    } else {
      c.resume();
    }
  }

  it('should bring back an old mistake as a counterattack: wrong again means a goal', () => {
    c.kickOff();
    answer(false);
    const mistake = c.mistakes()[0].question;
    const text = (q: any) => q.prefix + q.missing + q.suffix;
    // Troppo presto: la domanda sbagliata non torna subito.
    c.random = () => 0;
    answer(true);
    answer(true);
    expect(c.counter()).toBe(false);
    answer(true);
    expect(c.counter()).toBe(true);
    expect(text(c.current())).toBe(text(mistake));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('CONTROPIEDE');

    // Sbagliata di nuovo: gol degli avversari e partita ferma.
    const question = c.current();
    c.selectOption(question.options.find((o: string) => o !== question.missing));
    expect(c.goalsAgainst()).toBe(1);
    expect(c.paused()).toBe(true);
    c.resume();
    expect(c.counter()).toBe(false);

    // La volta dopo la rifà giusta: contropiede fermato e non torna più.
    c.random = () => 1;
    answer(true);
    answer(true);
    answer(true);
    c.random = () => 0;
    answer(true);
    expect(c.counter()).toBe(true);
    c.selectOption(c.current().missing);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Contropiede fermato');
    vi.advanceTimersByTime(COUNTER_SAVED_PAUSE_MS);
    expect(c.counter()).toBe(false);
    expect(c.countersStopped()).toBe(1);
    expect(c.counters()).toBe(2);
    answer(true);
    answer(true);
    expect(c.counter()).toBe(false);
  });

  it('should stop the clock after a mistake until "Riprendi" is pressed', () => {
    c.kickOff();
    vi.advanceTimersByTime(5 * REAL_MS_PER_MINUTE);
    const question = c.current();
    c.selectOption(question.options.find((o: string) => o !== question.missing));
    const minute = c.minute();

    vi.advanceTimersByTime(60_000);
    fixture.detectChanges();
    expect(c.minute()).toBe(minute);
    expect(c.current()).toBe(question);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('gioco fermo');
    if (question.tip) {
      expect(text).toContain(question.tip);
    }

    const resume = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent!.includes('Riprendi'))!;
    resume.click();
    expect(c.current()).not.toBe(question);
    vi.advanceTimersByTime(REAL_MS_PER_MINUTE);
    expect(c.minute()).toBeCloseTo(minute + 1, 1);
  });

  it('should score after 5 right answers in a row and concede after 2 mistakes in a row', () => {
    c.kickOff();
    answer(true);
    answer(true);
    answer(false);
    expect(c.rightStreak()).toBe(0);
    expect(c.wrongStreak()).toBe(1);

    // Una risposta giusta azzera gli errori di fila.
    for (let i = 0; i < 5; i++) {
      answer(true);
    }
    expect(c.goalsFor()).toBe(1);
    expect(c.goalsAgainst()).toBe(0);
    expect(c.rightStreak()).toBe(0);

    answer(false);
    answer(false);
    expect(c.goalsAgainst()).toBe(1);
    expect(c.bestStreak()).toBe(5);
    expect(c.mistakes().length).toBe(3);
  });

  it('should show the goal celebration until the next question', async () => {
    c.kickOff();
    for (let i = 0; i < 4; i++) {
      answer(true);
    }
    const question = c.current();
    c.selectOption(question.missing);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.goal-anim__cry').textContent).toContain(
      'GO GO GO GOOOL',
    );
    expect(spoken).toEqual(['Gol!']);

    // I "Gol!" arrivano uno alla volta, con una pausa, poi il "Goool" lungo.
    await vi.advanceTimersByTimeAsync(GOAL_PAUSE_MS);
    expect(spoken).toEqual(GOAL_CRY);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('GOOOL');
    expect(c.current()).not.toBe(question);
  });

  it('should play two halves of 45 game minutes in about 4 and a half real minutes', () => {
    c.kickOff();
    vi.advanceTimersByTime(10 * REAL_MS_PER_MINUTE);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("11'");

    vi.advanceTimersByTime((HALF_MINUTES - 10) * REAL_MS_PER_MINUTE);
    expect(c.phase()).toBe('intervallo');

    c.kickOff();
    expect(c.minute()).toBe(HALF_MINUTES);
    for (let i = 0; i < 5; i++) {
      answer(true);
    }
    vi.advanceTimersByTime(HALF_MINUTES * REAL_MS_PER_MINUTE);
    fixture.detectChanges();
    expect(c.phase()).toBe('fine');
    expect(c.wins()).toBe(1);
    expect(localStorage.getItem('italtrainer.partita.vittorie')).toBe('1');
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('1 – 0');
    expect(text).toContain('Hai vinto');
    expect(whistles).toEqual([
      KICK_OFF_WHISTLE,
      HALF_TIME_WHISTLE,
      KICK_OFF_WHISTLE,
      FULL_TIME_WHISTLE,
    ]);
  });
});
