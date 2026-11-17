import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Stemma } from '../../../shared/stemma/stemma';
import {
  classifica,
  DatiTorneo,
  delGiocatore,
  giocata,
  Girone,
  nomeTurno,
  PartitaTorneo,
  Squadra,
  squadraGiocatore,
  turnoInCorso,
  TURNO_FINALE,
  TURNO_SEMIFINALI,
  vincitrice,
} from '../regole';
import { TorneiDb } from '../tornei-db';

const GIRONI: Girone[] = ['A', 'B'];

@Component({
  imports: [DatePipe, NgTemplateOutlet, RouterLink, Stemma],
  selector: 'app-tabellone',
  styleUrl: './tabellone.scss',
  templateUrl: './tabellone.html',
})
export class Tabellone implements OnInit {
  // Parametro della rotta /torneo/:id.
  readonly id = input.required<string>();

  private readonly db = inject(TorneiDb);

  protected readonly dati = signal<DatiTorneo | null>(null);
  protected readonly error = signal('');
  protected readonly simulating = signal(false);

  protected readonly giocatore = computed(() => squadraGiocatore(this.dati()!.squadre));
  // Turno da giocare. Se un turno è finito ma la fase dopo non è stata ancora
  // creata (es. connessione caduta), si riprende dall'ultimo turno.
  protected readonly turno = computed(() => {
    const { torneo, partite } = this.dati()!;
    const inCorso = turnoInCorso(partite);
    if (inCorso !== null || torneo.stato === 'concluso') {
      return inCorso;
    }
    return Math.max(...partite.map((partita) => partita.turno));
  });
  protected readonly nomeTurno = computed(() => nomeTurno(this.turno()!));
  // Partita del giocatore ancora da giocare nel turno.
  protected readonly partitaMia = computed(() =>
    this.dati()!.partite.find(
      (partita) => partita.turno === this.turno() && !giocata(partita) && delGiocatore(partita, this.giocatore()),
    ),
  );
  protected readonly gironi = computed(() => {
    const { squadre, partite } = this.dati()!;
    return GIRONI.map((girone) => ({
      girone,
      classifica: classifica(squadre, partite, girone),
      giornate: [1, 2, 3].map((turno) => ({
        nome: nomeTurno(turno),
        partite: partite.filter((partita) => partita.fase === girone && partita.turno === turno),
      })),
    }));
  });
  protected readonly semifinali = computed(() =>
    this.dati()!.partite.filter((partita) => partita.turno === TURNO_SEMIFINALI),
  );
  protected readonly finale = computed(() => this.dati()!.partite.filter((partita) => partita.turno === TURNO_FINALE));

  ngOnInit(): void {
    void this.load();
  }

  protected squadra(idf: number): Squadra {
    return this.dati()!.squadre.find((squadra) => squadra.idf_squadra === idf)!;
  }

  protected avversario(partita: PartitaTorneo): Squadra {
    const giocatore = this.giocatore().idf_squadra;
    return this.squadra(partita.idf_casa === giocatore ? partita.idf_ospite : partita.idf_casa);
  }

  protected giocata(partita: PartitaTorneo): boolean {
    return giocata(partita);
  }

  protected vince(partita: PartitaTorneo, idf: number): boolean {
    return vincitrice(partita) === idf;
  }

  protected async simulate(): Promise<void> {
    const turno = this.turno();
    if (turno === null || this.simulating()) {
      return;
    }
    this.simulating.set(true);
    try {
      await this.db.completaTurno(Number(this.id()), turno);
      await this.load();
    } catch {
      this.error.set('Impossibile collegarsi al server. Riprova più tardi.');
    } finally {
      this.simulating.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      this.dati.set(await this.db.carica(Number(this.id())));
      this.error.set('');
    } catch {
      this.error.set('Impossibile caricare il torneo. Riprova più tardi.');
    }
  }
}
