import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Tts } from '../../shared/tts';
import { PRONOMI_GROUPS } from './frasi';
import { PronomiCombinati } from './pronomi-combinati';

describe('PronomiCombinati', () => {
  let fixture: ComponentFixture<PronomiCombinati>;
  let spoken: string[];

  beforeEach(async () => {
    spoken = [];
    await TestBed.configureTestingModule({
      imports: [PronomiCombinati],
      providers: [provideRouter([]), { provide: Tts, useValue: { supported: true, speak: (t: string) => spoken.push(t), cancel: () => {} } }],
    }).compileComponents();

    fixture = TestBed.createComponent(PronomiCombinati);
    await fixture.whenStable();
  });

  it('should offer the right answer among the options of every sentence', () => {
    for (const group of PRONOMI_GROUPS) {
      // Ogni argomento deve bastare per un round intero.
      expect(group.sentences.length, group.id).toBeGreaterThanOrEqual((fixture.componentInstance as any).total);
      for (const sentence of group.sentences) {
        expect(sentence.options, sentence.before).toContain(sentence.answer);
        expect(new Set(sentence.options).size, sentence.before).toBe(sentence.options.length);
      }
    }
  });

  it('should restart the round on the chosen topic and show its tip after answering', () => {
    const c = fixture.componentInstance as any;
    const button = Array.from(fixture.nativeElement.querySelectorAll('.topic-btn') as NodeListOf<HTMLButtonElement>).find(
      (b) => b.textContent!.trim() === 'tutto attaccato',
    )!;
    button.click();
    fixture.detectChanges();
    expect(c.sentences().length).toBe(c.total);
    expect(c.sentences().every((s: any) => s.options.some((o: string) => o.includes(' ')))).toBe(true);

    c.selectOption(c.current().answer);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('sempre attaccati');
  });

  it('should read the sentence with the pronoun in place', () => {
    const c = fixture.componentInstance as any;
    c.sentences.set([{ before: 'Il cane vuole il biscotto: adesso', after: 'do.', answer: 'glielo', options: ['glielo', "gliel'ho"], tip: '' }]);
    c.speakSentence();
    expect(spoken).toEqual(['Il cane vuole il biscotto: adesso glielo do.']);
  });
});
