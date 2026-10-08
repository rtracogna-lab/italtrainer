import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Tts } from '../../shared/tts';
import { LetteraMancante } from './lettera-mancante';

describe('LetteraMancante', () => {
  let fixture: ComponentFixture<LetteraMancante>;
  let c: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LetteraMancante],
      providers: [provideRouter([]), { provide: Tts, useValue: { supported: true, speak: () => {}, cancel: () => {} } }],
    }).compileComponents();
    fixture = TestBed.createComponent(LetteraMancante);
    c = fixture.componentInstance;
    c.items.set([
      { word: 'perché', index: 1, letter: 'e', shown: 'prché', options: ['a', 'e', 'i', 'o'] },
      { word: 'quando', index: 1, letter: 'u', shown: 'qando', options: ['u', 'a', 'e', 'o'] },
      ...c.items().slice(2),
    ]);
    fixture.detectChanges();
  });

  const gaps = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('.split-gap'));

  it('should show the word without the letter, with a gap before, between and after the letters', () => {
    expect(fixture.nativeElement.querySelector('.missing-row').textContent.replace(/\s/g, '')).toBe('prché');
    expect(gaps().length).toBe(6);
  });

  it('should ask for the letter only after the right gap, then score it', () => {
    gaps()[1].click();
    fixture.detectChanges();
    const letters: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.option-btn'));
    letters.find((b) => b.textContent!.trim() === 'e')!.click();
    fixture.detectChanges();
    expect(c.isCorrect()).toBe(true);
    expect(c.score()).toBe(1);
  });

  it('should count a wrong gap as a mistake straight away', () => {
    gaps()[4].click();
    fixture.detectChanges();
    expect(c.answered()).toBe(true);
    expect(fixture.nativeElement.querySelector('.option-btn')).toBeNull();
    expect(c.summary()[0].note).toBe('lettera nel posto sbagliato');
  });
});
