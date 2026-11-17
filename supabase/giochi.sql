-- Anagrafica dei giochi. Da eseguire una volta nell'SQL Editor di Supabase.

create table public.giochi (
    idf_gioco bigint primary key,
    categoria varchar(3) not null check (categoria in ('ITA', 'MAT')),
    descrizione_gioco varchar(100) not null unique
);

-- L'elenco dei giochi non è riservato: chiunque può leggerlo, nessuno può
-- modificarlo con la chiave anon.
alter table public.giochi enable row level security;

create policy "giochi leggibili da tutti"
    on public.giochi for select
    to anon, authenticated
    using (true);

insert into public.giochi (idf_gioco, categoria, descrizione_gioco) values
    (1,  'ITA', 'Doppie'),
    (2,  'ITA', 'Hanno / Anno'),
    (3,  'ITA', 'Giusto o sbagliato?'),
    (4,  'ITA', 'Parole Unite'),
    (5,  'ITA', 'Spezza le Parole'),
    (6,  'ITA', 'Ricostruisci la Frase'),
    (7,  'ITA', 'Qui Quo Qua'),
    (8,  'ITA', 'Ce, Cie, Ge, Gie'),
    (9,  'ITA', 'Lettera mancante'),
    (10, 'ITA', 'Costruisci con le sillabe');
