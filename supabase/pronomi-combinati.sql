-- Nuovo gioco: Pronomi combinati (glielo, gliela, glieli, gliele, gliene,
-- gliel'ho), separato da Hanno / Anno. Da eseguire una volta nell'SQL Editor
-- di Supabase, dopo superati.sql.
--
-- Stessa soglia degli altri giochi a 10 domande: da 501 in su gli errori sono
-- al massimo 3. Il torneo richiede tutti i giochi superati, quindi chi l'aveva
-- già sbloccato dovrà superare anche questo.
insert into public.giochi (idf_gioco, categoria, descrizione_gioco, soglia) values
    (11, 'ITA', 'Pronomi combinati', 501);
