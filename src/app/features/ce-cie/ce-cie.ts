import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoundSummary, SummaryWord } from '../../shared/round-summary/round-summary';
import { shuffle } from '../../shared/shuffle';
import { Tts } from '../../shared/tts';

type CeCieSyllable = 'ce' | 'cie' | 'sce' | 'scie' | 'ge' | 'gie';

interface CeCieWord {
  clue: string;
  hint: string;
  prefix: string;
  missing: CeCieSyllable;
  suffix: string;
  tip: string;
  // Plurali di -cia/-gia: la lettera prima di "c"/"g" (l'ultima del prefisso)
  // decide se la "i" resta (vocale) o cade (consonante).
  plural?: 'vowel' | 'consonant';
}

// Le opzioni dipendono dalla parola: "ce/cie", "sce/scie" oppure "ge/gie".
const OPTIONS: Record<CeCieSyllable, CeCieSyllable[]> = {
  ce: ['ce', 'cie'],
  cie: ['ce', 'cie'],
  sce: ['sce', 'scie'],
  scie: ['sce', 'scie'],
  ge: ['ge', 'gie'],
  gie: ['ge', 'gie'],
};

const CE_TIP = 'Di solito si scrive "ce" senza "i".';
const SCE_TIP = 'Di solito si scrive "sce" senza "i".';
const GE_TIP = 'Di solito si scrive "ge" senza "i".';
const PLURAL_VOWEL_TIP = 'Prima di -cia c\'è una vocale (in rosso): la "i" resta anche al plurale → -cie.';
const PLURAL_CONSONANT_TIP = 'Prima di -cia c\'è una consonante (in blu): al plurale la "i" cade → -ce.';
const PLURAL_ACCENT_TIP = 'Se la "i" di -cìa/-gìa è accentata, resta anche al plurale.';
const PLURAL_SC_TIP = 'Al plurale -scia diventa -sce: la "i" sparisce.';
const PLURAL_G_VOWEL_TIP = 'Prima di -gia c\'è una vocale (in rosso): la "i" resta anche al plurale → -gie.';
const PLURAL_G_CONSONANT_TIP = 'Prima di -gia c\'è una consonante (in blu): al plurale la "i" cade → -ge.';
const SCIENZA_TIP = '"Scienza" e i suoi derivati si scrivono con la "i".';
const COSCIENZA_TIP = '"Coscienza", "cosciente" e derivati si scrivono con la "i".';
const IGIENE_TIP = '"Igiene" e i suoi derivati si scrivono con la "i".';

// Parole che allenano la scelta tra "ce/cie", "sce/scie" e "ge/gie". Nella
// maggior parte dei casi si scrive senza "i": le parole con la "i" sono
// eccezioni da ricordare (cielo, scienza, igiene...) oppure plurali di parole
// in -cia/-gia.
const WORDS: CeCieWord[] = [
  // ce / cie
  { clue: '☁️', hint: 'Sopra di noi, azzurro', prefix: '', missing: 'cie', suffix: 'lo', tip: '"Cielo" si scrive con la "i".' },
  { clue: '🤫', hint: 'Io nascondo un segreto: io lo ...', prefix: '', missing: 'ce', suffix: 'lo', tip: '"Celo" viene da "celare" (nascondere): senza "i". Non confonderlo con "cielo"!' },
  { clue: '🦯', hint: 'Chi non vede', prefix: '', missing: 'cie', suffix: 'co', tip: '"Cieco" si scrive con la "i".' },
  { clue: '🚢', hint: 'Una vacanza sulla nave', prefix: 'cro', missing: 'cie', suffix: 'ra', tip: '"Crociera" si scrive con la "i".' },
  { clue: '👥', hint: 'L\'insieme delle persone che vivono insieme', prefix: 'so', missing: 'cie', suffix: 'tà', tip: '"Società" si scrive con la "i".' },
  { clue: '🐾', hint: 'Animale della stessa ...', prefix: 'spe', missing: 'cie', suffix: '', tip: '"Specie" è un\'eccezione con la "i".' },
  { clue: '🌊', hint: 'La parte esterna, sopra', prefix: 'superfi', missing: 'cie', suffix: '', tip: '"Superficie" è un\'eccezione con la "i".' },
  { clue: '👍', hint: 'Basta, è abbastanza', prefix: 'suffi', missing: 'cie', suffix: 'nte', tip: '"Sufficiente" ed "efficiente" si scrivono con la "i".' },
  { clue: '⚙️', hint: 'Che funziona bene', prefix: 'effi', missing: 'cie', suffix: 'nte', tip: '"Sufficiente" ed "efficiente" si scrivono con la "i".' },
  { clue: '🐦', hint: 'Animali con le ali (plurale)', prefix: 'uc', missing: 'ce', suffix: 'lli', tip: CE_TIP },
  { clue: '🍽️', hint: 'Il pasto della sera', prefix: '', missing: 'ce', suffix: 'na', tip: CE_TIP },
  { clue: '💯', hint: 'Il numero 100', prefix: '', missing: 'ce', suffix: 'nto', tip: CE_TIP },
  { clue: '🧺', hint: 'Cestino di vimini', prefix: '', missing: 'ce', suffix: 'sto', tip: CE_TIP },
  { clue: '🦌', hint: 'Animale con le corna ramificate', prefix: '', missing: 'ce', suffix: 'rvo', tip: CE_TIP },
  { clue: '🧠', hint: 'Organo dentro la testa', prefix: '', missing: 'ce', suffix: 'rvello', tip: CE_TIP },
  { clue: '⭕', hint: 'Figura rotonda', prefix: '', missing: 'ce', suffix: 'rchio', tip: CE_TIP },
  { clue: '🩹', hint: 'Si mette su un taglio', prefix: '', missing: 'ce', suffix: 'rotto', tip: CE_TIP },
  { clue: '🥒', hint: 'Ortaggio verde e lungo', prefix: '', missing: 'ce', suffix: 'triolo', tip: CE_TIP },
  { clue: '🔥', hint: 'Resta dopo il fuoco', prefix: '', missing: 'ce', suffix: 'nere', tip: CE_TIP },
  { clue: '😊', hint: 'Contento', prefix: 'feli', missing: 'ce', suffix: '', tip: CE_TIP },
  { clue: '✝️', hint: 'Due linee incrociate', prefix: 'cro', missing: 'ce', suffix: '', tip: CE_TIP },
  { clue: '🗣️', hint: 'Il suono che esce quando parliamo', prefix: 'vo', missing: 'ce', suffix: '', tip: CE_TIP },
  { clue: '🍬', hint: 'Il contrario di amaro', prefix: 'dol', missing: 'ce', suffix: '', tip: CE_TIP },
  { clue: '👕', hint: 'Una camicia, due ...', prefix: 'cami', missing: 'cie', suffix: '', tip: PLURAL_VOWEL_TIP, plural: 'vowel' },
  { clue: '🤝', hint: 'Una socia, due ...', prefix: 'so', missing: 'cie', suffix: '', tip: PLURAL_VOWEL_TIP, plural: 'vowel' },
  { clue: '💊', hint: 'Una farmacia, due ...', prefix: 'farma', missing: 'cie', suffix: '', tip: PLURAL_ACCENT_TIP },
  { clue: '🍊', hint: 'Un\'arancia, due ...', prefix: 'aran', missing: 'ce', suffix: '', tip: PLURAL_CONSONANT_TIP, plural: 'consonant' },
  { clue: '💧', hint: 'Una goccia, due ...', prefix: 'goc', missing: 'ce', suffix: '', tip: PLURAL_CONSONANT_TIP, plural: 'consonant' },
  { clue: '🙂', hint: 'Una faccia, due ...', prefix: 'fac', missing: 'ce', suffix: '', tip: PLURAL_CONSONANT_TIP, plural: 'consonant' },
  { clue: '🗺️', hint: 'Una provincia, due ...', prefix: 'provin', missing: 'ce', suffix: '', tip: PLURAL_CONSONANT_TIP, plural: 'consonant' },
  { clue: '😚', hint: 'Una guancia, due ...', prefix: 'guan', missing: 'ce', suffix: '', tip: PLURAL_CONSONANT_TIP, plural: 'consonant' },
  { clue: '🍌', hint: 'Una buccia, due ...', prefix: 'buc', missing: 'ce', suffix: '', tip: PLURAL_CONSONANT_TIP, plural: 'consonant' },
  { clue: '👣', hint: 'Una traccia, due ...', prefix: 'trac', missing: 'ce', suffix: '', tip: PLURAL_CONSONANT_TIP, plural: 'consonant' },
  { clue: '🗡️', hint: 'Una lancia, due ...', prefix: 'lan', missing: 'ce', suffix: '', tip: PLURAL_CONSONANT_TIP, plural: 'consonant' },
  { clue: '🩵', hint: 'Il colore del cielo', prefix: '', missing: 'ce', suffix: 'leste', tip: 'Attenzione: "celeste" va senza "i", anche se viene da "cielo"!' },
  { clue: '🕶️', hint: 'Il non vedere', prefix: '', missing: 'ce', suffix: 'cità', tip: 'Attenzione: "cecità" va senza "i", anche se viene da "cieco"!' },
  { clue: '♨️', hint: 'Recipiente per la brace', prefix: 'bra', missing: 'cie', suffix: 're', tip: '"Braciere" si scrive con la "i".' },
  { clue: '👎', hint: 'Il contrario di sufficiente', prefix: 'insuffi', missing: 'cie', suffix: 'nte', tip: '"Sufficiente" e "insufficiente" si scrivono con la "i".' },
  { clue: '🕯️', hint: 'Il materiale delle candele', prefix: '', missing: 'ce', suffix: 'ra', tip: CE_TIP },
  { clue: '🌳', hint: 'Una piccola pianta folta', prefix: '', missing: 'ce', suffix: 'spuglio', tip: CE_TIP },
  { clue: '🧱', hint: 'Si usa per costruire le case', prefix: '', missing: 'ce', suffix: 'mento', tip: CE_TIP },
  { clue: '🥣', hint: 'Si mangiano a colazione con il latte', prefix: '', missing: 'ce', suffix: 'reali', tip: CE_TIP },
  { clue: '☮️', hint: 'Il contrario di guerra', prefix: 'pa', missing: 'ce', suffix: '', tip: CE_TIP },
  { clue: '💡', hint: 'Il contrario di buio', prefix: 'lu', missing: 'ce', suffix: '', tip: CE_TIP },
  { clue: '🌰', hint: 'Frutto con il guscio duro', prefix: 'no', missing: 'ce', suffix: '', tip: CE_TIP },
  { clue: '🌭', hint: 'Una salsiccia, due ...', prefix: 'salsic', missing: 'ce', suffix: '', tip: PLURAL_CONSONANT_TIP, plural: 'consonant' },
  { clue: '👧', hint: 'Una treccia, due ...', prefix: 'trec', missing: 'ce', suffix: '', tip: PLURAL_CONSONANT_TIP, plural: 'consonant' },
  { clue: '💶', hint: 'Una mancia, due ...', prefix: 'man', missing: 'ce', suffix: '', tip: PLURAL_CONSONANT_TIP, plural: 'consonant' },
  { clue: '🔤', hint: 'Una pronuncia, due ...', prefix: 'pronun', missing: 'ce', suffix: '', tip: PLURAL_CONSONANT_TIP, plural: 'consonant' },
  { clue: '🌼', hint: 'Un\'acacia, due ...', prefix: 'aca', missing: 'cie', suffix: '', tip: PLURAL_VOWEL_TIP, plural: 'vowel' },

  // sce / scie
  { clue: '🔬', hint: 'Lo studio della natura', prefix: '', missing: 'scie', suffix: 'nza', tip: SCIENZA_TIP },
  { clue: '🧪', hint: 'Chi lavora in laboratorio', prefix: '', missing: 'scie', suffix: 'nziato', tip: SCIENZA_TIP },
  { clue: '📡', hint: 'Che riguarda la scienza', prefix: '', missing: 'scie', suffix: 'ntifico', tip: SCIENZA_TIP },
  { clue: '😇', hint: 'La voce interiore che ci dice cosa è giusto', prefix: 'co', missing: 'scie', suffix: 'nza', tip: COSCIENZA_TIP },
  { clue: '👀', hint: 'Sveglio, consapevole', prefix: 'co', missing: 'scie', suffix: 'nte', tip: COSCIENZA_TIP },
  { clue: '😵', hint: 'Svenuto, oppure che non pensa ai pericoli', prefix: 'inco', missing: 'scie', suffix: 'nte', tip: COSCIENZA_TIP },
  { clue: '🚪', hint: 'Chi sorveglia l\'ingresso di un ufficio', prefix: 'u', missing: 'scie', suffix: 're', tip: '"Usciere" si scrive con la "i".' },
  { clue: '📖', hint: 'Sapere tante cose: la ...', prefix: 'cono', missing: 'sce', suffix: 'nza', tip: 'Attenzione: "conoscenza" va senza "i", anche se "scienza" ce l\'ha!' },
  { clue: '🐟', hint: 'Nuota nel mare', prefix: 'pe', missing: 'sce', suffix: '', tip: SCE_TIP },
  { clue: '🎭', hint: 'Il palco del teatro', prefix: '', missing: 'sce', suffix: 'na', tip: SCE_TIP },
  { clue: '⬇️', hint: 'Andare giù', prefix: '', missing: 'sce', suffix: 'ndere', tip: SCE_TIP },
  { clue: '🛗', hint: 'Ti porta ai piani alti', prefix: 'a', missing: 'sce', suffix: 'nsore', tip: SCE_TIP },
  { clue: '🤔', hint: 'Decidere tra più cose', prefix: '', missing: 'sce', suffix: 'gliere', tip: SCE_TIP },
  { clue: '✅', hint: 'La decisione presa', prefix: '', missing: 'sce', suffix: 'lta', tip: SCE_TIP },
  { clue: '🌱', hint: 'Diventare più grande', prefix: 'cre', missing: 'sce', suffix: 're', tip: SCE_TIP },
  { clue: '👶', hint: 'Venire al mondo', prefix: 'na', missing: 'sce', suffix: 're', tip: SCE_TIP },
  { clue: '🤠', hint: 'Lo sceriffo del Far West', prefix: '', missing: 'sce', suffix: 'riffo', tip: SCE_TIP },
  { clue: '👑', hint: 'Il bastone del re', prefix: '', missing: 'sce', suffix: 'ttro', tip: SCE_TIP },
  { clue: '🍗', hint: 'Una coscia, due ...', prefix: 'co', missing: 'sce', suffix: '', tip: PLURAL_SC_TIP },
  { clue: '🚸', hint: 'Una striscia, due ...', prefix: 'stri', missing: 'sce', suffix: '', tip: PLURAL_SC_TIP },
  { clue: '🎗️', hint: 'Una fascia, due ...', prefix: 'fa', missing: 'sce', suffix: '', tip: PLURAL_SC_TIP },
  { clue: '🪓', hint: 'Un\'ascia, due ...', prefix: 'a', missing: 'sce', suffix: '', tip: PLURAL_SC_TIP },
  { clue: '🐍', hint: 'Una biscia, due ...', prefix: 'bi', missing: 'sce', suffix: '', tip: PLURAL_SC_TIP },
  { clue: '📝', hint: 'Chi fa le cose con cura e impegno', prefix: 'co', missing: 'scie', suffix: 'nzioso', tip: COSCIENZA_TIP },
  { clue: '🚀', hint: 'Film di astronavi e alieni', prefix: 'fanta', missing: 'scie', suffix: 'nza', tip: SCIENZA_TIP },
  { clue: '🧑‍🤝‍🧑', hint: 'Sapere chi è una persona', prefix: 'cono', missing: 'sce', suffix: 're', tip: SCE_TIP },
  { clue: '🏞️', hint: 'Piccolo fiume', prefix: 'ru', missing: 'sce', suffix: 'llo', tip: SCE_TIP },
  { clue: '⛷️', hint: 'Una strada che va in giù', prefix: 'di', missing: 'sce', suffix: 'sa', tip: SCE_TIP },
  { clue: '🚶', hint: 'Lui ... di casa', prefix: 'e', missing: 'sce', suffix: '', tip: SCE_TIP },

  // ge / gie
  { clue: '🧼', hint: 'Pulizia del corpo', prefix: 'i', missing: 'gie', suffix: 'ne', tip: IGIENE_TIP },
  { clue: '🧻', hint: 'Carta ...', prefix: 'i', missing: 'gie', suffix: 'nica', tip: IGIENE_TIP },
  { clue: '🪙', hint: 'Il ritratto sulla moneta', prefix: 'effi', missing: 'gie', suffix: '', tip: '"Effigie" è un\'eccezione con la "i".' },
  { clue: '🍦', hint: 'Dolce freddo', prefix: '', missing: 'ge', suffix: 'lato', tip: GE_TIP },
  { clue: '👨‍👩‍👧', hint: 'Tante persone', prefix: '', missing: 'ge', suffix: 'nte', tip: GE_TIP },
  { clue: '🥶', hint: 'Freddo intenso, ghiaccio', prefix: '', missing: 'ge', suffix: 'lo', tip: GE_TIP },
  { clue: '❄️', hint: 'Il primo mese dell\'anno', prefix: '', missing: 'ge', suffix: 'nnaio', tip: GE_TIP },
  { clue: '👯', hint: 'Fratelli nati lo stesso giorno', prefix: '', missing: 'ge', suffix: 'melli', tip: GE_TIP },
  { clue: '👪', hint: 'Mamma e papà', prefix: '', missing: 'ge', suffix: 'nitori', tip: GE_TIP },
  { clue: '👼', hint: 'Ha le ali e l\'aureola', prefix: 'an', missing: 'ge', suffix: 'lo', tip: GE_TIP },
  { clue: '🖍️', hint: 'Si usa per scrivere alla lavagna', prefix: '', missing: 'ge', suffix: 'sso', tip: GE_TIP },
  { clue: '📚', hint: 'Guardare le parole di un libro', prefix: 'leg', missing: 'ge', suffix: 're', tip: GE_TIP },
  { clue: '🌍', hint: 'La materia che studia la Terra', prefix: '', missing: 'ge', suffix: 'ografia', tip: GE_TIP },
  { clue: '🎁', hint: 'Chi regala volentieri', prefix: '', missing: 'ge', suffix: 'neroso', tip: GE_TIP },
  { clue: '🙏', hint: 'Educato, cortese', prefix: '', missing: 'ge', suffix: 'ntile', tip: GE_TIP },
  { clue: '🧳', hint: 'Una valigia, due ...', prefix: 'vali', missing: 'gie', suffix: '', tip: PLURAL_G_VOWEL_TIP, plural: 'vowel' },
  { clue: '🍒', hint: 'Una ciliegia, due ...', prefix: 'cilie', missing: 'gie', suffix: '', tip: PLURAL_G_VOWEL_TIP, plural: 'vowel' },
  { clue: '🐘', hint: 'Una cosa grigia, due cose ...', prefix: 'gri', missing: 'gie', suffix: '', tip: PLURAL_G_VOWEL_TIP, plural: 'vowel' },
  { clue: '🤥', hint: 'Una bugia, due ...', prefix: 'bu', missing: 'gie', suffix: '', tip: PLURAL_ACCENT_TIP },
  { clue: '🏖️', hint: 'Una spiaggia, due ...', prefix: 'spiag', missing: 'ge', suffix: '', tip: PLURAL_G_CONSONANT_TIP, plural: 'consonant' },
  { clue: '🌧️', hint: 'Una pioggia, due ...', prefix: 'piog', missing: 'ge', suffix: '', tip: PLURAL_G_CONSONANT_TIP, plural: 'consonant' },
  { clue: '💇', hint: 'Una frangia, due ...', prefix: 'fran', missing: 'ge', suffix: '', tip: PLURAL_G_CONSONANT_TIP, plural: 'consonant' },
  { clue: '😈', hint: 'Una strega malvagia, due streghe ...', prefix: 'malva', missing: 'gie', suffix: '', tip: PLURAL_G_VOWEL_TIP, plural: 'vowel' },
  { clue: '🎬', hint: 'Una regia, due ...', prefix: 're', missing: 'gie', suffix: '', tip: PLURAL_ACCENT_TIP },
  { clue: '🪄', hint: 'Una magia, due ...', prefix: 'ma', missing: 'gie', suffix: '', tip: PLURAL_ACCENT_TIP },
  { clue: '🤧', hint: 'Un\'allergia, due ...', prefix: 'aller', missing: 'gie', suffix: '', tip: PLURAL_ACCENT_TIP },
  { clue: '⚡', hint: 'Un\'energia, due ...', prefix: 'ener', missing: 'gie', suffix: '', tip: PLURAL_ACCENT_TIP },
  { clue: '🌺', hint: 'Fiore che si mette sui balconi', prefix: '', missing: 'ge', suffix: 'ranio', tip: GE_TIP },
  { clue: '🌿', hint: 'Il primo rametto di una pianta', prefix: '', missing: 'ge', suffix: 'rmoglio', tip: GE_TIP },
  { clue: '🎖️', hint: 'Il capo dell\'esercito', prefix: '', missing: 'ge', suffix: 'nerale', tip: GE_TIP },
  { clue: '🧞', hint: 'Esce dalla lampada di Aladino', prefix: '', missing: 'ge', suffix: 'nio', tip: GE_TIP },
  { clue: '🥈', hint: 'Il metallo della seconda medaglia', prefix: 'ar', missing: 'ge', suffix: 'nto', tip: GE_TIP },
  { clue: '📒', hint: 'Il quaderno degli appuntamenti', prefix: 'a', missing: 'ge', suffix: 'nda', tip: GE_TIP },
  { clue: '🪶', hint: 'Il contrario di pesante', prefix: 'leg', missing: 'ge', suffix: 'ro', tip: GE_TIP },
  { clue: '🎨', hint: 'Fare un quadro con i colori', prefix: 'dipin', missing: 'ge', suffix: 're', tip: GE_TIP },
  { clue: '😢', hint: 'Versare lacrime', prefix: 'pian', missing: 'ge', suffix: 're', tip: GE_TIP },
];

const QUESTIONS_PER_ROUND = 10;

function pickRound(): CeCieWord[] {
  return shuffle(WORDS).slice(0, QUESTIONS_PER_ROUND);
}

@Component({
  imports: [RouterLink, RoundSummary],
  selector: 'app-ce-cie',
  styleUrl: './ce-cie.scss',
  templateUrl: './ce-cie.html',
})
export class CeCie {
  protected readonly tts = inject(Tts);

  protected readonly total = QUESTIONS_PER_ROUND;

  protected readonly words = signal(pickRound());
  protected readonly currentIndex = signal(0);
  protected readonly score = signal(0);
  protected readonly selected = signal<string | null>(null);
  protected readonly answered = signal(false);
  // Risposta data per ogni parola del round, per il riepilogo finale.
  protected readonly answers = signal<string[]>([]);
  protected readonly summary = computed<SummaryWord[]>(() =>
    this.words().map(({ prefix, missing, suffix }, index) => ({ prefix, missing, suffix, given: this.answers()[index] })),
  );

  protected readonly isFinished = computed(() => this.currentIndex() >= this.total);
  protected readonly current = computed(() => this.words()[this.currentIndex()]);
  protected readonly options = computed(() => OPTIONS[this.current().missing]);
  // Per i plurali con regola, l'ultima lettera del prefisso viene evidenziata.
  protected readonly prefixHead = computed(() => {
    const { prefix, plural } = this.current();
    return plural ? prefix.slice(0, -1) : prefix;
  });
  protected readonly ruleLetter = computed(() => {
    const { prefix, plural } = this.current();
    return plural ? prefix.slice(-1) : '';
  });
  protected readonly isCorrect = computed(() => this.selected() === this.current().missing);

  protected speakWord(): void {
    const { prefix, missing, suffix } = this.current();
    this.tts.speak(prefix + missing + suffix);
  }

  protected selectOption(option: string): void {
    if (this.answered()) {
      return;
    }
    this.selected.set(option);
    this.answered.set(true);
    this.answers.update((list) => [...list, option]);
    if (option === this.current().missing) {
      this.score.update((value) => value + 1);
    }
  }

  protected next(): void {
    this.selected.set(null);
    this.answered.set(false);
    this.currentIndex.update((index) => index + 1);
  }

  protected restart(): void {
    this.words.set(pickRound());
    this.currentIndex.set(0);
    this.score.set(0);
    this.answers.set([]);
    this.selected.set(null);
    this.answered.set(false);
  }
}
