import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase';
import {
  calendarioGirone,
  DatiTorneo,
  delGiocatore,
  generaAvversari,
  giocata,
  NuovaPartita,
  NuovaSquadra,
  PartitaTorneo,
  partiteSuccessive,
  piazzamento,
  Risultato,
  simulaPartita,
  sorteggiaGironi,
  Squadra,
  squadraGiocatore,
  Torneo,
  TURNO_FINALE,
} from './regole';

export const STEMMA_GIOCATORE = '🔵';

function check<T>({ data, error }: { data: T | null; error: unknown }): T {
  if (error) {
    throw error;
  }
  return data as T;
}

@Injectable({ providedIn: 'root' })
export class TorneiDb {
  async elenco(idfUser: number): Promise<Torneo[]> {
    return check(
      await supabase.from('tornei').select('*').eq('idf_user', idfUser).order('data_creazione', { ascending: false }),
    );
  }

  async carica(idfTorneo: number): Promise<DatiTorneo> {
    const [torneo, squadre, partite] = await Promise.all([
      supabase.from('tornei').select('*').eq('idf_torneo', idfTorneo).single(),
      supabase.from('tornei_squadre').select('*').eq('idf_torneo', idfTorneo),
      supabase.from('tornei_partite').select('*').eq('idf_torneo', idfTorneo).order('idf_partita'),
    ]);
    return {
      torneo: check<Torneo>(torneo),
      squadre: check<Squadra[]>(squadre),
      partite: check<PartitaTorneo[]>(partite),
    };
  }

  // Crea il torneo con le squadre sorteggiate nei gironi e il calendario delle
  // tre giornate. Restituisce l'id del nuovo torneo.
  async crea(idfUser: number, nome: string, nomeSquadra: string): Promise<number> {
    const torneo = check<Torneo>(await supabase.from('tornei').insert({ idf_user: idfUser, nome }).select().single());
    const partecipanti: (NuovaSquadra & { giocatore: boolean })[] = [
      { nome: nomeSquadra, stemma: STEMMA_GIOCATORE, giocatore: true },
      ...generaAvversari(7).map((squadra) => ({ ...squadra, giocatore: false })),
    ];
    const squadre = check<Squadra[]>(
      await supabase
        .from('tornei_squadre')
        .insert(
          sorteggiaGironi(partecipanti).map(({ squadra, girone }) => ({ ...squadra, girone, idf_torneo: torneo.idf_torneo })),
        )
        .select(),
    );
    const ids = (girone: 'A' | 'B') =>
      squadre.filter((squadra) => squadra.girone === girone).map((squadra) => squadra.idf_squadra);
    await this.aggiungiPartite(torneo.idf_torneo, [...calendarioGirone('A', ids('A')), ...calendarioGirone('B', ids('B'))]);
    return torneo.idf_torneo;
  }

  // Squadre e partite se ne vanno con il torneo (on delete cascade).
  async elimina(idfTorneo: number): Promise<void> {
    check(await supabase.from('tornei').delete().eq('idf_torneo', idfTorneo));
  }

  async salvaRisultato(idfPartita: number, risultato: Risultato): Promise<void> {
    check(
      await supabase
        .from('tornei_partite')
        .update({ ...risultato, data_ora: new Date().toISOString() })
        .eq('idf_partita', idfPartita),
    );
  }

  // Simula le partite del turno che non sono del giocatore; se il turno è
  // finito crea quelle della fase dopo, oppure chiude il torneo.
  async completaTurno(idfTorneo: number, turno: number): Promise<void> {
    let dati = await this.carica(idfTorneo);
    const giocatore = squadraGiocatore(dati.squadre);
    const daSimulare = dati.partite.filter(
      (partita) => partita.turno === turno && !giocata(partita) && !delGiocatore(partita, giocatore),
    );
    await Promise.all(daSimulare.map((partita) => this.salvaRisultato(partita.idf_partita, simulaPartita(partita.fase))));
    dati = await this.carica(idfTorneo);
    if (dati.partite.some((partita) => partita.turno === turno && !giocata(partita))) {
      return;
    }
    if (turno === TURNO_FINALE) {
      check(
        await supabase
          .from('tornei')
          .update({ stato: 'concluso', piazzamento: piazzamento(dati.squadre, dati.partite) })
          .eq('idf_torneo', idfTorneo),
      );
      return;
    }
    // Le giornate dei gironi esistono già: si creano solo semifinali e finale.
    if (!dati.partite.some((partita) => partita.turno === turno + 1)) {
      await this.aggiungiPartite(idfTorneo, partiteSuccessive(dati.squadre, dati.partite, turno));
    }
  }

  private async aggiungiPartite(idfTorneo: number, partite: NuovaPartita[]): Promise<void> {
    if (partite.length > 0) {
      check(await supabase.from('tornei_partite').insert(partite.map((partita) => ({ ...partita, idf_torneo: idfTorneo }))));
    }
  }
}
