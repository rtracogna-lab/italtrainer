export type DettatoLevel = 'facile';

export interface Dettato {
  title: string;
  level: DettatoLevel;
  text: string;
}

export const LEVELS: { id: DettatoLevel; label: string }[] = [{ id: 'facile', label: 'Facile' }];

// Testi dei dettati. Per aggiungerne uno basta un nuovo elemento nell'elenco.
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
    'mio mia tuo tua suo sua nostro nostra che'
  ).split(' '),
);

const TARGET_WORDS = 3;
const MAX_WORDS = TARGET_WORDS + 3;

// Divide il testo in gruppi di 3 parole circa, spezzando sempre sulla
// punteggiatura e mai subito dopo un articolo o una preposizione.
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

  for (const token of text.split(/\s+/).filter(Boolean)) {
    const [, word, punctuation] = token.match(/^(.*?)([,.!?:;])?$/)!;
    if (word) {
      words.push(word);
    }
    if (punctuation) {
      flush(punctuation);
      continue;
    }
    const last = word.toLowerCase();
    if (words.length >= MAX_WORDS || (words.length >= TARGET_WORDS && !LINKING_WORDS.has(last))) {
      flush();
    }
  }
  flush();
  return chunks;
}
