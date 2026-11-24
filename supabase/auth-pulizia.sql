-- Da eseguire dopo auth.sql, quando l'accesso con la nuova app funziona per
-- tutti: le password in chiaro non servono più, ora le tiene Supabase Auth
-- (cifrate).
alter table public.users drop column if exists pwd;

-- Le password si cambiano da qui in poi con cambia-password.sql.
