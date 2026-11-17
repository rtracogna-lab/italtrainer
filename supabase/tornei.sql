-- Tornei di calcio: 8 squadre in due gironi da 4, poi semifinali e finale.
-- Da eseguire una volta nell'SQL Editor di Supabase, dopo users.

-- Anagrafica del torneo.
create table public.tornei (
    idf_torneo bigint generated always as identity primary key,
    idf_user bigint not null references public.users (idf_user) on delete cascade,
    nome varchar(100) not null,
    data_creazione timestamptz not null default now(),
    stato varchar(10) not null default 'in_corso' check (stato in ('in_corso', 'concluso')),
    -- Come è andata la squadra del giocatore, a torneo concluso.
    piazzamento varchar(50)
);

create index tornei_user_idx on public.tornei (idf_user);

-- Le 8 squadre del torneo: una è quella del giocatore.
create table public.tornei_squadre (
    idf_squadra bigint generated always as identity primary key,
    idf_torneo bigint not null references public.tornei (idf_torneo) on delete cascade,
    nome varchar(50) not null,
    stemma varchar(10) not null,
    girone char(1) not null check (girone in ('A', 'B')),
    giocatore boolean not null default false
);

create index tornei_squadre_torneo_idx on public.tornei_squadre (idf_torneo);

-- Dettaglio del torneo: le partite. Turni 1-3 = giornate dei gironi,
-- 4 = semifinali, 5 = finale. I gol restano null finché non si gioca.
create table public.tornei_partite (
    idf_partita bigint generated always as identity primary key,
    idf_torneo bigint not null references public.tornei (idf_torneo) on delete cascade,
    fase varchar(2) not null check (fase in ('A', 'B', 'SF', 'F')),
    turno smallint not null check (turno between 1 and 5),
    idf_casa bigint not null references public.tornei_squadre (idf_squadra) on delete cascade,
    idf_ospite bigint not null references public.tornei_squadre (idf_squadra) on delete cascade,
    gol_casa integer,
    gol_ospite integer,
    rigori_casa integer,
    rigori_ospite integer,
    data_ora timestamptz
);

create index tornei_partite_torneo_idx on public.tornei_partite (idf_torneo);

-- L'app non usa Supabase Auth: come per risultati, chi ha la chiave anon può
-- leggere e scrivere i tornei. Non contengono dati riservati.
alter table public.tornei enable row level security;
alter table public.tornei_squadre enable row level security;
alter table public.tornei_partite enable row level security;

create policy "tornei usabili dall'app" on public.tornei
    for all to anon, authenticated using (true) with check (true);
create policy "squadre usabili dall'app" on public.tornei_squadre
    for all to anon, authenticated using (true) with check (true);
create policy "partite usabili dall'app" on public.tornei_partite
    for all to anon, authenticated using (true) with check (true);
