import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth';

@Component({
  imports: [FormsModule],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  protected utente = '';
  protected pwd = '';
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected async submit(): Promise<void> {
    if (!this.utente.trim() || !this.pwd) {
      this.error.set('Inserisci utente e password.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const ok = await this.auth.login(this.utente.trim(), this.pwd);
      if (ok) {
        await this.router.navigateByUrl('/');
      } else {
        this.error.set('Utente o password non corretti.');
      }
    } catch {
      this.error.set('Impossibile collegarsi al server. Riprova.');
    } finally {
      this.loading.set(false);
    }
  }
}
