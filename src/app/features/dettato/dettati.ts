export type DettatoLevel = 'facile';

export interface Dettato {
  title: string;
  level: DettatoLevel;
  text: string;
}

export const LEVELS: { id: DettatoLevel; label: string }[] = [{ id: 'facile', label: 'Facile' }];

// Testi dei dettati. Per aggiungerne uno basta un nuovo elemento nell'elenco.
// Una " / " nel testo forza la divisione dei gruppi in quel punto e non viene
// né mostrata né letta. Un " // " invece fa dire "a capo" e manda a capo il
// testo mostrato.
export const DETTATI: Dettato[] = [
  {
    title: 'Il gatto Fufi',
    level: 'facile',
    text: 'Il gatto di Luca si chiama Fufi. Ogni mattina beve il latte dalla sua ciotola. Poi dorme al sole sul divano.',
  },
  {
    title: 'Al parco con la nonna',
    level: 'facile',
    text: 'Oggi vado al parco con la nonna. Io gioco sull\'altalena e mio fratello corre sul prato.',
  },
  {
    title: 'I videogiochi',
    level: 'facile',
    text:
      'I videogiochi sono molto divertenti. Molti bambini giocano con la console o il computer. // ' +
      'Alcuni giochi fanno esplorare mondi fantastici. Altri invece sono gare di velocità con le macchine. // ' +
      'È importante non giocare troppo a lungo. Bisogna fare pause e stare anche all’aria aperta. ' +
      'Così ci si diverte senza stancare gli occhi.',
  },
  {
    title: 'Il calcio',
    level: 'facile',
    text:
      'Il calcio è lo sport più popolare. Molti bambini giocano a pallone nel pomeriggio. // ' +
      'La partita si disputa in un grande stadio. I tifosi fanno il tifo con bandiere e sciarpe. ' +
      'Il portiere si tuffa per parare il pallone. L’arbitro fischia / se c’è un fallo. // ' +
      'La squadra migliore vince la partita. Giocare insieme insegna a rispettare le regole.',
  },
];

export interface DictationChunk {
  // Testo come va scritto, con la punteggiatura.
  text: string;
  // Parole lette ad alta voce una alla volta: la punteggiatura viene detta
  // a parole ("punto", "virgola").
  spoken: string[];
  words: number;
}

const PUNCTUATION: Record<string, string> = {
  ',': 'virgola',
  '.': 'punto',
  '!': 'punto esclamativo',
  '?': 'punto interrogativo',
  ':': 'due punti',
  ';': 'punto e virgola',
};

// Parole dopo cui non conviene spezzare ("il | gatto" suona male).
const LINKING_WORDS = new Set(
  (
    'il lo la i gli le un uno una l di a da in con su per tra fra e o ' +
    'del dello della dei degli delle al allo alla ai agli alle dal dalla nel nella sul sulla ' +
    'mio mia tuo tua suo sua nostro nostra che ' +
    'mi ti si ci vi ne non è più molto se'
  ).split(' '),
);

const PUNCTUATION_AT_END = /[,.!?:;]$/;
const MANUAL_BREAK = '/';
const NEW_LINE = '//';

// Testo del dettato da mostrare e leggere, senza i segni di divisione.
export function plainText(text: string): string {
  return text
    .split(/\s+/)
    .filter((token) => token && token !== MANUAL_BREAK && token !== NEW_LINE)
    .join(' ');
}

// Il testo diviso nelle righe segnate con " // ".
export function paragraphs(text: string): string[] {
  return text.split(NEW_LINE).map(plainText).filter(Boolean);
}

const TARGET_WORDS = 3;
const MAX_WORDS = TARGET_WORDS + 3;

// Divide il testo in gruppi di 3 parole circa, spezzando sempre sulla
// punteggiatura, mai subito dopo un articolo o una preposizione e senza
// lasciare una parola da sola prima della punteggiatura.
export function splitIntoChunks(text: string): DictationChunk[] {
  const chunks: DictationChunk[] = [];
  let words: string[] = [];

  const flush = (punctuation = '') => {
    if (words.length === 0) {
      return;
    }
    chunks.push({
      text: words.join(' ') + punctuation,
      spoken: punctuation ? [...words, PUNCTUATION[punctuation]] : [...words],
      words: words.length,
    });
    words = [];
  };

  const tokens = text.split(/\s+/).filter(Boolean);
  tokens.forEach((token, index) => {
    if (token === MANUAL_BREAK) {
      flush();
      return;
    }
    if (token === NEW_LINE) {
      flush();
      // "a capo" si aggiunge alla fine del gruppo appena dettato.
      const spoken = chunks.at(-1)?.spoken;
      if (spoken?.at(-1) === PUNCTUATION['.']) {
        spoken[spoken.length - 1] = 'punto e a capo';
      } else {
        spoken?.push('a capo');
      }
      return;
    }
    const [, word, punctuation] = token.match(/^(.*?)([,.!?:;])?$/)!;
    if (word) {
      words.push(word);
    }
    if (punctuation) {
      flush(punctuation);
      return;
    }
    const next = tokens[index + 1];
    const lonelyNext = next !== undefined && PUNCTUATION_AT_END.test(next);
    const canSplit = !LINKING_WORDS.has(word.toLowerCase()) && !lonelyNext;
    if (words.length >= MAX_WORDS || (words.length >= TARGET_WORDS && canSplit)) {
      flush();
    }
  });
  flush();
  return chunks;
}
