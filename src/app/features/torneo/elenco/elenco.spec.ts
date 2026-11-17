import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Auth } from '../../../core/auth';
import { TorneiDb } from '../tornei-db';
import { ElencoTornei } from './elenco';

describe('ElencoTornei', () => {
  let fixture: ComponentFixture<ElencoTornei>;
  let db: TorneiDb;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [ElencoTornei], providers: [provideRouter([])] });
    (TestBed.inject(Auth) as any).current.set({ idf_user: 7, utente: 'mario' });
    db = TestBed.inject(TorneiDb);
    vi.spyOn(db, 'elenco').mockResolvedValue([
      { idf_torneo: 1, idf_user: 7, nome: 'Coppa', data_creazione: '2026-11-17T10:00:00Z', stato: 'in_corso', piazzamento: null },
      { idf_torneo: 2, idf_user: 7, nome: 'Trofeo', data_creazione: '2026-11-16T10:00:00Z', stato: 'concluso', piazzamento: '🏆 Campioni!' },
    ]);
    vi.spyOn(db, 'elimina').mockResolvedValue();
    fixture = TestBed.createComponent(ElencoTornei);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  function click(selector: string): void {
    (fixture.nativeElement.querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  it('should ask for confirmation and delete only after "Sì"', async () => {
    click('.tournament-list__delete');
    expect(fixture.nativeElement.textContent).toContain('Vuoi eliminare Coppa');
    expect(db.elimina).not.toHaveBeenCalled();

    click('.tournament-list__yes');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(db.elimina).toHaveBeenCalledWith(1);
    expect(fixture.nativeElement.textContent).not.toContain('Coppa');
    expect(fixture.nativeElement.textContent).toContain('Trofeo');
  });

  it('should keep the tournament when the deletion is cancelled', () => {
    click('.tournament-list__delete');
    click('.tournament-list__confirm .speak-btn');
    expect(fixture.nativeElement.querySelector('.tournament-list__confirm')).toBeNull();
    expect(db.elimina).not.toHaveBeenCalled();
  });
});
