import type { MatchQuestion } from './domande';

type GSound = 'ge' | 'ghe' | 'gi' | 'ghi';

const OPTIONS: Record<GSound, string[]> = {
  ge: ['ge', 'ghe'],
  ghe: ['ge', 'ghe'],
  gi: ['gi', 'ghi'],
  ghi: ['gi', 'ghi'],
};

const SOFT_TIP = 'Qui la "g" ha il suono dolce, come in gelato e giraffa: niente "h".';
const HARD_TIP = 'Qui la "g" ha il suono duro, come in gatto: davanti a "e" e "i" serve l\'"h".';
const PLURAL_TIP = 'Al plurale la "g" resta dura, come al singolare: ci vuole l\'"h".';

// [emoji, indizio, prima, suono, dopo, trucco]
type Row = [clue: string, hint: string, prefix: string, missing: GSound, suffix: string, tip?: string];

const ROWS: Row[] = [
  // ge
  ['🍦', 'Dolce freddo', '', 'ge', 'lato'],
  ['👼', "Ha le ali e l'aureola", 'an', 'ge', 'lo'],
  ['❄️', "Il primo mese dell'anno", '', 'ge', 'nnaio'],
  ['👯', 'Fratelli nati lo stesso giorno', '', 'ge', 'melli'],
  ['🥈', 'Il metallo della seconda medaglia', 'ar', 'ge', 'nto'],
  ['📋', 'Il foglio con i voti della scuola', 'pa', 'ge', 'lla'],
  ['🍽️', 'Domani io ... la pizza', 'man', 'ge', 'rò'],
  ['👨‍👩‍👧', 'Tante persone', '', 'ge', 'nte'],
  ['🙏', 'Educato, cortese', '', 'ge', 'ntile'],
  ['🌍', 'La materia che studia la Terra', '', 'ge', 'ografia'],
  // ghe
  ['🍝', 'Pasta lunga e sottile', 'spa', 'ghe', 'tti', HARD_TIP],
  ['🐆', 'Il felino più veloce', '', 'ghe', 'pardo', HARD_TIP],
  ['🌼', 'Fiore bianco con il centro giallo', 'mar', 'ghe', 'rita', HARD_TIP],
  ['💰', 'Domani io ... il conto', 'pa', 'ghe', 'rò', HARD_TIP],
  ['🏞️', 'Un piccolo lago', 'la', 'ghe', 'tto', HARD_TIP],
  ['🧹', 'Una strega, tante ...', 'stre', 'ghe', '', PLURAL_TIP],
  ['📏', 'Una riga, tante ...', 'ri', 'ghe', '', PLURAL_TIP],
  ['🌿', "Un'alga, tante ...", 'al', 'ghe', '', PLURAL_TIP],
  ['🧙‍♀️', 'Una maga, tante ...', 'ma', 'ghe', '', PLURAL_TIP],
  ['🛣️', 'Una strada lunga, due strade ...', 'lun', 'ghe', '', PLURAL_TIP],
  // gi
  ['🦒', 'Animale dal collo lunghissimo', '', 'gi', 'raffa'],
  ['🌷', 'Prato con fiori vicino a casa', '', 'gi', 'ardino'],
  ['🎠', 'Si trova al luna park', '', 'gi', 'ostra'],
  ['💛', 'Il colore del sole', '', 'gi', 'allo'],
  ['🧸', 'Si usa per giocare', '', 'gi', 'ocattolo'],
  ['🦵', 'Si piega a metà della gamba', '', 'gi', 'nocchio'],
  ['🪄', 'Il trucco del mago', 'ma', 'gi', 'a'],
  ['📄', 'Il foglio di un libro', 'pa', 'gi', 'na'],
  ['🧌', 'Un uomo enorme delle fiabe', '', 'gi', 'gante'],
  ['☀️', 'Dura 24 ore', '', 'gi', 'orno'],
  // ghi
  ['🍄', 'Un fungo, tanti ...', 'fun', 'ghi', '', PLURAL_TIP],
  ['🏞️', 'Un lago, tanti ...', 'la', 'ghi', '', PLURAL_TIP],
  ['🧙', 'Un mago, tanti ...', 'ma', 'ghi', '', PLURAL_TIP],
  ['🏨', 'Un albergo, tanti ...', 'alber', 'ghi', '', PLURAL_TIP],
  ['🧊', "L'acqua quando gela", '', 'ghi', 'accio', HARD_TIP],
  ['💤', 'Animale che dorme tutto l\'inverno', '', 'ghi', 'ro', HARD_TIP],
  ['🌰', 'Il frutto della quercia', '', 'ghi', 'anda', HARD_TIP],
  ['😋', 'Goloso', '', 'ghi', 'otto', HARD_TIP],
  ['🎄', "Si appende all'albero di Natale", '', 'ghi', 'rlanda', HARD_TIP],
  ['🍬', 'Un dolce lungo, due dolci ...', 'lun', 'ghi', '', PLURAL_TIP],
];

// Parole con ge/ghe e gi/ghi: suono dolce senza "h", suono duro con la "h".
export const GHE_GHI_QUESTIONS: MatchQuestion[] = ROWS.map(([clue, hint, prefix, missing, suffix, tip]) => ({
  clue,
  hint,
  prefix,
  missing,
  suffix,
  options: OPTIONS[missing],
  tip: tip ?? SOFT_TIP,
}));
