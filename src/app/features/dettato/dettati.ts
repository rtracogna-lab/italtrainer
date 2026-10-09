export type DettatoLevel = 'base' | 'avanzato';

export interface Dettato {
  title: string;
  level: DettatoLevel;
  text: string;
  // Alla fine di ogni frase dice "Ora rileggo la frase, controlla." e
  // rilegge la frase appena dettata.
  rereadSentences?: boolean;
}

export const LEVELS: { id: DettatoLevel; label: string }[] = [
  { id: 'base', label: 'Base' },
  { id: 'avanzato', label: 'Avanzato' },
];

// Testi dei dettati. Per aggiungerne uno basta un nuovo elemento nell'elenco.
// Una " / " nel testo forza la divisione dei gruppi in quel punto e non viene
// né mostrata né letta. Un " // " invece fa dire "a capo" e manda a capo il
// testo mostrato.
export const DETTATI: Dettato[] = [
  {
    title: 'Il gatto Fufi',
    level: 'base',
    text: 'Il gatto di Luca si chiama Fufi. Ogni mattina beve il latte dalla sua ciotola. Poi dorme al sole sul divano.',
  },
  {
    title: 'Al parco con la nonna',
    level: 'base',
    text: 'Oggi vado al parco con la nonna. Io gioco sull\'altalena e mio fratello corre sul prato.',
  },
  {
    title: 'La merenda',
    level: 'base',
    text:
      'Oggi è giovedì e a scuola c’è la festa. Il papà di Sara ha portato una torta. ' +
      'È buonissima perché è piena di crema. Tutti ne vogliono ancora un po’.',
  },
  {
    title: 'In città',
    level: 'base',
    text:
      'Sabato vado in città con la mamma. Prendiamo il tram vicino a casa. ' +
      'In piazza c’è un bar con i tavolini fuori. La mamma beve un caffè e io una cioccolata.',
  },
  {
    title: 'I videogiochi',
    level: 'avanzato',
    text:
      'I videogiochi sono molto divertenti. Molti bambini giocano con la console o il computer. // ' +
      'Alcuni giochi fanno esplorare mondi fantastici. Altri invece sono gare di velocità con le macchine. // ' +
      'È importante non giocare troppo a lungo. Bisogna fare pause e stare anche all’aria aperta. ' +
      'Così ci si diverte senza stancare gli occhi.',
  },
  {
    title: 'Il calcio',
    level: 'avanzato',
    text:
      'Il calcio è lo sport più popolare. Molti bambini giocano a pallone nel pomeriggio. // ' +
      'La partita si disputa in un grande stadio. I tifosi fanno il tifo con bandiere e sciarpe. ' +
      'Il portiere si tuffa per parare il pallone. L’arbitro fischia / se c’è un fallo. // ' +
      'La squadra migliore vince la partita. Giocare insieme insegna a rispettare le regole.',
  },
  {
    title: 'La mia partita',
    level: 'avanzato',
    rereadSentences: true,
    text:
      'Oggi vado a giocare a calcio con il Valnatisone / ma prima dovrò fare i compiti. ' +
      'Sono un centrocampista dai piedi buoni / che gioca davanti alla difesa. ' +
      'Magari segnerò un goal / e festeggerò con una capriola. ' +
      'Il mister ci chiede sempre / di passare la palla ai compagni. ' +
      'Dopo la partita / mangerò una pizza con tutta la squadra.',
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

const SENTENCE_END = /[.!?]$/;

// Se il gruppo all'indice dato chiude una frase, restituisce tutta la frase
// (dall'inizio, anche se è divisa in più gruppi); altrimenti null.
export function sentenceEndingAt(chunks: DictationChunk[], index: number): string | null {
  if (!SENTENCE_END.test(chunks[index].text)) {
    return null;
  }
  let start = index;
  while (start > 0 && !SENTENCE_END.test(chunks[start - 1].text)) {
    start--;
  }
  return chunks
    .slice(start, index + 1)
    .map((chunk) => chunk.text)
    .join(' ');
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
