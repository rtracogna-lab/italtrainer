import { TestBed } from '@angular/core/testing';
import { Auth, emailOf } from './auth';
import { supabase } from './supabase';

describe('Auth', () => {
  let auth: Auth;

  beforeEach(() => {
    localStorage.removeItem('italtrainer.user');
    TestBed.configureTestingModule({});
    auth = TestBed.inject(Auth);
  });

  afterEach(() => vi.restoreAllMocks());

  it('should build the account email from the user name', () => {
    expect(emailOf(' Nath17 ')).toBe('nath17@italtrainer.app');
  });

  it('should sign in with Supabase Auth and keep the profile', async () => {
    const signIn = vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({ data: {}, error: null } as any);
    vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: [{ idf_user: 3, utente: 'nath17' }], error: null } as any);

    expect(await auth.login('nath17', 'val02')).toBe(true);
    expect(signIn).toHaveBeenCalledWith({ email: 'nath17@italtrainer.app', password: 'val02' });
    expect(supabase.rpc).toHaveBeenCalledWith('profilo');
    expect(auth.user()).toEqual({ idf_user: 3, utente: 'nath17' });
    expect(JSON.parse(localStorage.getItem('italtrainer.user')!)).toEqual({ idf_user: 3, utente: 'nath17' });
  });

  it('should answer false on a wrong password', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
      data: {},
      error: { code: 'invalid_credentials', status: 400 },
    } as any);
    const rpc = vi.spyOn(supabase, 'rpc');

    expect(await auth.login('nath17', 'sbagliata')).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
    expect(auth.loggedIn()).toBe(false);
  });

  it('should refuse an account that is not linked to a user', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({ data: {}, error: null } as any);
    vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: [], error: null } as any);
    const signOut = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });

    await expect(auth.login('nessuno', 'x')).rejects.toThrow('non collegato');
    expect(signOut).toHaveBeenCalled();
    expect(auth.loggedIn()).toBe(false);
  });
});
