import type { MatchQuestion } from './domande';

const OPTIONS = ['m', 'n'];
const M_TIP = 'Davanti a "b" e "p" si scrive sempre "m".';
const N_TIP = 'Dopo non c\'è né "b" né "p": si scrive "n".';

// [emoji, indizio, prima, lettera, dopo]
type Row = [clue: string, hint: string, prefix: string, missing: 'm' | 'n', suffix: string];

const ROWS: Row[] = [
  // m davanti a b e p
  ['👶', 'Un bimbo piccolo', 'ba', 'm', 'bino'],
  ['⚽', 'Ci si gioca a calcio', 'ca', 'm', 'po'],
  ['☂️', 'Ripara dalla pioggia', 'o', 'm', 'brello'],
  ['💡', 'Fa luce sul comodino', 'la', 'm', 'pada'],
  ['🎺', 'Strumento musicale che si suona soffiando', 'tro', 'm', 'ba'],
  ['🦵', 'Serve per camminare', 'ga', 'm', 'ba'],
  ['🚒', 'Spegne gli incendi', 'po', 'm', 'piere'],
  ['🎂', 'La festa con la torta e le candeline', 'co', 'm', 'pleanno'],
  ['⏰', 'Lo misura l\'orologio', 'te', 'm', 'po'],
  ['🌳', 'Si forma al riparo dal sole', 'o', 'm', 'bra'],
  ['🔔', 'Suona sul campanile', 'ca', 'm', 'pana'],
  ['🦐', 'Animaletto del mare con tante zampe', 'ga', 'm', 'bero'],
  ['🥁', 'Strumento da percuotere', 'ta', 'm', 'buro'],
  ['💻', 'Ci si scrive e ci si gioca', 'co', 'm', 'puter'],
  ['🔁', 'Ogni volta, senza mai smettere', 'se', 'm', 'pre'],
  ['🪆', 'Giocattolo a forma di bimba', 'ba', 'm', 'bola'],
  ['🫗', 'Serve per versare nelle bottiglie', 'i', 'm', 'buto'],
  ['🏕️', 'Vacanza in tenda', 'ca', 'm', 'peggio'],
  // n davanti alle altre consonanti
  ['🎤', 'Lo fa chi intona una canzone', 'ca', 'n', 'to'],
  ['🌍', 'La Terra intera', 'mo', 'n', 'do'],
  ['🏫', 'Il tavolino di scuola', 'ba', 'n', 'co'],
  ['🐼', 'Orso bianco e nero', 'pa', 'n', 'da'],
  ['🌉', 'Passa sopra il fiume', 'po', 'n', 'te'],
  ['🐌', 'Il contrario di veloce', 'le', 'n', 'to'],
  ['🦷', 'Si lava con lo spazzolino', 'de', 'n', 'te'],
  ['🥭', 'Frutto tropicale arancione', 'ma', 'n', 'go'],
  ['⛺', 'Si monta in campeggio', 'te', 'n', 'da'],
  ['💨', 'Muove le foglie degli alberi', 've', 'n', 'to'],
  ['🍽️', 'Io ... la pasta a pranzo', 'ma', 'n', 'gio'],
];

// m o n davanti a una consonante: davanti a "b" e "p" sempre "m".
export const M_N_QUESTIONS: MatchQuestion[] = ROWS.map(([clue, hint, prefix, missing, suffix]) => ({
  clue,
  hint,
  prefix,
  missing,
  suffix,
  options: OPTIONS,
  tip: missing === 'm' ? M_TIP : N_TIP,
}));
