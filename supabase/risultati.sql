-- Risultati delle partite. Da eseguire una volta nell'SQL Editor di Supabase,
-- dopo users e giochi.

create table public.risultati (
    idf_risultato bigint generated always as identity primary key,
    idf_user bigint not null references public.users (idf_user) on delete cascade,
    idf_gioco bigint not null references public.giochi (idf_gioco),
    data_ora timestamptz not null default now(),
    risultato integer not null
);

create index risultati_user_gioco_idx on public.risultati (idf_user, idf_gioco);

-- L'app può registrare risultati ma non leggere quelli degli altri.
alter table public.risultati enable row level security;

create policy "risultati inseribili dall'app"
    on public.risultati for insert
    to anon, authenticated
    with check (true);
