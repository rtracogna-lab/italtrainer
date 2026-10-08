// Parole in cui i bambini dimenticano spesso una lettera ("prché", "qando",
// "sempe"). Usate dagli esercizi "Lettera mancante" e "Costruisci con le
// sillabe".
//
// Formato: le sillabe sono separate da "-" e tra parentesi quadre ci sono le
// lettere che si dimenticano più spesso (una viene tolta a caso nell'esercizio
// della lettera mancante). Per aggiungere una parola basta una riga in più.
const SOURCES = [
  'p[e]r-ché',
  'q[u]an-do',
  'sem-p[r]e',
  'den-t[r]o',
  's[c]uo-la',
  'qua-d[e]r-no',
  'ma-[e]-stra',
  'fi-ne-s[t]ra',
  's[t]ra-da',
  't[r]e-no',
  'al-b[e]-ro',
  'f[r]a-go-la',
  's[c]ri-ve-re',
  'g[r]an-de',
  'in-s[i]e-me',
  'men-t[r]e',
  'p[r]a-to',
  'f[r]ut-ta',
  'quat-t[r]o',
  'gio[r]-no',
  'p[r]en-de-re',
  'pro-b[l]e-ma',
  'ma[r]-te-dì',
  've-n[e]r-dì',
  'a[n]-co-ra',
  'so-p[r]a',
  'die-t[r]o',
  'qu[a]l-co-sa',
  'no-s[t]ro',
  'cin-q[u]e',
];

export interface ParolaDifficile {
  word: string;
  syllables: string[];
  // Posizioni (nella parola) delle lettere che si dimenticano più spesso.
  tricky: number[];
}

function parse(source: string): ParolaDifficile {
  let word = '';
  let syllable = '';
  const syllables: string[] = [];
  const tricky: number[] = [];
  let inBrackets = false;
  for (const char of source) {
    if (char === '[') {
      inBrackets = true;
    } else if (char === ']') {
      inBrackets = false;
    } else if (char === '-') {
      syllables.push(syllable);
      syllable = '';
    } else {
      if (inBrackets) {
        tricky.push(word.length);
      }
      word += char;
      syllable += char;
    }
  }
  syllables.push(syllable);
  return { word, syllables, tricky };
}

export const PAROLE_DIFFICILI: ParolaDifficile[] = SOURCES.map(parse);
