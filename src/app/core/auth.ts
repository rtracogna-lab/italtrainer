import { Injectable, computed, signal } from '@angular/core';
import { supabase } from './supabase';

export interface User {
  idf_user: number;
  utente: string;
}

const STORAGE_KEY = 'italtrainer.user';
// Gli account di Supabase Auth hanno un'email: si costruisce dal nome utente,
// così i bambini scrivono solo "nath17" (supabase/auth.sql).
export const EMAIL_DOMAIN = 'italtrainer.app';

export function emailOf(utente: string): string {
  return `${utente.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  // Nome e id restano anche nel browser, per mostrarli subito all'avvio; la
  // sessione vera è quella di Supabase Auth.
  private readonly current = signal<User | null>(readStoredUser());

  readonly user = this.current.asReadonly();
  readonly loggedIn = computed(() => this.current() !== null);

  // La home propone l'accesso solo al primo caricamento dell'app, non ogni
  // volta che ci si torna da un gioco.
  loginPromptShown = false;

  constructor() {
    // Utente rimasto nel browser senza sessione (es. dalla vecchia app, o
    // sessione scaduta): va rifatto l'accesso.
    const stored = this.current();
    if (stored) {
      void supabase.auth.getSession().then(({ data }) => {
        if (!data.session && this.current() === stored) {
          this.clear();
        }
      });
    }
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        this.clear();
      }
    });
  }

  /** Restituisce true se utente e password sono corretti. */
  async login(utente: string, pwd: string): Promise<boolean> {
    const { error } = await supabase.auth.signInWithPassword({ email: emailOf(utente), password: pwd });
    if (error) {
      if (error.code === 'invalid_credentials' || error.status === 400) {
        return false;
      }
      throw error;
    }
    const { data, error: profileError } = await supabase.rpc('profilo');
    if (profileError) {
      throw profileError;
    }
    const user = (data as User[])[0];
    if (!user) {
      // Account senza riga in users: non si può giocare a suo nome.
      await supabase.auth.signOut();
      throw new Error(`Account ${utente} non collegato a nessun utente`);
    }
    this.current.set(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {}
    return true;
  }

  logout(): void {
    this.clear();
    void supabase.auth.signOut();
  }

  private clear(): void {
    this.current.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
}

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
