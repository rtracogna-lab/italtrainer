import { shuffle } from '../../shared/shuffle';

// Regole del torneo: 8 squadre in due gironi da 4 (andata sola), le prime
// due di ogni girone in semifinale (1ª A - 2ª B, 1ª B - 2ª A), poi la finale.
// Turni 1-3: giornate dei gironi; 4: semifinali; 5: finale.

export type Fase = 'A' | 'B' | 'SF' | 'F';
export type Girone = 'A' | 'B';

export const TURNO_SEMIFINALI = 4;
export const TURNO_FINALE = 5;

export interface Torneo {
  idf_torneo: number;
  idf_user: number;
  nome: string;
  data_creazione: string;
  stato: 'in_corso' | 'concluso';
  piazzamento: string | null;
}

export interface Squadra {
  idf_squadra: number;
  nome: string;
  stemma: string;
  girone: Girone;
  giocatore: boolean;
}

export interface PartitaTorneo {
  idf_partita: number;
  fase: Fase;
  turno: number;
  idf_casa: number;
  idf_ospite: number;
  gol_casa: number | null;
  gol_ospite: number | null;
  rigori_casa: number | null;
  rigori_ospite: number | null;
  data_ora: string | null;
}

export interface DatiTorneo {
  torneo: Torneo;
  squadre: Squadra[];
  partite: PartitaTorneo[];
}

export interface NuovaSquadra {
  nome: string;
  stemma: string;
}

export interface NuovaPartita {
  fase: Fase;
  turno: number;
  idf_casa: number;
  idf_ospite: number;
}

export interface Risultato {
  gol_casa: number;
  gol_ospite: number;
  rigori_casa: number | null;
  rigori_ospite: number | null;
}

export interface RigaClassifica {
  squadra: Squadra;
  giocate: number;
  vinte: number;
  pari: number;
  perse: number;
  golFatti: number;
  golSubiti: number;
  punti: number;
}

// Nomi degli avversari: un animale e un aggettivo che va bene sia al maschile
// che al femminile ("Leoni Veloci", "Aquile Veloci").
const ANIMALI: NuovaSquadra[] = [
  { nome: 'Leoni', stemma: '🦁' },
  { nome: 'Aquile', stemma: '🦅' },
  { nome: 'Lupi', stemma: '🐺' },
  { nome: 'Squali', stemma: '🦈' },
  { nome: 'Tigri', stemma: '🐯' },
  { nome: 'Draghi', stemma: '🐲' },
  { nome: 'Orsi', stemma: '🐻' },
  { nome: 'Volpi', stemma: '🦊' },
  { nome: 'Gufi', stemma: '🦉' },
  { nome: 'Pantere', stemma: '🐆' },
  { nome: 'Delfini', stemma: '🐬' },
  { nome: 'Rinoceronti', stemma: '🦏' },
  { nome: 'Scorpioni', stemma: '🦂' },
  { nome: 'Gorilla', stemma: '🦍' },
  { nome: 'Pinguini', stemma: '🐧' },
  { nome: 'Canguri', stemma: '🦘' },
];

const AGGETTIVI = [
  'Ruggenti',
  'Volanti',
  'Veloci',
  'Feroci',
  'Lucenti',
  'Fulminanti',
  'Verdi',
  'Blu',
  'Viola',
  'Arancioni',
  'Celesti',
  'Giganti',
  'Invincibili',
  'Imprendibili',
];

// Probabilità dei gol di una squadra in una partita simulata: 0, 1, 2, 3, 4.
const PESI_GOL = [0.25, 0.35, 0.25, 0.1, 0.05];
export const RIGORE_SEGNATO = 0.75;
export const RIGORI_PER_SQUADRA = 5;

export function generaAvversari(quante: number): NuovaSquadra[] {
  const aggettivi = shuffle(AGGETTIVI);
  return shuffle(ANIMALI)
    .slice(0, quante)
    .map((animale, index) => ({ nome: `${animale.nome} ${aggettivi[index % aggettivi.length]}`, stemma: animale.stemma }));
}

// Sorteggio dei gironi: le 8 squadre mescolate, le prime 4 nel girone A.
export function sorteggiaGironi<T>(squadre: T[]): { squadra: T; girone: Girone }[] {
  return shuffle(squadre).map((squadra, index) => ({ squadra, girone: index < squadre.length / 2 ? 'A' : 'B' }));
}

// Girone all'italiana di 4 squadre: 3 giornate da 2 partite, tutti contro tutti.
export function calendarioGirone(girone: Girone, [a, b, c, d]: number[]): NuovaPartita[] {
  const giornate = [
    [a, b, c, d],
    [a, c, d, b],
    [d, a, b, c],
  ];
  return giornate.flatMap(([casa1, ospite1, casa2, ospite2], index) => [
    { fase: girone, turno: index + 1, idf_casa: casa1, idf_ospite: ospite1 },
    { fase: girone, turno: index + 1, idf_casa: casa2, idf_ospite: ospite2 },
  ]);
}

export function giocata(partita: PartitaTorneo): boolean {
  return partita.gol_casa !== null && partita.gol_ospite !== null;
}

export function eliminazioneDiretta(fase: Fase): boolean {
  return fase === 'SF' || fase === 'F';
}

// Vincitrice di una partita giocata; null per un pareggio nei gironi.
export function vincitrice(partita: PartitaTorneo): number | null {
  if (!giocata(partita)) {
    return null;
  }
  const casa = partita.gol_casa! * 100 + (partita.rigori_casa ?? 0);
  const ospite = partita.gol_ospite! * 100 + (partita.rigori_ospite ?? 0);
  if (casa === ospite) {
    return null;
  }
  return casa > ospite ? partita.idf_casa : partita.idf_ospite;
}

export function classifica(squadre: Squadra[], partite: PartitaTorneo[], girone: Girone): RigaClassifica[] {
  const righe = new Map<number, RigaClassifica>(
    squadre
      .filter((squadra) => squadra.girone === girone)
      .map((squadra) => [
        squadra.idf_squadra,
        { squadra, giocate: 0, vinte: 0, pari: 0, perse: 0, golFatti: 0, golSubiti: 0, punti: 0 },
      ]),
  );
  for (const partita of partite.filter((item) => item.fase === girone && giocata(item))) {
    const casa = righe.get(partita.idf_casa)!;
    const ospite = righe.get(partita.idf_ospite)!;
    aggiungi(casa, partita.gol_casa!, partita.gol_ospite!);
    aggiungi(ospite, partita.gol_ospite!, partita.gol_casa!);
  }
  // A parità di punti: differenza reti, poi gol fatti, poi nome.
  return [...righe.values()].sort(
    (x, y) =>
      y.punti - x.punti ||
      y.golFatti - y.golSubiti - (x.golFatti - x.golSubiti) ||
      y.golFatti - x.golFatti ||
      x.squadra.nome.localeCompare(y.squadra.nome),
  );
}

function aggiungi(riga: RigaClassifica, fatti: number, subiti: number): void {
  riga.giocate++;
  riga.golFatti += fatti;
  riga.golSubiti += subiti;
  if (fatti > subiti) {
    riga.vinte++;
    riga.punti += 3;
  } else if (fatti === subiti) {
    riga.pari++;
    riga.punti += 1;
  } else {
    riga.perse++;
  }
}

// Primo turno con partite ancora da giocare; null a torneo finito.
export function turnoInCorso(partite: PartitaTorneo[]): number | null {
  const turni = partite.filter((partita) => !giocata(partita)).map((partita) => partita.turno);
  return turni.length > 0 ? Math.min(...turni) : null;
}

export function nomeTurno(turno: number): string {
  if (turno === TURNO_SEMIFINALI) {
    return 'Semifinali';
  }
  if (turno === TURNO_FINALE) {
    return 'Finale';
  }
  return `${turno}ª giornata`;
}

export function squadraGiocatore(squadre: Squadra[]): Squadra {
  return squadre.find((squadra) => squadra.giocatore)!;
}

export function delGiocatore(partita: PartitaTorneo, giocatore: Squadra): boolean {
  return partita.idf_casa === giocatore.idf_squadra || partita.idf_ospite === giocatore.idf_squadra;
}

// Le partite da creare quando un turno è finito: le semifinali dopo i gironi,
// la finale dopo le semifinali.
export function partiteSuccessive(squadre: Squadra[], partite: PartitaTorneo[], turno: number): NuovaPartita[] {
  if (turno === TURNO_SEMIFINALI - 1) {
    const [primaA, secondaA] = classifica(squadre, partite, 'A');
    const [primaB, secondaB] = classifica(squadre, partite, 'B');
    return [
      { fase: 'SF', turno: TURNO_SEMIFINALI, idf_casa: primaA.squadra.idf_squadra, idf_ospite: secondaB.squadra.idf_squadra },
      { fase: 'SF', turno: TURNO_SEMIFINALI, idf_casa: primaB.squadra.idf_squadra, idf_ospite: secondaA.squadra.idf_squadra },
    ];
  }
  if (turno === TURNO_SEMIFINALI) {
    const [prima, seconda] = partite
      .filter((partita) => partita.fase === 'SF')
      .sort((x, y) => x.idf_partita - y.idf_partita)
      .map((partita) => vincitrice(partita)!);
    return [{ fase: 'F', turno: TURNO_FINALE, idf_casa: prima, idf_ospite: seconda }];
  }
  return [];
}

// Come è finito il torneo per la squadra del giocatore.
export function piazzamento(squadre: Squadra[], partite: PartitaTorneo[]): string {
  const giocatore = squadraGiocatore(squadre);
  const finale = partite.find((partita) => partita.fase === 'F');
  if (finale && delGiocatore(finale, giocatore)) {
    return vincitrice(finale) === giocatore.idf_squadra ? '🏆 Campioni!' : '🥈 Finalisti';
  }
  if (partite.some((partita) => partita.fase === 'SF' && delGiocatore(partita, giocatore))) {
    return '🥉 Semifinalisti';
  }
  const posto = classifica(squadre, partite, giocatore.girone).findIndex(
    (riga) => riga.squadra.idf_squadra === giocatore.idf_squadra,
  );
  return `${posto + 1}° nel girone ${giocatore.girone}`;
}

export function simulaGol(random = Math.random): number {
  let soglia = random();
  for (let gol = 0; gol < PESI_GOL.length; gol++) {
    soglia -= PESI_GOL[gol];
    if (soglia < 0) {
      return gol;
    }
  }
  return PESI_GOL.length - 1;
}

// Rigori: tirano a turno, prima "noi". Dopo i primi 5 a testa si va a
// oltranza, una coppia di tiri alla volta. null finché non è deciso.
export function esitoRigori(noi: boolean[], loro: boolean[]): 'noi' | 'loro' | null {
  const golNoi = noi.filter(Boolean).length;
  const golLoro = loro.filter(Boolean).length;
  if (noi.length <= RIGORI_PER_SQUADRA && loro.length <= RIGORI_PER_SQUADRA) {
    if (golNoi + (RIGORI_PER_SQUADRA - noi.length) < golLoro) {
      return 'loro';
    }
    if (golLoro + (RIGORI_PER_SQUADRA - loro.length) < golNoi) {
      return 'noi';
    }
    return null;
  }
  if (noi.length === loro.length && golNoi !== golLoro) {
    return golNoi > golLoro ? 'noi' : 'loro';
  }
  return null;
}

export function simulaRigori(random = Math.random): [number, number] {
  const casa: boolean[] = [];
  const ospite: boolean[] = [];
  while (esitoRigori(casa, ospite) === null) {
    if (casa.length === ospite.length) {
      casa.push(random() < RIGORE_SEGNATO);
    } else {
      ospite.push(random() < RIGORE_SEGNATO);
    }
  }
  return [casa.filter(Boolean).length, ospite.filter(Boolean).length];
}

export function simulaPartita(fase: Fase, random = Math.random): Risultato {
  const golCasa = simulaGol(random);
  const golOspite = simulaGol(random);
  if (golCasa !== golOspite || !eliminazioneDiretta(fase)) {
    return { gol_casa: golCasa, gol_ospite: golOspite, rigori_casa: null, rigori_ospite: null };
  }
  const [rigoriCasa, rigoriOspite] = simulaRigori(random);
  return { gol_casa: golCasa, gol_ospite: golOspite, rigori_casa: rigoriCasa, rigori_ospite: rigoriOspite };
}
