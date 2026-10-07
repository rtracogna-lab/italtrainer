import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Tts } from '../../shared/tts';
import { HannoAnno } from './hanno-anno';

describe('HannoAnno', () => {
  let component: HannoAnno;
  let fixture: ComponentFixture<HannoAnno>;
  let spoken: string[];

  beforeEach(async () => {
    spoken = [];
    await TestBed.configureTestingModule({
      imports: [HannoAnno],
      providers: [provideRouter([]), { provide: Tts, useValue: { supported: true, speak: (t: string) => spoken.push(t), cancel: () => {} } }],
    }).compileComponents();

    fixture = TestBed.createComponent(HannoAnno);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read the sentence with the right word in place', () => {
    const c = component as any;
    c.sentences.set([{ before: 'Vuoi il gelato', after: 'la torta?', answer: 'o', options: ['ho', 'o'] }]);
    fixture.detectChanges();
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    expect(buttons.map((b) => b.textContent!.trim())).toEqual(['🔊 Ascolta', 'ho', 'o']);

    buttons[0].click();
    expect(spoken).toEqual(['Vuoi il gelato o la torta?']);
  });

  it('should join an apostrophe with the word that follows', () => {
    const c = component as any;
    c.sentences.set([{ before: "Quest'", after: 'andrò in terza.', answer: 'anno', options: ['hanno', 'anno'] }]);
    c.speakSentence();
    expect(spoken).toEqual(["Quest'anno andrò in terza."]);
  });

  it('should show a recap of every sentence at the end of the round', () => {
    const c = component as any;
    for (let i = 0; i < c.total; i++) {
      const { answer, options } = c.current();
      c.selectOption(i === 0 ? options.find((o: string) => o !== answer) : answer);
      c.next();
    }
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.summary__item');
    expect(items.length).toBe(c.total);
    expect(items[0].querySelector('.summary__letters--wrong')).toBeTruthy();
    expect(items[0].querySelector('.summary__given')).toBeTruthy();
    expect(items[1].querySelector('.summary__letters--correct')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.dictation-start')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Ricomincia');
  });
});
