import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '../../core/auth';
import { Risultati } from '../../core/risultati';
import { Leaderboard } from './leaderboard';

describe('Leaderboard', () => {
  let fixture: ComponentFixture<Leaderboard>;
  let saved: unknown[];

  beforeEach(() => {
    saved = [];
    TestBed.configureTestingModule({ imports: [Leaderboard] });
    const risultati = TestBed.inject(Risultati);
    vi.spyOn(risultati, 'classifica').mockResolvedValue({
      migliori: [
        { utente: 'mario', risultato: 1400, data_ora: '2026-11-01T10:00:00Z' },
        { utente: 'mario', risultato: 900, data_ora: '2026-11-02T10:00:00Z' },
      ],
      posizione: 2,
    });
    vi.spyOn(risultati, 'salva').mockImplementation(async (...args) => void saved.push(args));
  });

  function create(): Leaderboard {
    fixture = TestBed.createComponent(Leaderboard);
    fixture.componentRef.setInput('game', 8);
    fixture.componentRef.setInput('points', 1350);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('should stay hidden without a logged-in user', async () => {
    create();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
    expect(TestBed.inject(Risultati).classifica).not.toHaveBeenCalled();
  });

  it('should place the new score among the best results of the user and save it', async () => {
    (TestBed.inject(Auth) as any).current.set({ idf_user: 7, utente: 'mario' });
    const c = create() as any;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(c.rows().map((row: any) => [row.position, row.user, row.points, row.isNew])).toEqual([
      [1, 'mario', 1400, false],
      [2, 'mario', 1350, true],
      [3, 'mario', 900, false],
    ]);
    expect(TestBed.inject(Risultati).classifica).toHaveBeenCalledWith(8, 7, 1350);
    expect(fixture.nativeElement.textContent).toContain('2° miglior risultato');

    fixture.nativeElement.querySelector('.next-btn').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(saved).toEqual([[7, 8, 1350]]);
    expect(fixture.nativeElement.textContent).toContain('Risultato salvato');
  });
});
