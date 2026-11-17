-- Da eseguire una volta nell'SQL Editor di Supabase.
--
-- La chiave "anon" usata dall'app è pubblica (finisce nel bundle JS), quindi
-- la tabella users NON deve essere leggibile direttamente: chiunque potrebbe
-- scaricare tutte le password. Si abilita RLS senza policy (nessun accesso
-- diretto) e si espone solo una funzione che verifica utente e password.

alter table public.users enable row level security;

create or replace function public.login(p_utente text, p_pwd text)
returns table (idf_user bigint, utente varchar)
language sql
security definer
set search_path = public
as $$
  select u.idf_user, u.utente
  from public.users u
  where u.utente = p_utente
    and u.pwd = p_pwd;
$$;

revoke all on function public.login(text, text) from public;
grant execute on function public.login(text, text) to anon, authenticated;
