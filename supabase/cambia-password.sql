-- Cambio della password di un utente, con Supabase Auth. Da eseguire
-- nell'SQL Editor di Supabase: cambiare nome utente e nuova password qui sotto.
-- La password viene salvata cifrata (bcrypt), come fa Supabase Auth.
update auth.users
set encrypted_password = extensions.crypt('nuova-password', extensions.gen_salt('bf')),
    updated_at = now()
where email = 'nath17@italtrainer.app';

-- Per rinominare un utente vanno cambiati sia il nome che l'email:
-- update public.users set utente = 'dani17' where utente = 'ieie17';
-- update auth.users set email = 'dani17@italtrainer.app' where email = 'ieie17@italtrainer.app';
