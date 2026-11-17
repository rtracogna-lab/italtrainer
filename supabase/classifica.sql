-- Da eseguire una volta nell'SQL Editor di Supabase, dopo risultati.
--
-- La tabella risultati non è leggibile con la chiave anon: la classifica di un
-- gioco si legge solo attraverso queste funzioni.

-- Versioni precedenti, con la classifica del singolo utente.
drop function if exists public.migliori_risultati(bigint, bigint);
drop function if exists public.posizione_risultato(bigint, bigint, integer);

-- I 10 migliori risultati di tutti gli utenti: a parità di punti vale chi l'ha
-- ottenuto prima.
create or replace function public.migliori_risultati(p_idf_gioco bigint)
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
  order by r.risultato desc, r.data_ora asc
  limit 10;
$$;

-- Posizione che avrebbe un nuovo punteggio nella classifica del gioco.
create or replace function public.posizione_risultato(p_idf_gioco bigint, p_risultato integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer + 1
  from public.risultati r
  where r.idf_gioco = p_idf_gioco
    and r.risultato >= p_risultato;
$$;

revoke all on function public.migliori_risultati(bigint) from public;
revoke all on function public.posizione_risultato(bigint, integer) from public;
grant execute on function public.migliori_risultati(bigint) to anon, authenticated;
grant execute on function public.posizione_risultato(bigint, integer) to anon, authenticated;
