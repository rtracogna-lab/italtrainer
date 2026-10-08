import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Tts } from '../../shared/tts';
import { Sillabe } from './sillabe';

describe('Sillabe', () => {
  let fixture: ComponentFixture<Sillabe>;
  let c: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sillabe],
      providers: [provideRouter([]), { provide: Tts, useValue: { supported: true, speak: () => {}, cancel: () => {} } }],
    }).compileComponents();
    fixture = TestBed.createComponent(Sillabe);
    c = fixture.componentInstance;
    c.items.set([
      {
        word: 'perché',
        tiles: [
          { id: 0, text: 'ché' },
          { id: 1, text: 'pr' },
          { id: 2, text: 'per' },
          { id: 3, text: 'ch' },
        ],
      },
      ...c.items().slice(1),
    ]);
    fixture.detectChanges();
  });

  const tile = (text: string): HTMLButtonElement =>
    Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('.option-btn')).find(
      (b) => b.textContent!.trim() === text,
    )!;

  it('should build the word from the tapped syllables', () => {
    tile('per').click();
    tile('ché').click();
    fixture.detectChanges();
    expect(c.builtWord()).toBe('perché');
    c.check();
    expect(c.isCorrect()).toBe(true);
    expect(c.score()).toBe(1);
  });

  it('should record a mistake but allow a second attempt', () => {
    tile('pr').click();
    tile('ché').click();
    c.check();
    fixture.detectChanges();
    // Non ancora chiusa: si può correggere.
    expect(c.checked()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('riprova');

    c.removeTile(0);
    c.removeTile(0);
    fixture.detectChanges();
    tile('per').click();
    tile('ché').click();
    c.check();
    expect(c.checked()).toBe(true);
    expect(c.isCorrect()).toBe(true);
    // Giusta solo al secondo tentativo: niente punto, errore nel riepilogo.
    expect(c.score()).toBe(0);
    expect(c.summary()[0].given).toBe('prché');
    expect(c.summary()[0].note).toContain('poi l');
  });

  it('should close the word after two wrong attempts', () => {
    tile('pr').click();
    tile('ché').click();
    c.check();
    c.removeTile(1);
    tile('ch').click();
    c.check();
    expect(c.checked()).toBe(true);
    expect(c.isCorrect()).toBe(false);
    expect(c.summary()[0].note).toContain('prch');
  });

  it('should let a syllable be removed by tapping it', () => {
    tile('pr').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.built__tile').click();
    expect(c.built()).toEqual([]);
  });
});
