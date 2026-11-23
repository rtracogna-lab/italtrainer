-- Classifica personale: i migliori risultati del solo utente collegato.
-- Da eseguire una volta nell'SQL Editor di Supabase, dopo classifica.sql.
--
-- Come per classifica.sql, risultati non è leggibile con la chiave anon: si
-- passa da queste funzioni. Le versioni con tutti gli utenti restano, ma
-- l'app non le usa più.

-- I 10 migliori risultati dell'utente in un gioco: a parità di punti vale
-- quello ottenuto prima.
create or replace function public.migliori_risultati_utente(p_idf_gioco bigint, p_idf_user bigint)
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
    and r.idf_user = p_idf_user
  order by r.risultato desc, r.data_ora asc
  limit 10;
$$;

-- Posizione che avrebbe un nuovo punteggio tra i risultati dell'utente.
create or replace function public.posizione_risultato_utente(p_idf_gioco bigint, p_idf_user bigint, p_risultato integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer + 1
  from public.risultati r
  where r.idf_gioco = p_idf_gioco
    and r.idf_user = p_idf_user
    and r.risultato >= p_risultato;
$$;

revoke all on function public.migliori_risultati_utente(bigint, bigint) from public;
revoke all on function public.posizione_risultato_utente(bigint, bigint, integer) from public;
grant execute on function public.migliori_risultati_utente(bigint, bigint) to anon, authenticated;
grant execute on function public.posizione_risultato_utente(bigint, bigint, integer) to anon, authenticated;
