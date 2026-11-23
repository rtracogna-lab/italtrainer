-- Nuovi utenti nath17 e manu17, con password uguale al nome utente.
-- Da eseguire una volta nell'SQL Editor di Supabase. Se un utente esiste già
-- non viene inserito di nuovo.
--
-- Si dà per scontato che idf_user si generi da solo (identity o serial). Se
-- invece va scritto a mano, usare la variante commentata qui sotto.
insert into public.users (utente, pwd)
select v.utente, v.pwd
from (values ('nath17', 'nath17'), ('manu17', 'manu17')) as v (utente, pwd)
where not exists (select 1 from public.users u where u.utente = v.utente);

-- Variante con idf_user calcolato (solo se l'insert sopra dà errore su
-- idf_user null):
--
-- insert into public.users (idf_user, utente, pwd)
-- select (select coalesce(max(idf_user), 0) from public.users) + row_number() over (), v.utente, v.pwd
-- from (values ('nath17', 'nath17'), ('manu17', 'manu17')) as v (utente, pwd)
-- where not exists (select 1 from public.users u where u.utente = v.utente);

-- Verifica: devono uscire le due righe.
select idf_user, utente from public.users where utente in ('nath17', 'manu17');
