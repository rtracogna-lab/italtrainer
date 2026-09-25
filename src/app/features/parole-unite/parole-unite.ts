import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { shuffle } from '../../shared/shuffle';

interface SplitSentence {
  before: string;
  after: string;
  answer: string;
  options: string[];
}

// Frasi che allenano l'unione/separazione delle parole. Ogni voce ha 3
// opzioni: la forma corretta, l'errore opposto (attaccata quando va
// staccata o viceversa) e un refuso con una lettera mancante, per
// collegarsi anche al problema delle lettere dimenticate.
// Nei primi 12 casi la forma corretta è quella UNITA (es. "delle").
// Negli ultimi 6 casi, invece, la forma corretta è quella STACCATA
// (es. "per favore"): non sempre attaccare le parole è giusto!
const SENTENCES: SplitSentence[] = [
  {
    before: 'Ho mangiato',
    after: 'fragole buonissime.',
    answer: 'delle',
    options: ['delle', 'de le', 'dele'],
  },
  {
    before: 'Il libro è',
    after: 'sedia della cucina.',
    answer: 'sulla',
    options: ['sulla', 'su la', 'sula'],
  },
  {
    before: 'Il gatto dorme',
    after: 'sua cesta preferita.',
    answer: 'nella',
    options: ['nella', 'ne la', 'nela'],
  },
  {
    before: 'Questo è il colore',
    after: 'zaino di Marco.',
    answer: 'dello',
    options: ['dello', 'de lo', 'delo'],
  },
  {
    before: 'Il cane aspetta',
    after: 'alla porta di casa.',
    answer: 'davanti',
    options: ['davanti', 'da vanti', 'davani'],
  },
  {
    before: 'Vorrei giocare fuori, ma',
    after: 'piove.',
    answer: 'purtroppo',
    options: ['purtroppo', 'pur troppo', 'purtropo'],
  },
  {
    before: 'Mi piace il gelato,',
    after: 'al cioccolato.',
    answer: 'soprattutto',
    options: ['soprattutto', 'sopra tutto', 'sopratutto'],
  },
  {
    before: 'Hai voglia di mangiare',
    after: 'di dolce?',
    answer: 'qualcosa',
    options: ['qualcosa', 'qual cosa', 'quacosa'],
  },
  {
    before: 'Ho sentito che',
    after: 'ha suonato il campanello.',
    answer: 'qualcuno',
    options: ['qualcuno', 'qual cuno', 'quacuno'],
  },
  {
    before: 'Se piove domani,',
    after: 'restiamo a casa.',
    answer: 'allora',
    options: ['allora', 'al lora', 'alora'],
  },
  {
    before: 'Sei',
    after: 'molto bravo in matematica!',
    answer: 'davvero',
    options: ['davvero', 'da vero', 'davero'],
  },
  {
    before: 'Dopo la festa, la stanza era',
    after: 'e piena di scatole.',
    answer: 'sottosopra',
    options: ['sottosopra', 'sotto sopra', 'sotosopra'],
  },
  {
    before: 'Passami il libro,',
    after: 'devo studiare.',
    answer: 'per favore',
    options: ['per favore', 'perfavore', 'per favre'],
  },
  {
    before: 'Il compito di oggi',
    after: 'complicato.',
    answer: 'non è',
    options: ['non è', 'nonè', 'no è'],
  },
  {
    before: 'Dopo la scuola andiamo subito',
    after: 'per pranzare.',
    answer: 'a casa',
    options: ['a casa', 'acasa', 'a caa'],
  },
  {
    before: 'Voglio rileggere',
    after: 'questo libro divertente.',
    answer: 'di nuovo',
    options: ['di nuovo', 'dinuovo', 'di nuvo'],
  },
  {
    before: 'Ho fatto i compiti',
    after: 'per andare a giocare.',
    answer: 'in fretta',
    options: ['in fretta', 'infretta', 'in freta'],
  },
  {
    before: "D'inverno,",
    after: 'nevica anche in città.',
    answer: 'a volte',
    options: ['a volte', 'avolte', 'a vote'],
  },
];

const QUESTIONS_PER_ROUND = 10;

function pickRound(): SplitSentence[] {
  return shuffle(SENTENCES).slice(0, QUESTIONS_PER_ROUND);
}

@Component({
  imports: [RouterLink],
  selector: 'app-parole-unite',
  styleUrl: './parole-unite.scss',
  templateUrl: './parole-unite.html',
})
export class ParoleUnite {
  protected readonly total = QUESTIONS_PER_ROUND;

  protected readonly sentences = signal(pickRound());
  protected readonly currentIndex = signal(0);
  protected readonly score = signal(0);
  protected readonly selected = signal<string | null>(null);
  protected readonly answered = signal(false);

  protected readonly isFinished = computed(() => this.currentIndex() >= this.total);
  protected readonly current = computed(() => this.sentences()[this.currentIndex()]);
  protected readonly shuffledOptions = computed(() => shuffle(this.current().options));
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
