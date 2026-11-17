import {
  calendarioGirone,
  classifica,
  esitoRigori,
  generaAvversari,
  PartitaTorneo,
  partiteSuccessive,
  piazzamento,
  simulaPartita,
  simulaRigori,
  sorteggiaGironi,
  Squadra,
  turnoInCorso,
} from './regole';

const SQUADRE: Squadra[] = [1, 2, 3, 4, 5, 6, 7, 8].map((id) => ({
  idf_squadra: id,
  nome: `Squadra ${id}`,
  stemma: '⚽',
  girone: id <= 4 ? 'A' : 'B',
  giocatore: id === 1,
}));

let nextId = 1;
function partita(fase: PartitaTorneo['fase'], turno: number, casa: number, ospite: number, gol?: [number, number]): PartitaTorneo {
  return {
    idf_partita: nextId++,
    fase,
    turno,
    idf_casa: casa,
    idf_ospite: ospite,
    gol_casa: gol?.[0] ?? null,
    gol_ospite: gol?.[1] ?? null,
    rigori_casa: null,
    rigori_ospite: null,
    data_ora: null,
  };
}

// Gironi completi: nel girone A vince sempre la squadra col numero più basso,
// nel B pure. Classifiche: A = 1, 2, 3, 4 e B = 5, 6, 7, 8.
function gironiGiocati(): PartitaTorneo[] {
  return [...calendarioGirone('A', [1, 2, 3, 4]), ...calendarioGirone('B', [5, 6, 7, 8])].map(
    ({ fase, turno, idf_casa, idf_ospite }) =>
      partita(fase, turno, idf_casa, idf_ospite, idf_casa < idf_ospite ? [2, 0] : [0, 1]),
  );
}

describe('regole del torneo', () => {
  it('should generate distinct opponents and split 8 teams into two groups of 4', () => {
    const avversari = generaAvversari(7);
    expect(new Set(avversari.map((squadra) => squadra.nome)).size).toBe(7);
    const gironi = sorteggiaGironi([...avversari, { nome: 'Noi', stemma: '🔵' }]);
    expect(gironi.filter((item) => item.girone === 'A').length).toBe(4);
    expect(gironi.filter((item) => item.girone === 'B').length).toBe(4);
  });

  it('should make every team meet each other once in 3 matchdays', () => {
    const calendario = calendarioGirone('A', [1, 2, 3, 4]);
    expect(calendario.length).toBe(6);
    const coppie = new Set(calendario.map((item) => [item.idf_casa, item.idf_ospite].sort().join('-')));
    expect(coppie.size).toBe(6);
    for (const turno of [1, 2, 3]) {
      const squadre = calendario.filter((item) => item.turno === turno).flatMap((item) => [item.idf_casa, item.idf_ospite]);
      expect(new Set(squadre).size).toBe(4);
    }
  });

  it('should rank by points, then goal difference', () => {
    const partite = [partita('A', 1, 1, 2, [1, 0]), partita('A', 1, 3, 4, [3, 0]), partita('A', 2, 1, 3, [1, 1])];
    const righe = classifica(SQUADRE, partite, 'A');
    expect(righe.map((riga) => [riga.squadra.idf_squadra, riga.punti])).toEqual([
      [3, 4],
      [1, 4],
      [2, 0],
      [4, 0],
    ]);
  });

  it('should pair 1st A with 2nd B in the semifinals, then the winners in the final', () => {
    const partite = gironiGiocati();
    expect(turnoInCorso(partite)).toBeNull();
    const semifinali = partiteSuccessive(SQUADRE, partite, 3);
    expect(semifinali.map((item) => [item.idf_casa, item.idf_ospite])).toEqual([
      [1, 6],
      [5, 2],
    ]);

    const giocate = [...partite, partita('SF', 4, 1, 6, [1, 1]), partita('SF', 4, 5, 2, [0, 2])];
    giocate.at(-2)!.rigori_casa = 4;
    giocate.at(-2)!.rigori_ospite = 3;
    expect(partiteSuccessive(SQUADRE, giocate, 4).map((item) => [item.idf_casa, item.idf_ospite])).toEqual([[1, 2]]);
  });

  it('should tell how far the player went', () => {
    const partite = gironiGiocati();
    expect(piazzamento(SQUADRE, partite)).toBe('1° nel girone A');
    partite.push(partita('SF', 4, 1, 6, [2, 1]), partita('F', 5, 1, 5, [0, 3]));
    expect(piazzamento(SQUADRE, partite)).toBe('🥈 Finalisti');
  });

  it('should end penalties as soon as one side cannot catch up', () => {
    expect(esitoRigori([true, true, true], [false, false])).toBeNull();
    expect(esitoRigori([true, true, true], [false, false, false])).toBe('noi');
    expect(esitoRigori([false, false, false, false], [true, true, true])).toBe('loro');
    // Dopo 5 a testa in parità: a oltranza, una coppia di tiri alla volta.
    const cinque = [true, true, true, true, false];
    expect(esitoRigori(cinque, cinque)).toBeNull();
    expect(esitoRigori([...cinque, true], cinque)).toBeNull();
    expect(esitoRigori([...cinque, true], [...cinque, false])).toBe('noi');
  });

  it('should never leave a knockout match without a winner', () => {
    // Prima due gol uguali (0 a 0), poi rigori: la casa segna, l'ospite sbaglia.
    const sequenza = (valori: number[]) => {
      let index = 0;
      return () => valori[index++ % valori.length];
    };
    expect(simulaRigori(sequenza([0.1, 0.9]))).toEqual([3, 0]);
    const risultato = simulaPartita('F', sequenza([0.1, 0.1, 0.9, 0.1]));
    expect([risultato.gol_casa, risultato.gol_ospite]).toEqual([0, 0]);
    expect(risultato.rigori_casa).not.toBe(risultato.rigori_ospite);
    expect(simulaPartita('A', sequenza([0.1, 0.1])).rigori_casa).toBeNull();
  });
});
