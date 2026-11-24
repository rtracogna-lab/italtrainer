-- Passaggio a Supabase Auth. Da eseguire una volta nell'SQL Editor di
-- Supabase DOPO aver creato gli account in Authentication > Users, uno per
-- ogni riga di public.users, con email <utente>@italtrainer.app (es.
-- nath17@italtrainer.app) e "Auto Confirm User" attivo.
--
-- Da qui in poi il server sa chi sta facendo la richiesta (auth.uid()): ogni
-- utente legge e scrive solo i suoi risultati e i suoi tornei, e la chiave
-- anon da sola non basta più per niente.
--
-- La vecchia app smette di funzionare appena eseguito lo script: va
-- pubblicata subito la nuova versione.

-- 1. Collegamento tra public.users e gli account di Supabase Auth.
alter table public.users add column if not exists auth_id uuid unique references auth.users (id) on delete set null;

-- Il nome utente è la parte dell'email prima della @.
create or replace function public.collega_account(p_auth_id uuid, p_email text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.users
  set auth_id = p_auth_id
  where lower(utente) = lower(split_part(p_email, '@', 1))
    and auth_id is null;
$$;

select public.collega_account(a.id, a.email) from auth.users a;

-- Gli account creati in futuro si collegano da soli.
create or replace function public.account_creato()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.collega_account(new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.account_creato();

revoke all on function public.collega_account(uuid, text) from public, anon, authenticated;
revoke all on function public.account_creato() from public, anon, authenticated;

-- 2. Utente collegato, ricavato dalla sessione e non da un parametro.
create or replace function public.utente_corrente()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select idf_user from public.users where auth_id = auth.uid();
$$;

revoke all on function public.utente_corrente() from public, anon;
grant execute on function public.utente_corrente() to authenticated;

-- Dati dell'utente collegato, per l'intestazione dell'app.
create or replace function public.profilo()
returns table (idf_user bigint, utente varchar)
language sql
stable
security definer
set search_path = public
as $$
  select u.idf_user, u.utente from public.users u where u.auth_id = auth.uid();
$$;

revoke all on function public.profilo() from public, anon;
grant execute on function public.profilo() to authenticated;

-- 3. Il vecchio login con la password in chiaro non serve più.
drop function if exists public.login(text, text);

-- 4. Risultati: si salvano solo a proprio nome.
drop policy if exists "risultati inseribili dall'app" on public.risultati;
create policy "risultati propri"
    on public.risultati for insert
    to authenticated
    with check (idf_user = public.utente_corrente());

-- 5. Classifica personale e giochi superati: l'utente viene dalla sessione.
drop function if exists public.migliori_risultati(bigint);
drop function if exists public.posizione_risultato(bigint, integer);
drop function if exists public.migliori_risultati_utente(bigint, bigint);
drop function if exists public.posizione_risultato_utente(bigint, bigint, integer);
drop function if exists public.giochi_superati(bigint);

create or replace function public.migliori_risultati_utente(p_idf_gioco bigint)
returns table (utente varchar, risultato integer, data_ora timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select u.utente, r.risultato, r.data_ora
  from public.risultati r
  join public.users u on u.idf_user = r.idf_user
  where r.idf_gioco = p_idf_gioco
    and r.idf_user = public.utente_corrente()
  order by r.risultato desc, r.data_ora asc
  limit 10;
$$;

create or replace function public.posizione_risultato_utente(p_idf_gioco bigint, p_risultato integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer + 1
  from public.risultati r
  where r.idf_gioco = p_idf_gioco
    and r.idf_user = public.utente_corrente()
    and r.risultato >= p_risultato;
$$;

create or replace function public.giochi_superati()
returns table (idf_gioco bigint, descrizione_gioco varchar, superato boolean)
language sql
stable
security definer
set search_path = public
as $$
  select g.idf_gioco, g.descrizione_gioco, coalesce(ug.superato = 1, false)
  from public.giochi g
  left join public.users_giochi ug
    on ug.idf_gioco = g.idf_gioco and ug.idf_user = public.utente_corrente()
  order by g.idf_gioco;
$$;

revoke all on function public.migliori_risultati_utente(bigint) from public, anon;
revoke all on function public.posizione_risultato_utente(bigint, integer) from public, anon;
revoke all on function public.giochi_superati() from public, anon;
grant execute on function public.migliori_risultati_utente(bigint) to authenticated;
grant execute on function public.posizione_risultato_utente(bigint, integer) to authenticated;
grant execute on function public.giochi_superati() to authenticated;

-- 6. Tornei: ognuno vede e modifica solo i suoi.
drop policy if exists "tornei usabili dall'app" on public.tornei;
drop policy if exists "squadre usabili dall'app" on public.tornei_squadre;
drop policy if exists "partite usabili dall'app" on public.tornei_partite;

create policy "tornei propri" on public.tornei
    for all to authenticated
    using (idf_user = public.utente_corrente())
    with check (idf_user = public.utente_corrente());

create policy "squadre dei tornei propri" on public.tornei_squadre
    for all to authenticated
    using (exists (select 1 from public.tornei t where t.idf_torneo = tornei_squadre.idf_torneo and t.idf_user = public.utente_corrente()))
    with check (exists (select 1 from public.tornei t where t.idf_torneo = tornei_squadre.idf_torneo and t.idf_user = public.utente_corrente()));

create policy "partite dei tornei propri" on public.tornei_partite
    for all to authenticated
    using (exists (select 1 from public.tornei t where t.idf_torneo = tornei_partite.idf_torneo and t.idf_user = public.utente_corrente()))
    with check (exists (select 1 from public.tornei t where t.idf_torneo = tornei_partite.idf_torneo and t.idf_user = public.utente_corrente()));

-- Verifica: ogni utente deve avere il suo auth_id. Una riga con auth_id
-- vuoto vuol dire che manca l'account (o che l'email è scritta diversa).
select u.idf_user, u.utente, u.auth_id, a.email
from public.users u
left join auth.users a on a.id = u.auth_id
order by u.idf_user;
