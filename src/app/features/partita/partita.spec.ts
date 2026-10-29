import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Tts } from '../../shared/tts';
import { pickMatchQuestions, QUESTION_SOURCES } from './domande';
import { GOAL_PAUSE_MS, HALF_MINUTES, Partita, REAL_MS_PER_MINUTE, WRONG_PAUSE_MS } from './partita';

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

  beforeEach(async () => {
    vi.useFakeTimers();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Partita],
      providers: [provideRouter([]), { provide: Tts, useValue: { supported: false, speak: () => {}, cancel: () => {} } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Partita);
    c = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  // Risponde e aspetta che arrivi la domanda seguente.
  function answer(right: boolean): void {
    const question = c.current();
    c.selectOption(right ? question.missing : question.options.find((o: string) => o !== question.missing));
    vi.advanceTimersByTime(GOAL_PAUSE_MS + WRONG_PAUSE_MS);
  }

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

  it('should show the goal celebration until the next question', () => {
    c.kickOff();
    for (let i = 0; i < 4; i++) {
      answer(true);
    }
    const question = c.current();
    c.selectOption(question.missing);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('GOOOL');

    vi.advanceTimersByTime(GOAL_PAUSE_MS);
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
  });
});
