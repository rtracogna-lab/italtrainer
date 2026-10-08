import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PAROLE_DIFFICILI, ParolaDifficile } from '../../shared/parole-difficili';
import { RoundSummary, SummaryWord } from '../../shared/round-summary/round-summary';
import { shuffle } from '../../shared/shuffle';
import { Tts } from '../../shared/tts';

interface Tile {
  id: number;
  text: string;
}

interface SyllableItem {
  word: string;
  tiles: Tile[];
}

const DISTRACTORS_PER_WORD = 2;
const QUESTIONS_PER_ROUND = 10;

// Sillabe "trappola": una sillaba vera con una lettera in meno ("pr" al posto
// di "per"), proprio l'errore che si vuole allenare.
function distractors({ syllables }: ParolaDifficile): string[] {
  const variants = new Set<string>();
  for (const syllable of syllables) {
    for (let i = 0; i < syllable.length && syllable.length > 1; i++) {
      variants.add(syllable.slice(0, i) + syllable.slice(i + 1));
    }
  }
  // Le trappole di una sola lettera ("o", "d") sarebbero troppo facili.
  const traps = [...variants].filter((variant) => variant.length > 1 && !syllables.includes(variant));
  return shuffle(traps).slice(0, DISTRACTORS_PER_WORD);
}

function buildItem(parola: ParolaDifficile): SyllableItem {
  const texts = shuffle([...parola.syllables, ...distractors(parola)]);
  return { word: parola.word, tiles: texts.map((text, id) => ({ id, text })) };
}

function pickRound(): SyllableItem[] {
  return shuffle(PAROLE_DIFFICILI).slice(0, QUESTIONS_PER_ROUND).map(buildItem);
}

// La voce dice una parola e il bambino la compone toccando le sillabe giuste,
// evitando quelle a cui manca una lettera.
@Component({
  imports: [RouterLink, RoundSummary],
  selector: 'app-sillabe',
  styleUrl: './sillabe.scss',
  templateUrl: './sillabe.html',
})
export class Sillabe {
  protected readonly tts = inject(Tts);
  protected readonly total = QUESTIONS_PER_ROUND;

  protected readonly items = signal(pickRound());
  protected readonly currentIndex = signal(0);
  protected readonly score = signal(0);
  // Sillabe scelte, in ordine (id delle tessere).
  protected readonly built = signal<number[]>([]);
  protected readonly checked = signal(false);
  // Primo tentativo sbagliato: l'errore resta registrato, ma si può riprovare
  // una volta.
  protected readonly firstWrong = signal<string | null>(null);
  protected readonly answers = signal<{ given: string; note?: string }[]>([]);

  protected readonly isFinished = computed(() => this.currentIndex() >= this.total);
  protected readonly current = computed(() => this.items()[this.currentIndex()]);
  protected readonly builtTiles = computed(() =>
    this.built().map((id) => this.current().tiles.find((tile) => tile.id === id)!),
  );
  protected readonly builtWord = computed(() => this.builtTiles().map((tile) => tile.text).join(''));
  protected readonly isCorrect = computed(() => this.builtWord() === this.current().word);

  protected readonly summary = computed<SummaryWord[]>(() =>
    this.items().map(({ word }, i) => ({
      prefix: '',
      missing: word,
      suffix: '',
      given: this.answers()[i]?.given ?? '',
      note: this.answers()[i]?.note,
    })),
  );

  protected speakWord(): void {
    this.tts.speak(this.current().word);
  }

  protected isUsed(tile: Tile): boolean {
    return this.built().includes(tile.id);
  }

  protected addTile(tile: Tile): void {
    if (this.checked() || this.isUsed(tile)) {
      return;
    }
    this.built.update((ids) => [...ids, tile.id]);
  }

  protected removeTile(position: number): void {
    if (this.checked()) {
      return;
    }
    this.built.update((ids) => ids.filter((_, index) => index !== position));
  }

  protected check(): void {
    if (this.checked() || this.built().length === 0) {
      return;
    }
    const firstWrong = this.firstWrong();
    if (this.isCorrect()) {
      // Il punto vale solo se giusta al primo tentativo.
      if (firstWrong === null) {
        this.score.update((value) => value + 1);
      }
      this.record(
        firstWrong === null
          ? { given: this.builtWord() }
          : { given: firstWrong, note: `avevi scritto “${firstWrong}”, poi l'hai corretta` },
      );
    } else if (firstWrong === null) {
      this.firstWrong.set(this.builtWord());
    } else {
      this.record({ given: firstWrong, note: `avevi scritto “${firstWrong}” e poi “${this.builtWord()}”` });
    }
  }

  private record(answer: { given: string; note?: string }): void {
    this.checked.set(true);
    this.answers.update((list) => [...list, answer]);
  }

  protected next(): void {
    this.built.set([]);
    this.firstWrong.set(null);
    this.checked.set(false);
    this.currentIndex.update((index) => index + 1);
    if (!this.isFinished()) {
      this.speakWord();
    }
  }

  protected restart(): void {
    this.items.set(pickRound());
    this.currentIndex.set(0);
    this.score.set(0);
    this.answers.set([]);
    this.firstWrong.set(null);
    this.built.set([]);
    this.checked.set(false);
  }
}
