-- Soglia di superamento personale: per un utente un gioco può avere una
-- soglia diversa da quella di giochi.soglia. Qui si abbassa per nath17 su
-- tutti i giochi. Da eseguire una volta nell'SQL Editor di Supabase, dopo
-- superati.sql e nuovi-utenti.sql.

-- 1. Soglia personale: null = vale quella del gioco.
alter table public.users_giochi add column if not exists soglia integer;

-- 2. Il trigger usa la soglia personale, se c'è.
create or replace function public.segna_gioco_superato()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_soglia integer;
begin
  select coalesce(ug.soglia, g.soglia)
    into v_soglia
  from public.giochi g
  left join public.users_giochi ug
    on ug.idf_gioco = g.idf_gioco and ug.idf_user = new.idf_user
  where g.idf_gioco = new.idf_gioco;

  if new.risultato >= v_soglia then
    insert into public.users_giochi (idf_user, idf_gioco, superato, data_superato)
    values (new.idf_user, new.idf_gioco, 1, new.data_ora)
    on conflict (idf_user, idf_gioco) do update
      set superato = 1, data_superato = excluded.data_superato
      where public.users_giochi.superato = 0;
  end if;
  return new;
end;
$$;

-- 3. Soglie di nath17 su tutti i giochi di oggi. Giochi da 10 domande: 400
-- invece di 501 (3 errori bastano anche rispondendo lentamente). Giusto o
-- sbagliato (gioco 3): 10 invece di 15. Un gioco aggiunto in futuro avrà la
-- soglia normale finché non si rilancia questo passo.
insert into public.users_giochi (idf_user, idf_gioco, soglia)
select u.idf_user, g.idf_gioco, case when g.idf_gioco = 3 then 10 else 400 end
from public.users u
cross join public.giochi g
where u.utente = 'nath17'
on conflict (idf_user, idf_gioco) do update set soglia = excluded.soglia;

-- 4. Punteggi già salvati da nath17 che superano la nuova soglia.
update public.users_giochi ug
set superato = 1,
    data_superato = (
      select min(r.data_ora) from public.risultati r
      where r.idf_user = ug.idf_user and r.idf_gioco = ug.idf_gioco and r.risultato >= ug.soglia
    )
from public.users u
where u.idf_user = ug.idf_user
  and u.utente = 'nath17'
  and ug.superato = 0
  and exists (
    select 1 from public.risultati r
    where r.idf_user = ug.idf_user and r.idf_gioco = ug.idf_gioco and r.risultato >= ug.soglia
  );

-- Verifica: una riga per gioco con la soglia di nath17.
select g.descrizione_gioco, ug.soglia, ug.superato
from public.users_giochi ug
join public.users u on u.idf_user = ug.idf_user
join public.giochi g on g.idf_gioco = ug.idf_gioco
where u.utente = 'nath17'
order by g.idf_gioco;
