import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Tts } from '../../shared/tts';
import { Dettato } from './dettato';
import { DETTATI, splitIntoChunks } from './dettati';

describe('splitIntoChunks', () => {
  it('should split on punctuation and never right after an article or preposition', () => {
    expect(splitIntoChunks(DETTATI[0].text).map((chunk) => chunk.text)).toEqual([
      'Il gatto di Luca',
      'si chiama Fufi.',
      'Ogni mattina beve',
      'il latte dalla sua ciotola.',
      'Poi dorme al sole',
      'sul divano.',
    ]);
  });

  it('should say punctuation out loud', () => {
    const [first, second] = splitIntoChunks('Ciao, come stai?');
    expect(first.spoken).toEqual(['Ciao', 'virgola']);
    expect(second.spoken).toEqual(['come', 'stai', 'punto interrogativo']);
  });
});

describe('Dettato', () => {
  let fixture: ComponentFixture<Dettato>;
  let spoken: string[];

  beforeEach(async () => {
    vi.useFakeTimers();
    spoken = [];
    await TestBed.configureTestingModule({
      imports: [Dettato],
      providers: [
        provideRouter([]),
        {
          provide: Tts,
          useValue: {
            supported: true,
            speak: (text: string) => {
              spoken.push(text);
              return Promise.resolve();
            },
            cancel: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dettato);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  const el = (selector: string) => fixture.nativeElement.querySelector(selector);
  const buttons = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('button'));
  const click = (label: string) => buttons().find((button) => button.textContent!.includes(label))!.click();

  it('should read the text twice, the second time word by word', async () => {
    const { title, text } = DETTATI[1];
    click(title);
    await vi.advanceTimersByTimeAsync(1000);
    // Prima lettura a velocità normale, tutta di fila.
    expect(spoken).toEqual([text]);

    await vi.advanceTimersByTimeAsync(2600);
    // Seconda lettura lenta: una parola, mezzo secondo di pausa, la successiva...
    expect(spoken).toEqual([text, 'Oggi', 'vado', 'al', 'parco']);

    await vi.advanceTimersByTimeAsync(60_000);
    fixture.detectChanges();
    expect(spoken.slice(1)).toEqual(text.split(' '));
    expect(el('.dettato__text').textContent).toContain('nonna');
  });

  it('should dictate word by word, repeat each chunk, and support pause, repeat and restart', async () => {
    click(DETTATI[1].title);
    await vi.advanceTimersByTimeAsync(60_000);
    spoken = [];

    click('Dettatura');
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    expect(el('.dettato__text')).toBeNull();
    // Prima il gruppo letto di fila...
    expect(spoken).toEqual(['Oggi vado al parco']);

    // ...poi, dopo una breve pausa, una parola alla volta.
    await vi.advanceTimersByTimeAsync(4000);
    expect(spoken).toEqual(['Oggi vado al parco', 'Oggi', 'vado', 'al', 'parco']);

    // ...e una seconda volta lentamente.
    await vi.advanceTimersByTimeAsync(4000);
    expect(spoken.slice(5)).toEqual(['Oggi', 'vado', 'al', 'parco']);

    click('Pausa');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(spoken.length).toBe(9);

    click('Ripeti');
    await vi.advanceTimersByTimeAsync(0);
    expect(spoken.slice(9)).toEqual(['Oggi vado al parco']);

    // "Prossimo" salta subito al gruppo seguente.
    click('Prossimo');
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    expect(spoken.at(-1)).toBe('con la nonna punto');
    expect(fixture.nativeElement.textContent).toContain('Parte 2 di');

    click('Ricomincia');
    await vi.advanceTimersByTimeAsync(600_000);
    fixture.detectChanges();
    expect(spoken.slice(-4)).toEqual(['corre', 'sul', 'prato', 'punto']);
    expect(el('.dettato__text').textContent).toContain('nonna');
  });
});
