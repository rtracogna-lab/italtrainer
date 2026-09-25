import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { shuffle } from '../../shared/shuffle';

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

const SENTENCES: HannoAnnoSentence[] = [...HANNO_ANNO_SENTENCES, ...HA_A_SENTENCES];
const QUESTIONS_PER_ROUND = 10;

function pickRound(): HannoAnnoSentence[] {
  return shuffle(SENTENCES).slice(0, QUESTIONS_PER_ROUND);
}

@Component({
  imports: [RouterLink],
  selector: 'app-hanno-anno',
  styleUrl: './hanno-anno.scss',
  templateUrl: './hanno-anno.html',
})
export class HannoAnno {
  protected readonly total = QUESTIONS_PER_ROUND;

  protected readonly sentences = signal(pickRound());
  protected readonly currentIndex = signal(0);
  protected readonly score = signal(0);
  protected readonly selected = signal<string | null>(null);
  protected readonly answered = signal(false);

  protected readonly isFinished = computed(() => this.currentIndex() >= this.total);
  protected readonly current = computed(() => this.sentences()[this.currentIndex()]);
  protected readonly isCorrect = computed(() => this.selected() === this.current().answer);

  protected selectOption(option: string): void {
    if (this.answered()) {
      return;
    }
    this.selected.set(option);
    this.answered.set(true);
    if (option === this.current().answer) {
      this.score.update((value) => value + 1);
    }
  }

  protected next(): void {
    this.selected.set(null);
    this.answered.set(false);
    this.currentIndex.update((index) => index + 1);
  }

  protected restart(): void {
    this.sentences.set(pickRound());
    this.currentIndex.set(0);
    this.score.set(0);
    this.selected.set(null);
    this.answered.set(false);
  }
}
