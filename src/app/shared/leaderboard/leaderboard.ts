import { DatePipe } from '@angular/common';
import { Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { Auth } from '../../core/auth';
import { Risultati } from '../../core/risultati';

const LEADERBOARD_SIZE = 10;

export interface LeaderboardRow {
  position: number;
  user: string;
  points: number;
  // Data ISO; null per il punteggio appena fatto e non ancora salvato.
  date: string | null;
  isNew: boolean;
}

// Migliori risultati dell'utente collegato per un gioco, con il nuovo punteggio
// al suo posto e il pulsante per salvarlo. Si vede solo dopo l'accesso; va
// creato a fine partita, così "Ricomincia" lo distrugge e lo azzera.
@Component({
  imports: [DatePipe],
  selector: 'app-leaderboard',
  styleUrl: './leaderboard.scss',
  templateUrl: './leaderboard.html',
})
export class Leaderboard implements OnInit, OnDestroy {
  // idf_gioco della tabella giochi.
  readonly game = input.required<number>();
  readonly points = input.required<number>();

  protected readonly auth = inject(Auth);
  private readonly risultati = inject(Risultati);

  protected readonly rows = signal<LeaderboardRow[]>([]);
  protected readonly newPosition = signal(0);
  protected readonly state = signal<'loading' | 'ready' | 'saving' | 'saved' | 'error'>('loading');
  // Scarta le risposte del server arrivate dopo un "Ricomincia".
  private destroyed = false;

  ngOnInit(): void {
    void this.load();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  private async load(): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      return;
    }
    const points = this.points();
    try {
      const { migliori, posizione } = await this.risultati.classifica(this.game(), user.idf_user, points);
      if (this.destroyed) {
        return;
      }
      const rows: LeaderboardRow[] = migliori.map((item) => ({
        position: 0,
        user: item.utente,
        points: item.risultato,
        date: item.data_ora,
        isNew: false,
      }));
      rows.splice(posizione - 1, 0, { position: 0, user: user.utente, points, date: null, isNew: true });
      this.rows.set(rows.slice(0, LEADERBOARD_SIZE).map((row, index) => ({ ...row, position: index + 1 })));
      this.newPosition.set(posizione);
      this.state.set('ready');
    } catch {
      if (!this.destroyed) {
        this.state.set('error');
      }
    }
  }

  protected async save(): Promise<void> {
    const user = this.auth.user();
    if (!user || this.state() !== 'ready') {
      return;
    }
    this.state.set('saving');
    try {
      await this.risultati.salva(user.idf_user, this.game(), this.points());
      if (this.destroyed) {
        return;
      }
      const now = new Date().toISOString();
      this.rows.update((rows) => rows.map((row) => (row.isNew ? { ...row, date: now } : row)));
      this.state.set('saved');
    } catch {
      if (!this.destroyed) {
        this.state.set('error');
      }
    }
  }
}
