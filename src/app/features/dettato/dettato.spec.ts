import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Tts } from '../../shared/tts';
import { Dettato } from './dettato';
import { DETTATI, paragraphs, plainText, splitIntoChunks } from './dettati';

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

  it('should honour manual " / " breaks and hide them from the text', () => {
    const text = 'L’arbitro fischia / se c’è un fallo.';
    expect(splitIntoChunks(text).map((chunk) => chunk.text)).toEqual(['L’arbitro fischia', 'se c’è un fallo.']);
    expect(plainText(text)).toBe('L’arbitro fischia se c’è un fallo.');
  });

  it('should say "a capo" at " // " and start a new line there', () => {
    const text = 'Il calcio è bello. // La partita è lunga / e faticosa //';
    expect(splitIntoChunks(text).map((chunk) => chunk.spoken.at(-1))).toEqual(['punto e a capo', 'lunga', 'a capo']);
    expect(paragraphs(text)).toEqual(['Il calcio è bello.', 'La partita è lunga e faticosa']);
    expect(plainText(text)).toBe('Il calcio è bello. La partita è lunga e faticosa');
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

  it('should read the whole text twice, with a pause in between', async () => {
    const { title, text } = DETTATI[1];
    click(title);
    await vi.advanceTimersByTimeAsync(1000);
    expect(spoken).toEqual([text]);

    await vi.advanceTimersByTimeAsync(1000);
    fixture.detectChanges();
    expect(spoken).toEqual([text, text]);
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

    // ...poi, dopo 2 secondi, una parola alla volta (un secondo tra le parole).
    await vi.advanceTimersByTimeAsync(1999);
    expect(spoken.length).toBe(1);
    await vi.advanceTimersByTimeAsync(3001);
    expect(spoken).toEqual(['Oggi vado al parco', 'Oggi', 'vado', 'al', 'parco']);

    // ...e altre due volte lentamente (livello base: tre ripetizioni lente).
    await vi.advanceTimersByTimeAsync(5000);
    expect(spoken.slice(5)).toEqual(['Oggi', 'vado', 'al', 'parco']);
    await vi.advanceTimersByTimeAsync(4999);
    expect(spoken.slice(9)).toEqual(['Oggi', 'vado', 'al']);

    // Finita l'ultima ripetizione, il gruppo seguente parte subito.
    await vi.advanceTimersByTimeAsync(1);
    expect(spoken.slice(12)).toEqual(['parco', 'con la nonna punto']);

    click('Pausa');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(spoken.length).toBe(14);

    click('Ripeti');
    await vi.advanceTimersByTimeAsync(0);
    expect(spoken.slice(14)).toEqual(['con la nonna punto']);

    // "Prossimo" salta subito al gruppo seguente...
    click('Prossimo');
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    expect(spoken.at(-1)).toBe('Io gioco sull\'altalena');
    expect(fixture.nativeElement.textContent).toContain('Parte 3 di');

    // ...e "Precedente" torna indietro di uno.
    click('Precedente');
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

  it('should repeat each chunk only once in advanced dictations, then wait 3 seconds', async () => {
    const advanced = DETTATI.find((dettato) => dettato.level === 'avanzato')!;
    click(advanced.title);
    await vi.advanceTimersByTimeAsync(60_000);
    spoken = [];

    click('Dettatura');
    await vi.advanceTimersByTimeAsync(4000);
    expect(spoken).toEqual(['I videogiochi sono', 'I', 'videogiochi', 'sono']);

    await vi.advanceTimersByTimeAsync(2999);
    expect(spoken.length).toBe(4);
    await vi.advanceTimersByTimeAsync(1);
    expect(spoken.at(-1)).toBe('molto divertenti punto');
  });
});
