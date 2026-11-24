-- Cambio di nomi utente e password. Da eseguire una volta nell'SQL Editor di
-- Supabase.
--   ieie17 -> dani17, password val01
--   nath17: password val02
--   manu17: password val03
-- idf_user non cambia, quindi risultati, giochi superati, soglie personali e
-- tornei restano all'utente.

-- Se dani17 esiste già il rinomino fallirebbe con due utenti uguali: meglio
-- fermarsi prima.
do $$
begin
  if exists (select 1 from public.users where utente = 'dani17') then
    raise exception 'Esiste già un utente dani17: niente modifiche.';
  end if;
end;
$$;

update public.users set utente = 'dani17', pwd = 'val01' where utente = 'ieie17';
update public.users set pwd = 'val02' where utente = 'nath17';
update public.users set pwd = 'val03' where utente = 'manu17';

-- Verifica: devono uscire dani17, nath17 e manu17 con le nuove password.
select idf_user, utente, pwd from public.users where utente in ('dani17', 'nath17', 'manu17', 'ieie17') order by idf_user;
