import { Injectable, computed, signal } from '@angular/core';
import { supabase } from './supabase';

export interface User {
  idf_user: number;
  utente: string;
}

const STORAGE_KEY = 'italtrainer.user';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly current = signal<User | null>(readStoredUser());

  readonly user = this.current.asReadonly();
  readonly loggedIn = computed(() => this.current() !== null);

  /** Restituisce true se utente e password sono corretti. */
  async login(utente: string, pwd: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('login', { p_utente: utente, p_pwd: pwd });
    if (error) {
      throw error;
    }
    const user = (data as User[])[0];
    if (!user) {
      return false;
    }
    this.current.set(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {}
    return true;
  }

  logout(): void {
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
