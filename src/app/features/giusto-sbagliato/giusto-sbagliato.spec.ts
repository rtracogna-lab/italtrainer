import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { makeCards, rightText, shownText } from './carte';
import { GAME_SECONDS, GiustoSbagliato } from './giusto-sbagliato';

describe('makeCards', () => {
  it('should show the right word or a wrong option, never an exclamation', () => {
    const cards = makeCards();
    expect(cards.some((card) => card.isRight)).toBe(true);
    expect(cards.some((card) => !card.isRight)).toBe(true);
    for (const card of cards) {
      expect(card.isRight).toBe(card.shown === card.sentence.answer);
      expect(card.sentence.options).toContain(card.shown);
      expect(['Ah', 'Oh', 'Ahi']).not.toContain(card.sentence.answer);
    }
  });

  it('should build the sentence text with the shown word', () => {
    const [card] = makeCards(() => 0.9);
    expect(card.isRight).toBe(false);
    expect(shownText(card)).not.toBe(rightText(card));
  });
});

describe('GiustoSbagliato', () => {
  let fixture: ComponentFixture<GiustoSbagliato>;

  beforeEach(async () => {
    vi.useFakeTimers();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [GiustoSbagliato],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(GiustoSbagliato);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('should score right answers, subtract mistakes and stop after a minute', () => {
    const c = fixture.componentInstance as any;
    c.start();
    for (let i = 0; i < 5; i++) {
      c.answer(c.current().isRight);
    }
    c.answer(!c.current().isRight);
    fixture.detectChanges();
    expect(c.points()).toBe(4);
    expect(fixture.nativeElement.textContent).toContain('😬');

    vi.advanceTimersByTime(GAME_SECONDS * 1000);
    fixture.detectChanges();
    expect(c.phase()).toBe('fine');
    c.answer(true);
    expect(c.results().length).toBe(6);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('4 punti');
    expect(text).toContain('Nuovo record');
    expect(text).toContain('Ripassa le frasi sbagliate');
    expect(localStorage.getItem('italtrainer.giusto-sbagliato.record')).toBe('4');
  });
});
