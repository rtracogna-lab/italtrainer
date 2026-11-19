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

  it('should mark passed games and lock the tournament', async () => {
    const element = await render([
      { idf_gioco: 1, descrizione_gioco: 'Doppie', superato: true },
      { idf_gioco: 2, descrizione_gioco: 'Hanno / Anno', superato: false },
    ]);
    expect(card(element, 'Doppie').textContent).toContain('Superato');
    expect(card(element, 'Hanno / Anno').textContent).not.toContain('Superato');
    const torneo = card(element, 'Torneo');
    expect(torneo.classList).toContain('challenge-card--locked');
    expect(torneo.textContent).toContain('1/2 giochi');
  });

  it('should unlock the tournament when every game is passed', async () => {
    const element = await render([
      { idf_gioco: 1, descrizione_gioco: 'Doppie', superato: true },
      { idf_gioco: 2, descrizione_gioco: 'Hanno / Anno', superato: true },
    ]);
    const torneo = card(element, 'Torneo');
    expect(torneo.classList).not.toContain('challenge-card--locked');
    expect(torneo.textContent).toContain('Sbloccato');
  });
});
