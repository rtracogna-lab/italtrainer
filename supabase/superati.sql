-- Giochi superati: per ogni utente e gioco un flag che passa a 1 la prima volta
-- che in risultati arriva un punteggio >= della soglia del gioco.
-- Da eseguire una volta nell'SQL Editor di Supabase, dopo risultati.

-- Soglia di ogni gioco. Per i giochi a 10 domande (shared/punteggio.ts: 100
-- punti a risposta giusta, fino a 50 di bonus velocità, -100 a errore) con 4
-- errori si fanno al massimo 6 * 150 - 400 = 500 punti: da 501 in su gli
-- errori sono per forza 3 o meno. Con 3 errori si va da 400 a 750, quindi
-- serve anche un po' di velocità (almeno 101 punti di bonus).
-- Giusto o sbagliato è a tempo (giuste - sbagliate in 60 secondi): il numero
-- di errori non si ricava dal punteggio, 15 vale ad esempio 18 giuste e 3
-- sbagliate.
alter table public.giochi add column soglia integer;

update public.giochi set soglia = 501 where idf_gioco <> 3;
update public.giochi set soglia = 15 where idf_gioco = 3;

alter table public.giochi alter column soglia set not null;

-- Flag per utente e gioco. Nessuna riga (o superato = 0) = non ancora superato.
create table public.users_giochi (
    idf_user bigint not null references public.users (idf_user) on delete cascade,
    idf_gioco bigint not null references public.giochi (idf_gioco),
    superato smallint not null default 0 check (superato in (0, 1)),
    data_superato timestamptz,
    primary key (idf_user, idf_gioco)
);

-- Come risultati: nessun accesso diretto con la chiave anon. Il flag lo
-- scrive solo il trigger qui sotto.
alter table public.users_giochi enable row level security;

-- security definer: l'insert in risultati arriva dalla chiave anon, che non
-- può scrivere in users_giochi.
create or replace function public.segna_gioco_superato()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.risultato >= (select g.soglia from public.giochi g where g.idf_gioco = new.idf_gioco) then
    insert into public.users_giochi (idf_user, idf_gioco, superato, data_superato)
    values (new.idf_user, new.idf_gioco, 1, new.data_ora)
    on conflict (idf_user, idf_gioco) do update
      set superato = 1, data_superato = excluded.data_superato
      where public.users_giochi.superato = 0;
  end if;
  return new;
end;
$$;

revoke all on function public.segna_gioco_superato() from public;

create trigger risultati_segna_superato
    after insert on public.risultati
    for each row execute function public.segna_gioco_superato();

-- Risultati già salvati prima del trigger.
insert into public.users_giochi (idf_user, idf_gioco, superato, data_superato)
select r.idf_user, r.idf_gioco, 1, min(r.data_ora)
from public.risultati r
join public.giochi g on g.idf_gioco = r.idf_gioco
where r.risultato >= g.soglia
group by r.idf_user, r.idf_gioco
on conflict (idf_user, idf_gioco) do nothing;

-- Stato di tutti i giochi per un utente: superato = false anche se non c'è
-- ancora la riga in users_giochi. Come per i tornei, il dato non è riservato.
create or replace function public.giochi_superati(p_idf_user bigint)
returns table (idf_gioco bigint, descrizione_gioco varchar, superato boolean)
language sql
stable
security definer
set search_path = public
as $$
  select g.idf_gioco, g.descrizione_gioco, coalesce(ug.superato = 1, false)
  from public.giochi g
  left join public.users_giochi ug
    on ug.idf_gioco = g.idf_gioco and ug.idf_user = p_idf_user
  order by g.idf_gioco;
$$;

revoke all on function public.giochi_superati(bigint) from public;
grant execute on function public.giochi_superati(bigint) to anon, authenticated;
