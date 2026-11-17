import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/auth';
import { Torneo } from '../regole';
import { TorneiDb } from '../tornei-db';

function oggi(): string {
  return new Date().toLocaleDateString('it-IT');
}

// Elenco dei tornei dell'utente collegato e creazione di uno nuovo.
@Component({
  imports: [DatePipe, FormsModule, RouterLink],
  selector: 'app-elenco-tornei',
  styleUrl: './elenco.scss',
  templateUrl: './elenco.html',
})
export class ElencoTornei implements OnInit {
  protected readonly auth = inject(Auth);
  private readonly db = inject(TorneiDb);
  private readonly router = inject(Router);

  protected nome = `Torneo del ${oggi()}`;
  protected nomeSquadra = 'Valnatisone';
  protected readonly tornei = signal<Torneo[]>([]);
  protected readonly loading = signal(true);
  protected readonly creating = signal(false);
  protected readonly error = signal('');
  // Torneo di cui si sta chiedendo conferma per l'eliminazione.
  protected readonly confirming = signal<number | null>(null);
  protected readonly deleting = signal(false);

  async ngOnInit(): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      this.loading.set(false);
      return;
    }
    try {
      this.tornei.set(await this.db.elenco(user.idf_user));
    } catch {
      this.error.set('Impossibile collegarsi al server. Riprova più tardi.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async remove(idfTorneo: number): Promise<void> {
    if (this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.error.set('');
    try {
      await this.db.elimina(idfTorneo);
      this.tornei.update((list) => list.filter((torneo) => torneo.idf_torneo !== idfTorneo));
      this.confirming.set(null);
    } catch {
      this.error.set('Impossibile eliminare il torneo. Riprova più tardi.');
    } finally {
      this.deleting.set(false);
    }
  }

  protected async create(): Promise<void> {
    const user = this.auth.user();
    if (!user || this.creating()) {
      return;
    }
    if (!this.nome.trim() || !this.nomeSquadra.trim()) {
      this.error.set('Dai un nome al torneo e alla tua squadra.');
      return;
    }
    this.creating.set(true);
    this.error.set('');
    try {
      const id = await this.db.crea(user.idf_user, this.nome.trim(), this.nomeSquadra.trim());
      await this.router.navigate(['/torneo', id]);
    } catch {
      this.error.set('Impossibile creare il torneo. Riprova più tardi.');
      this.creating.set(false);
    }
  }
}
