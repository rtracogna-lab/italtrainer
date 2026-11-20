import { Injectable } from '@angular/core';
import { supabase } from './supabase';

// Identificativi della tabella giochi (supabase/giochi.sql).
export const GIOCO_DOPPIE = 1;
export const GIOCO_HANNO_ANNO = 2;
export const GIOCO_GIUSTO_SBAGLIATO = 3;
export const GIOCO_PAROLE_UNITE = 4;
export const GIOCO_SPEZZA_PAROLE = 5;
export const GIOCO_RICOSTRUISCI_FRASE = 6;
export const GIOCO_QUI_QUO_QUA = 7;
export const GIOCO_CE_CIE = 8;
export const GIOCO_LETTERA_MANCANTE = 9;
export const GIOCO_SILLABE = 10;
export const GIOCO_PRONOMI_COMBINATI = 11;

// Pagina di ogni gioco, per mandare il bambino a quelli non ancora superati.
export const PERCORSO_GIOCO: Record<number, string> = {
  [GIOCO_DOPPIE]: '/doppie',
  [GIOCO_HANNO_ANNO]: '/hanno-anno',
  [GIOCO_GIUSTO_SBAGLIATO]: '/giusto-sbagliato',
  [GIOCO_PAROLE_UNITE]: '/parole-unite',
  [GIOCO_SPEZZA_PAROLE]: '/spezza-parole',
  [GIOCO_RICOSTRUISCI_FRASE]: '/ricostruisci-frase',
  [GIOCO_QUI_QUO_QUA]: '/qui-quo-qua',
  [GIOCO_CE_CIE]: '/ce-cie',
  [GIOCO_LETTERA_MANCANTE]: '/lettera-mancante',
  [GIOCO_SILLABE]: '/sillabe',
  [GIOCO_PRONOMI_COMBINATI]: '/pronomi-combinati',
};

// Un gioco è superato quando l'utente ha fatto almeno una volta un punteggio
// pari o superiore alla soglia del gioco (supabase/superati.sql).
export interface GiocoSuperato {
  idf_gioco: number;
  descrizione_gioco: string;
  superato: boolean;
}

export interface Risultato {
  utente: string;
  risultato: number;
  data_ora: string;
}

export interface Classifica {
  // I migliori risultati di tutti gli utenti.
  migliori: Risultato[];
  // Posizione che avrebbe il nuovo punteggio tra tutti i risultati salvati.
  posizione: number;
}

@Injectable({ providedIn: 'root' })
export class Risultati {
  async classifica(idfGioco: number, punti: number): Promise<Classifica> {
    const [migliori, posizione] = await Promise.all([
      supabase.rpc('migliori_risultati', { p_idf_gioco: idfGioco }),
      supabase.rpc('posizione_risultato', { p_idf_gioco: idfGioco, p_risultato: punti }),
    ]);
    if (migliori.error) {
      throw migliori.error;
    }
    if (posizione.error) {
      throw posizione.error;
    }
    return { migliori: migliori.data as Risultato[], posizione: posizione.data as number };
  }

  // Niente .select() dopo l'insert: la tabella non è leggibile con la chiave anon.
  async salva(idfUser: number, idfGioco: number, punti: number): Promise<void> {
    const { error } = await supabase.from('risultati').insert({ idf_user: idfUser, idf_gioco: idfGioco, risultato: punti });
    if (error) {
      throw error;
    }
  }

  async giochiSuperati(idfUser: number): Promise<GiocoSuperato[]> {
    const { data, error } = await supabase.rpc('giochi_superati', { p_idf_user: idfUser });
    if (error) {
      throw error;
    }
    return data as GiocoSuperato[];
  }
}
