import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatchResult, Opponent, Partita } from '../../partita/partita';
import {
  DatiTorneo,
  eliminazioneDiretta,
  giocata,
  nomeTurno,
  Risultato,
  squadraGiocatore,
} from '../regole';
import { PenaltyResult, Rigori } from '../rigori/rigori';
import { TorneiDb } from '../tornei-db';

// Una partita del giocatore nel torneo: si gioca con La partita, ai rigori se
// finisce pari a eliminazione diretta, poi si salva e si simula il resto del turno.
@Component({
  imports: [NgTemplateOutlet, Partita, Rigori, RouterLink],
  selector: 'app-partita-torneo',
  styleUrl: './partita-torneo.scss',
  templateUrl: './partita-torneo.html',
})
export class PartitaTorneo implements OnInit {
  // Parametri della rotta /torneo/:id/partita/:idPartita.
  readonly id = input.required<string>();
  readonly idPartita = input.required<string>();

  private readonly db = inject(TorneiDb);

  protected readonly dati = signal<DatiTorneo | null>(null);
  protected readonly loadError = signal(false);
  protected readonly phase = signal<'partita' | 'rigori'>('partita');
  protected readonly saveState = signal<'idle' | 'pareggio' | 'saving' | 'saved' | 'error'>('idle');
  private readonly result = signal<MatchResult | null>(null);
  private readonly penalties = signal<PenaltyResult | null>(null);

  protected readonly partita = computed(() =>
    this.dati()?.partite.find((partita) => partita.idf_partita === Number(this.idPartita())),
  );
  protected readonly giocatore = computed(() => squadraGiocatore(this.dati()!.squadre));
  protected readonly rival = computed<Opponent>(() => {
    const partita = this.partita()!;
    const idf = partita.idf_casa === this.giocatore().idf_squadra ? partita.idf_ospite : partita.idf_casa;
    const squadra = this.dati()!.squadre.find((item) => item.idf_squadra === idf)!;
    return { name: squadra.nome, badge: squadra.stemma };
  });
  protected readonly nomeTurno = computed(() => nomeTurno(this.partita()!.turno));
  protected readonly giaGiocata = computed(() => giocata(this.partita()!) && this.saveState() === 'idle');

  async ngOnInit(): Promise<void> {
    try {
      this.dati.set(await this.db.carica(Number(this.id())));
    } catch {
      this.loadError.set(true);
    }
  }

  protected onMatchEnded(result: MatchResult): void {
    this.result.set(result);
    if (eliminazioneDiretta(this.partita()!.fase) && result.goalsFor === result.goalsAgainst) {
      this.saveState.set('pareggio');
      return;
    }
    void this.save();
  }

  protected startPenalties(): void {
    this.saveState.set('idle');
    this.phase.set('rigori');
  }

  protected onPenalties(result: PenaltyResult): void {
    this.penalties.set(result);
    void this.save();
  }

  // Salva il risultato dal punto di vista del tabellone (casa/ospite) e fa
  // giocare le altre partite del turno.
  protected async save(): Promise<void> {
    const partita = this.partita()!;
    const { goalsFor, goalsAgainst } = this.result()!;
    const penalties = this.penalties();
    const inCasa = partita.idf_casa === this.giocatore().idf_squadra;
    const risultato: Risultato = {
      gol_casa: inCasa ? goalsFor : goalsAgainst,
      gol_ospite: inCasa ? goalsAgainst : goalsFor,
      rigori_casa: penalties && (inCasa ? penalties.scoredFor : penalties.scoredAgainst),
      rigori_ospite: penalties && (inCasa ? penalties.scoredAgainst : penalties.scoredFor),
    };
    this.saveState.set('saving');
    try {
      await this.db.salvaRisultato(partita.idf_partita, risultato);
      await this.db.completaTurno(Number(this.id()), partita.turno);
      this.saveState.set('saved');
    } catch {
      this.saveState.set('error');
    }
  }
}
