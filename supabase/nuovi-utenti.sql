-- Nuovi utenti nath17 e manu17, con password uguale al nome utente.
-- Da eseguire una volta nell'SQL Editor di Supabase. Se un utente esiste già
-- non viene inserito di nuovo.
--
-- idf_user non si genera da solo: si parte dal più alto già presente.
insert into public.users (idf_user, utente, pwd)
select (select coalesce(max(idf_user), 0) from public.users) + row_number() over (), v.utente, v.pwd
from (values ('nath17', 'nath17'), ('manu17', 'manu17')) as v (utente, pwd)
where not exists (select 1 from public.users u where u.utente = v.utente);

-- Verifica: devono uscire le due righe.
select idf_user, utente from public.users where utente in ('nath17', 'manu17');
