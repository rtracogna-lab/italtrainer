import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Auth } from '../../core/auth';
import { GiocoSuperato, Risultati } from '../../core/risultati';
import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;

  async function render(giochi: GiocoSuperato[] | null): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();
    if (giochi) {
      (TestBed.inject(Auth) as any).current.set({ idf_user: 7, utente: 'mario' });
      vi.spyOn(TestBed.inject(Risultati), 'giochiSuperati').mockResolvedValue(giochi);
    }
    fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function card(element: HTMLElement, title: string): HTMLElement {
    return [...element.querySelectorAll<HTMLElement>('.challenge-card')].find((item) =>
      item.textContent!.includes(title),
    )!;
  }

  it('should show no badges without login', async () => {
    const element = await render(null);
    expect(element.querySelector('.challenge-card__badge')).toBeNull();
  });

  it('should mark passed games', async () => {
    const element = await render([
      { idf_gioco: 1, descrizione_gioco: 'Doppie', superato: true },
      { idf_gioco: 2, descrizione_gioco: 'Hanno / Anno', superato: false },
    ]);
    expect(card(element, 'Doppie').textContent).toContain('Superato');
    expect(card(element, 'Hanno / Anno').textContent).not.toContain('Superato');
    expect(card(element, 'Torneo').querySelector('.challenge-card__badge')).toBeNull();
  });

  it('should leave the hidden games and the dictation out of the choice', async () => {
    const element = await render(null);
    const titles = Array.from(element.querySelectorAll('.challenge-card__title')).map((t) => t.textContent!.trim());
    for (const hidden of ['Dettato', 'Parole Unite', 'Spezza le Parole', 'Qui Quo Qua', 'Lettera mancante']) {
      expect(titles).not.toContain(hidden);
    }
    expect(titles).toContain('Doppie');
  });

  it('should open the login window on first load when logged out', async () => {
    const element = await render(null);
    const dialog = element.querySelector('dialog.login-dialog') as HTMLDialogElement;
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.querySelector('input[name="utente"]')).toBeTruthy();

    (dialog.querySelector('.login-dialog__skip') as HTMLButtonElement).click();
    expect(dialog.hasAttribute('open')).toBe(false);

    // Tornando alla home non si riapre.
    const again = TestBed.createComponent(Home);
    await again.whenStable();
    expect(again.nativeElement.querySelector('dialog').hasAttribute('open')).toBe(false);
  });

  it('should not open the login window when already logged in', async () => {
    const element = await render([{ idf_gioco: 1, descrizione_gioco: 'Doppie', superato: true }]);
    expect(element.querySelector('dialog.login-dialog')!.hasAttribute('open')).toBe(false);
  });

  it('should close the window and load the games after logging in', async () => {
    const element = await render(null);
    const auth = TestBed.inject(Auth);
    vi.spyOn(auth, 'login').mockImplementation(async () => {
      (auth as any).current.set({ idf_user: 7, utente: 'mario' });
      return true;
    });
    const giochi = vi
      .spyOn(TestBed.inject(Risultati), 'giochiSuperati')
      .mockResolvedValue([{ idf_gioco: 1, descrizione_gioco: 'Doppie', superato: true }]);
    const dialog = element.querySelector('dialog.login-dialog') as HTMLDialogElement;
    const [utente, pwd] = Array.from(dialog.querySelectorAll('input')) as HTMLInputElement[];
    utente.value = 'mario';
    utente.dispatchEvent(new Event('input'));
    pwd.value = 'segreta';
    pwd.dispatchEvent(new Event('input'));
    (dialog.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(giochi).toHaveBeenCalledWith(7);
    expect(card(element, 'Doppie').textContent).toContain('Superato');
  });
});
