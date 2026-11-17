import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Stemma } from '../../../shared/stemma/stemma';
import { Tts } from '../../../shared/tts';
import { pickMatchQuestions } from '../../partita/domande';
import { Opponent } from '../../partita/partita';
import { esitoRigori, RIGORE_SEGNATO, RIGORI_PER_SQUADRA } from '../regole';

export interface PenaltyResult {
  scoredFor: number;
  scoredAgainst: number;
}

const QUESTIONS_PER_BATCH = 10;

// Rigori a domande: ogni tiro del giocatore è una domanda (giusta = gol), gli
// avversari segnano a caso. Prima i 5 tiri a testa, poi a oltranza.
@Component({
  imports: [Stemma],
  selector: 'app-rigori',
  styleUrl: './rigori.scss',
  templateUrl: './rigori.html',
})
export class Rigori {
  readonly teamName = input.required<string>();
  readonly rival = input.required<Opponent>();
  readonly ended = output<PenaltyResult>();

  protected readonly tts = inject(Tts);
  protected readonly slots = Array.from({ length: RIGORI_PER_SQUADRA }, (_, index) => index);

  protected readonly questions = signal(pickMatchQuestions(QUESTIONS_PER_BATCH));
  protected readonly ours = signal<boolean[]>([]);
  protected readonly theirs = signal<boolean[]>([]);
  protected readonly selected = signal<string | null>(null);

  protected readonly current = computed(() => this.questions()[this.ours().length]);
  // Dopo il nostro tiro tocca a loro, finché non è deciso.
  protected readonly theirTurn = computed(() => this.ours().length > this.theirs().length);
  protected readonly winner = computed(() => esitoRigori(this.ours(), this.theirs()));
  protected readonly lastOurs = computed(() => this.ours().at(-1));
  protected readonly lastTheirs = computed(() => this.theirs().at(-1));
  protected readonly suddenDeath = computed(() => this.theirs().length >= RIGORI_PER_SQUADRA);

  // Sostituibile nei test per decidere i tiri degli avversari.
  private random = Math.random;

  protected speak(): void {
    const { prefix, missing, suffix } = this.current();
    this.tts.speak(prefix + missing + suffix);
  }

  protected shoot(option: string): void {
    if (this.theirTurn() || this.winner()) {
      return;
    }
    this.selected.set(option);
    // La domanda appena tirata resta a schermo con l'esito.
    if (this.ours().length + 1 >= this.questions().length) {
      this.questions.update((list) => [...list, ...pickMatchQuestions(QUESTIONS_PER_BATCH)]);
    }
    this.ours.update((list) => [...list, option === this.current().missing]);
    this.checkEnd();
  }

  protected theyShoot(): void {
    if (!this.theirTurn() || this.winner()) {
      return;
    }
    this.selected.set(null);
    this.theirs.update((list) => [...list, this.random() < RIGORE_SEGNATO]);
    this.checkEnd();
  }

  private checkEnd(): void {
    if (this.winner()) {
      this.ended.emit({
        scoredFor: this.ours().filter(Boolean).length,
        scoredAgainst: this.theirs().filter(Boolean).length,
      });
    }
  }
}
