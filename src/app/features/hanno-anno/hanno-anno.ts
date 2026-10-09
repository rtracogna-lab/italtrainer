import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoundSummary, SummaryWord } from '../../shared/round-summary/round-summary';
import { shuffle } from '../../shared/shuffle';
import { Tts } from '../../shared/tts';
import { computeScore, TimedAnswer } from './punteggio';

interface HannoAnnoSentence {
  before: string;
  after: string;
  answer: string;
  options: string[];
}

const HANNO_ANNO_OPTIONS = ['hanno', 'anno'];
const HA_A_OPTIONS = ['ha', 'a'];

const HANNO_ANNO_SENTENCES: HannoAnnoSentence[] = [
  { before: 'I miei genitori', after: 'un cane.', answer: 'hanno', options: HANNO_ANNO_OPTIONS },
  { before: "Quest'", after: 'andrò in terza elementare.', answer: 'anno', options: HANNO_ANNO_OPTIONS },
  { before: 'I bambini', after: 'tanti giocattoli.', answer: 'hanno', options: HANNO_ANNO_OPTIONS },
  { before: "L'", after: 'scorso ho imparato a nuotare.', answer: 'anno', options: HANNO_ANNO_OPTIONS },
  { before: 'Le mie sorelle', after: 'sempre fame.', answer: 'hanno', options: HANNO_ANNO_OPTIONS },
  { before: 'Il nuovo', after: 'scolastico inizia a settembre.', answer: 'anno', options: HANNO_ANNO_OPTIONS },
  { before: 'Loro', after: 'vinto la partita.', answer: 'hanno', options: HANNO_ANNO_OPTIONS },
  { before: 'Ogni', after: 'festeggiamo il mio compleanno.', answer: 'anno', options: HANNO_ANNO_OPTIONS },
  { before: 'I miei nonni', after: 'una casa al mare.', answer: 'hanno', options: HANNO_ANNO_OPTIONS },
  { before: 'Fra un', after: 'sarò più alto.', answer: 'anno', options: HANNO_ANNO_OPTIONS },
  { before: 'I miei amici', after: 'una bicicletta nuova.', answer: 'hanno', options: HANNO_ANNO_OPTIONS },
  { before: "Quest'", after: 'ho conosciuto tanti amici.', answer: 'anno', options: HANNO_ANNO_OPTIONS },
  { before: 'Le maestre', after: 'corretto i compiti.', answer: 'hanno', options: HANNO_ANNO_OPTIONS },
  { before: 'Il mio cane ha un', after: 'e mezzo.', answer: 'anno', options: HANNO_ANNO_OPTIONS },
  { before: 'I gatti', after: 'paura dei cani.', answer: 'hanno', options: HANNO_ANNO_OPTIONS },
  { before: "Il primo giorno dell'", after: 'è il primo gennaio.', answer: 'anno', options: HANNO_ANNO_OPTIONS },
  { before: 'Che cosa', after: 'fatto i tuoi compagni?', answer: 'hanno', options: HANNO_ANNO_OPTIONS },
  { before: 'Mia sorella ha un', after: 'più di me.', answer: 'anno', options: HANNO_ANNO_OPTIONS },
];

const HA_A_SENTENCES: HannoAnnoSentence[] = [
  { before: 'Il mio amico', after: 'un gatto nero.', answer: 'ha', options: HA_A_OPTIONS },
  { before: 'Oggi vado', after: 'scuola in bicicletta.', answer: 'a', options: HA_A_OPTIONS },
  { before: 'Lei', after: 'sempre molta pazienza.', answer: 'ha', options: HA_A_OPTIONS },
  { before: 'Domani andremo', after: 'casa della nonna.', answer: 'a', options: HA_A_OPTIONS },
  { before: 'Il cane', after: 'tanta fame.', answer: 'ha', options: HA_A_OPTIONS },
  { before: 'Mi piace giocare', after: 'calcio.', answer: 'a', options: HA_A_OPTIONS },
  { before: 'Marco', after: 'dieci anni.', answer: 'ha', options: HA_A_OPTIONS },
  { before: 'Vieni', after: 'mangiare con noi?', answer: 'a', options: HA_A_OPTIONS },
  { before: 'La mamma non', after: 'voglia di uscire.', answer: 'ha', options: HA_A_OPTIONS },
  { before: 'Andiamo', after: 'vedere un film.', answer: 'a', options: HA_A_OPTIONS },
];

const E_OPTIONS = ['è', 'e'];
const HO_O_OPTIONS = ['ho', 'o'];

const E_SENTENCES: HannoAnnoSentence[] = [
  { before: 'Il cielo', after: 'azzurro.', answer: 'è', options: E_OPTIONS },
  { before: 'Ho comprato il pane', after: 'il latte.', answer: 'e', options: E_OPTIONS },
  { before: 'Mia sorella', after: 'molto simpatica.', answer: 'è', options: E_OPTIONS },
  { before: 'Luca', after: 'Sara giocano insieme.', answer: 'e', options: E_OPTIONS },
  { before: 'Oggi', after: 'una bella giornata.', answer: 'è', options: E_OPTIONS },
  { before: 'Mangio una mela', after: 'una banana.', answer: 'e', options: E_OPTIONS },
  { before: 'Il gatto', after: 'sotto il tavolo.', answer: 'è', options: E_OPTIONS },
  { before: 'Ho un cane', after: 'due gatti.', answer: 'e', options: E_OPTIONS },
  { before: 'La scuola', after: 'chiusa la domenica.', answer: 'è', options: E_OPTIONS },
  { before: 'Prendo la penna', after: 'il quaderno.', answer: 'e', options: E_OPTIONS },
  // Coppie con "è" ed "e" nella stessa frase: una volta manca l'una, una
  // volta l'altra.
  { before: 'Il gelato', after: 'buono e fresco.', answer: 'è', options: E_OPTIONS },
  { before: 'Il gelato è buono', after: 'fresco.', answer: 'e', options: E_OPTIONS },
  { before: 'Il mare', after: 'calmo e blu.', answer: 'è', options: E_OPTIONS },
  { before: 'Il gatto è bianco', after: 'nero.', answer: 'e', options: E_OPTIONS },
  { before: 'Il compito', after: 'facile e veloce.', answer: 'è', options: E_OPTIONS },
  { before: 'Marco è stanco', after: 'ha sonno.', answer: 'e', options: E_OPTIONS },
  { before: 'Mio fratello', after: 'più alto di me.', answer: 'è', options: E_OPTIONS },
  { before: 'Dove', after: 'il mio zaino?', answer: 'è', options: E_OPTIONS },
  { before: 'La pizza', after: 'pronta, venite a tavola!', answer: 'è', options: E_OPTIONS },
  { before: 'Oggi la maestra', after: 'contenta di noi.', answer: 'è', options: E_OPTIONS },
  { before: 'Il pallone', after: 'sotto il letto.', answer: 'è', options: E_OPTIONS },
  { before: 'Mio papà', after: 'un bravo cuoco.', answer: 'è', options: E_OPTIONS },
  { before: 'Gioco a calcio', after: 'a pallavolo.', answer: 'e', options: E_OPTIONS },
  { before: 'La mamma', after: 'il papà sono al lavoro.', answer: 'e', options: E_OPTIONS },
  { before: 'Mi lavo i denti', after: 'vado a letto.', answer: 'e', options: E_OPTIONS },
  { before: 'Il cane abbaia', after: 'scodinzola.', answer: 'e', options: E_OPTIONS },
  { before: 'Ho letto un libro', after: 'ho fatto un disegno.', answer: 'e', options: E_OPTIONS },
  { before: 'Apro la finestra', after: 'guardo fuori.', answer: 'e', options: E_OPTIONS },
  { before: 'Oggi piove', after: 'fa freddo.', answer: 'e', options: E_OPTIONS },
  { before: 'Il nonno', after: 'in giardino con il cane.', answer: 'è', options: E_OPTIONS },
];

const HO_O_SENTENCES: HannoAnnoSentence[] = [
  { before: 'Io', after: 'fame.', answer: 'ho', options: HO_O_OPTIONS },
  { before: 'Vuoi il gelato', after: 'la torta?', answer: 'o', options: HO_O_OPTIONS },
  { before: 'Oggi', after: 'una verifica di matematica.', answer: 'ho', options: HO_O_OPTIONS },
  { before: 'Andiamo al parco', after: 'restiamo a casa?', answer: 'o', options: HO_O_OPTIONS },
  { before: 'Io', after: 'un fratello più piccolo.', answer: 'ho', options: HO_O_OPTIONS },
  { before: 'Preferisci il rosso', after: 'il blu?', answer: 'o', options: HO_O_OPTIONS },
  { before: 'Ieri', after: 'giocato a calcio.', answer: 'ho', options: HO_O_OPTIONS },
  { before: 'Mettiamo la giacca', after: 'il maglione?', answer: 'o', options: HO_O_OPTIONS },
  { before: 'Non', after: 'ancora finito i compiti.', answer: 'ho', options: HO_O_OPTIONS },
  { before: 'Ci vediamo oggi', after: 'domani?', answer: 'o', options: HO_O_OPTIONS },
];

// "c'è" (ci + è: qualcosa si trova lì) contro "ce" (davanti a lo, la, l', ne:
// "ce l'ho", "ce la faccio", "ce ne sono").
const CE_OPTIONS = ["c'è", 'ce'];

const CE_SENTENCES: HannoAnnoSentence[] = [
  { before: 'Sul tavolo', after: 'una torta.', answer: "c'è", options: CE_OPTIONS },
  { before: 'Oggi', after: 'il sole.', answer: "c'è", options: CE_OPTIONS },
  { before: 'Nel giardino', after: 'un grande albero.', answer: "c'è", options: CE_OPTIONS },
  { before: 'Chi', after: 'alla porta?', answer: "c'è", options: CE_OPTIONS },
  { before: 'Non', after: 'più latte nel frigo.', answer: "c'è", options: CE_OPTIONS },
  { before: 'Hai la matita? Sì,', after: "l'ho nello zaino.", answer: 'ce', options: CE_OPTIONS },
  { before: 'Non', after: 'la faccio più, sono stanco!', answer: 'ce', options: CE_OPTIONS },
  { before: 'La maestra', after: "l'ha spiegato ieri.", answer: 'ce', options: CE_OPTIONS },
  { before: 'Quante caramelle!', after: 'ne sono tantissime.', answer: 'ce', options: CE_OPTIONS },
  { before: 'Se mi aiuti,', after: 'la facciamo in tempo.', answer: 'ce', options: CE_OPTIONS },
];

const SENTENCES: HannoAnnoSentence[] = [
  ...HANNO_ANNO_SENTENCES,
  ...HA_A_SENTENCES,
  ...E_SENTENCES,
  ...HO_O_SENTENCES,
  ...CE_SENTENCES,
];
const QUESTIONS_PER_ROUND = 10;
const RECORD_KEY = 'italtrainer.hanno-anno.record';

function readRecord(): number {
  try {
    return Number(localStorage.getItem(RECORD_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveRecord(points: number): void {
  try {
    localStorage.setItem(RECORD_KEY, String(points));
  } catch {
    // Senza memoria del browser il record semplicemente non si salva.
  }
}

function pickRound(): HannoAnnoSentence[] {
  return shuffle(SENTENCES).slice(0, QUESTIONS_PER_ROUND);
}

@Component({
  imports: [RouterLink, RoundSummary],
  selector: 'app-hanno-anno',
  styleUrl: './hanno-anno.scss',
  templateUrl: './hanno-anno.html',
})
export class HannoAnno {
  protected readonly tts = inject(Tts);

  protected readonly total = QUESTIONS_PER_ROUND;

  protected readonly sentences = signal(pickRound());
  protected readonly currentIndex = signal(0);
  protected readonly score = signal(0);
  protected readonly selected = signal<string | null>(null);
  protected readonly answered = signal(false);
  // Risposta data per ogni frase del round, per il riepilogo finale.
  protected readonly answers = signal<string[]>([]);
  // Tempo di risposta di ogni frase: dalla comparsa della frase alla scelta.
  protected readonly timedAnswers = signal<TimedAnswer[]>([]);
  protected readonly finalScore = computed(() => computeScore(this.timedAnswers()));
  protected readonly record = signal(readRecord());
  protected readonly isNewRecord = signal(false);
  private questionStart = Date.now();
  protected readonly summary = computed<SummaryWord[]>(() =>
    this.sentences().map(({ before, answer, after }, index) => ({
      prefix: before.endsWith("'") ? before : before + ' ',
      missing: answer,
      suffix: ' ' + after,
      given: this.answers()[index],
    })),
  );

  protected readonly isFinished = computed(() => this.currentIndex() >= this.total);
  protected readonly current = computed(() => this.sentences()[this.currentIndex()]);
  protected readonly isCorrect = computed(() => this.selected() === this.current().answer);

  // "Quest'" e "L'" vanno attaccati alla parola che segue.
  protected speakSentence(): void {
    const { before, answer, after } = this.current();
    const separator = before.endsWith("'") ? '' : ' ';
    this.tts.speak(`${before}${separator}${answer} ${after}`);
  }

  protected selectOption(option: string): void {
    if (this.answered()) {
      return;
    }
    this.selected.set(option);
    this.answered.set(true);
    this.answers.update((list) => [...list, option]);
    const seconds = (Date.now() - this.questionStart) / 1000;
    this.timedAnswers.update((list) => [...list, { correct: option === this.current().answer, seconds }]);
    if (option === this.current().answer) {
      this.score.update((value) => value + 1);
    }
  }

  protected next(): void {
    this.selected.set(null);
    this.answered.set(false);
    this.currentIndex.update((index) => index + 1);
    this.questionStart = Date.now();
    if (this.isFinished()) {
      this.checkRecord();
    }
  }

  private checkRecord(): void {
    const points = this.finalScore().total;
    this.isNewRecord.set(points > this.record());
    if (this.isNewRecord()) {
      this.record.set(points);
      saveRecord(points);
    }
  }

  protected restart(): void {
    this.sentences.set(pickRound());
    this.currentIndex.set(0);
    this.score.set(0);
    this.answers.set([]);
    this.timedAnswers.set([]);
    this.isNewRecord.set(false);
    this.questionStart = Date.now();
    this.selected.set(null);
    this.answered.set(false);
  }
}
