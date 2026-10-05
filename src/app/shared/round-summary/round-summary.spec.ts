import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tts } from '../tts';
import { RoundSummary, SummaryWord } from './round-summary';

describe('RoundSummary', () => {
  let fixture: ComponentFixture<RoundSummary>;
  let spoken: string[];

  const words: SummaryWord[] = [
    { prefix: 'pa', missing: 'll', suffix: 'a', given: 'll' },
    { prefix: 'ca', missing: 'n', suffix: 'e', given: 'nn' },
  ];

  beforeEach(async () => {
    vi.useFakeTimers();
    spoken = [];
    await TestBed.configureTestingModule({
      imports: [RoundSummary],
      providers: [{ provide: Tts, useValue: { supported: true, speak: (t: string) => spoken.push(t), cancel: () => {} } }],
    }).compileComponents();

    fixture = TestBed.createComponent(RoundSummary);
    fixture.componentRef.setInput('words', words);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  const el = (selector: string) => fixture.nativeElement.querySelector(selector);

  it('should colour correct and wrong letters', () => {
    const items = fixture.nativeElement.querySelectorAll('.summary__item');
    expect(items[0].querySelector('.summary__letters--correct').textContent).toBe('ll');
    expect(items[1].querySelector('.summary__letters--wrong').textContent).toBe('n');
    expect(items[1].querySelector('.summary__given').textContent).toContain('nn');
  });

  it('should dictate each word three times in 30 seconds, then move on', () => {
    el('.dictation-start').click();
    fixture.detectChanges();
    expect(el('.dictation__word').textContent.trim()).toBe('palla');
    expect(spoken).toEqual(['palla']);
    expect(el('.dictation__letters').textContent).toBe('ll');

    vi.advanceTimersByTime(20_000);
    expect(spoken).toEqual(['palla', 'palla', 'palla']);

    vi.advanceTimersByTime(10_000);
    fixture.detectChanges();
    expect(el('.dictation__word').textContent.trim()).toBe('cane');
    expect(el('.summary__item--current').textContent).toContain('cane');

    vi.advanceTimersByTime(30_000);
    fixture.detectChanges();
    expect(el('.dictation')).toBeNull();
    expect(el('.dictation-done')).toBeTruthy();
  });
});
