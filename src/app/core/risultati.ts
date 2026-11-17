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
}
