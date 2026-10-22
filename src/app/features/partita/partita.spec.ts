import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Tts } from '../../shared/tts';
import { pickMatchQuestions, QUESTION_SOURCES } from './domande';
import { ACTIONS_PER_HALF, Partita, shotOutcome } from './partita';

describe('shotOutcome', () => {
  it('should score only fast right answers', () => {
    expect(shotOutcome(true, 3)).toBe('gol');
    expect(shotOutcome(true, 20)).toBe('gol');
    expect(shotOutcome(true, 25)).toBe('parata');
    expect(shotOutcome(false, 2)).toBe('gol-subito');
  });
});

describe('pickMatchQuestions', () => {
  it('should mix questions from every challenge', () => {
    const questions = pickMatchQuestions(10);
    expect(questions.length).toBe(10);
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
  let component: Partita;
  let fixture: ComponentFixture<Partita>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Partita],
      providers: [provideRouter([]), { provide: Tts, useValue: { supported: false, speak: () => {}, cancel: () => {} } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Partita);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => fixture.destroy());

  function answer(c: any, right: boolean, secondsAgo = 0): void {
    const question = c.current();
    c.actionStart = Date.now() - secondsAgo * 1000;
    c.selectOption(right ? question.missing : question.options.find((o: string) => o !== question.missing));
    c.next();
  }

  it('should play two halves and update the score', () => {
    const c = component as any;
    c.kickOff();
    answer(c, true);
    answer(c, true, 30);
    answer(c, false);
    answer(c, true);
    answer(c, true);
    expect(c.phase()).toBe('intervallo');
    expect(c.goalsFor()).toBe(3);
    expect(c.saves()).toBe(1);
    expect(c.goalsAgainst()).toBe(1);

    c.kickOff();
    for (let i = 0; i < ACTIONS_PER_HALF; i++) {
      answer(c, false);
    }
    expect(c.phase()).toBe('fine');
    expect(c.goalsAgainst()).toBe(6);
    expect(c.wins()).toBe(0);
    expect(c.recordGoals()).toBe(3);
  });

  it('should count a win and show the scoreboard', () => {
    const c = component as any;
    c.kickOff();
    for (let i = 0; i < ACTIONS_PER_HALF * 2; i++) {
      if (i === ACTIONS_PER_HALF) {
        c.kickOff();
      }
      answer(c, true);
    }
    fixture.detectChanges();
    expect(c.wins()).toBe(1);
    expect(localStorage.getItem('italtrainer.partita.vittorie')).toBe('1');
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('10 – 0');
    expect(text).toContain('Hai vinto');
  });
});
