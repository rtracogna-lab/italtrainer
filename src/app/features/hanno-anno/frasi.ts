export interface HannoAnnoSentence {
  before: string;
  after: string;
  answer: string;
  options: string[];
  // Il "trucco" per scegliere, mostrato dopo la risposta.
  tip: string;
}

export interface SentenceGroup {
  id: string;
  label: string;
  sentences: HannoAnnoSentence[];
}

// Frase come [prima, risposta, dopo] più, se servono, opzioni diverse da
// quelle del gruppo. Se la risposta è maiuscola (inizio frase), le opzioni
// del gruppo diventano maiuscole da sole.
type Row = [before: string, answer: string, after: string, options?: string[]];

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

function group(id: string, label: string, options: string[], tip: string, rows: Row[]): SentenceGroup {
  return {
    id,
    label,
    sentences: rows.map(([before, answer, after, own]) => {
      const capital = answer !== answer.toLowerCase() && !own;
      return { before, answer, after, options: own ?? (capital ? options.map(capitalize) : options), tip };
    }),
  };
}

// Parti della frase intorno allo spazio vuoto: niente spazio dopo un
// apostrofo ("Quest'anno") né prima della punteggiatura ("Ahi, mi...").
export function sentenceParts({ before, after }: { before: string; after: string }): { prefix: string; suffix: string } {
  return {
    prefix: before === '' || before.endsWith("'") ? before : before + ' ',
    suffix: /^[,.!?]/.test(after) ? after : ' ' + after,
  };
}

export function fullSentence(sentence: HannoAnnoSentence): string {
  const { prefix, suffix } = sentenceParts(sentence);
  return prefix + sentence.answer + suffix;
}

const LO = ['lo', "l'ho"];
const LA = ['la', "l'ha"];
const L_ANNO = ["l'anno", "l'hanno"];
const GLIELO = ['glielo', "gliel'ho"];
const GLIELA = ['gliela', "gliel'ha"];

export const GROUPS: SentenceGroup[] = [
  group(
    'hanno-anno',
    'hanno / anno',
    ['hanno', 'anno'],
    'Prova a dire "avevano": se la frase ha ancora senso, è "hanno" con l\'h. "Anno" invece è il tempo di 12 mesi.',
    [
      ['I miei genitori', 'hanno', 'un cane.'],
      ["Quest'", 'anno', 'andrò in terza elementare.'],
      ['I bambini', 'hanno', 'tanti giocattoli.'],
      ["L'", 'anno', 'scorso ho imparato a nuotare.'],
      ['Le mie sorelle', 'hanno', 'sempre fame.'],
      ['Il nuovo', 'anno', 'scolastico inizia a settembre.'],
      ['Loro', 'hanno', 'vinto la partita.'],
      ['Ogni', 'anno', 'festeggiamo il mio compleanno.'],
      ['I miei nonni', 'hanno', 'una casa al mare.'],
      ['Fra un', 'anno', 'sarò più alto.'],
      ['I miei amici', 'hanno', 'una bicicletta nuova.'],
      ["Quest'", 'anno', 'ho conosciuto tanti amici.'],
      ['Le maestre', 'hanno', 'corretto i compiti.'],
      ['Il mio cane ha un', 'anno', 'e mezzo.'],
      ['I gatti', 'hanno', 'paura dei cani.'],
      ["Il primo giorno dell'", 'anno', 'è il primo gennaio.'],
      ['Che cosa', 'hanno', 'fatto i tuoi compagni?'],
      ['Mia sorella ha un', 'anno', 'più di me.'],
      ["L'", 'anno', 'scorso i miei nonni mi hanno regalato una bicicletta.'],
      ["L'anno scorso i miei nonni mi", 'hanno', 'regalato una bicicletta.'],
      ['Mara e Sara', 'hanno', 'lo zaino nuovo.'],
      ['I miei compagni', 'hanno', 'poca voglia di studiare.'],
      ['Mio nonno fra un', 'anno', 'andrà in pensione.'],
      ['I miei fratellini', 'hanno', 'la varicella.'],
      ["È tutto l'", 'anno', 'che ti dico di non raccontarmi le bugie.'],
    ],
  ),
  group(
    'ha-a',
    'ha / a',
    ['ha', 'a'],
    'Prova a dire "aveva": se la frase ha ancora senso, è "ha" con l\'h. Altrimenti è "a", senza h.',
    [
      ['Il mio amico', 'ha', 'un gatto nero.'],
      ['Oggi vado', 'a', 'scuola in bicicletta.'],
      ['Lei', 'ha', 'sempre molta pazienza.'],
      ['Domani andremo', 'a', 'casa della nonna.'],
      ['Il cane', 'ha', 'tanta fame.'],
      ['Mi piace giocare', 'a', 'calcio.'],
      ['Marco', 'ha', 'dieci anni.'],
      ['Vieni', 'a', 'mangiare con noi?'],
      ['La mamma non', 'ha', 'voglia di uscire.'],
      ['Andiamo', 'a', 'vedere un film.'],
      ['Tuo fratello', 'ha', 'un pessimo carattere.'],
      ['Giochiamo', 'a', 'nascondino?'],
      ['Sono uscito', 'a', 'giocare a pallone con gli amici.'],
      ['Sono uscito a giocare', 'a', 'pallone con gli amici.'],
      ['', 'A', 'Natale andrò dai miei zii.'],
      ['Voglio sapere', 'a', 'che ora arriverò a casa.'],
      ['Voglio sapere a che ora arriverò', 'a', 'casa.'],
      ['Il mio papà', 'ha', 'un naso molto lungo.'],
      ['Lucia', 'ha', 'un gatto morbidissimo.'],
    ],
  ),
  group(
    'hai-ai',
    'hai / ai',
    ['hai', 'ai'],
    'Prova a dire "avevi": se la frase ha ancora senso, è "hai" con l\'h. "Ai" invece vuol dire "a i" (ai bambini, ai giardini).',
    [
      ['Tu', 'hai', 'un cane giocherellone.'],
      ['', 'Hai', 'dato da mangiare ai canarini?'],
      ['Hai dato da mangiare', 'ai', 'canarini?'],
      ['Vado', 'ai', 'giardini con i miei compagni.'],
      ['', 'Ai', 'bambini piacciono le caramelle.'],
      ['', 'Hai', 'raccontato la barzelletta ai tuoi amici?'],
      ['Hai raccontato la barzelletta', 'ai', 'tuoi amici?'],
      ['', 'Hai', 'chiamato Luigi?'],
      ['Tu', 'hai', 'sempre ragione!'],
      ['Ho regalato un libro', 'ai', 'miei cugini.'],
      ['Che cosa', 'hai', 'fatto oggi?'],
      ['Diamo le briciole', 'ai', 'piccioni.'],
      ['Quanti anni', 'hai', '?'],
      ['Ho scritto una lettera', 'ai', 'nonni.'],
    ],
  ),
  group(
    'ho-o',
    'ho / o',
    ['ho', 'o'],
    'Prova a dire "avevo": se la frase ha ancora senso, è "ho" con l\'h. Se puoi dire "oppure", è "o".',
    [
      ['Io', 'ho', 'fame.'],
      ['Vuoi il gelato', 'o', 'la torta?'],
      ['Oggi', 'ho', 'una verifica di matematica.'],
      ['Andiamo al parco', 'o', 'restiamo a casa?'],
      ['Io', 'ho', 'un fratello più piccolo.'],
      ['Preferisci il rosso', 'o', 'il blu?'],
      ['Ieri', 'ho', 'giocato a calcio.'],
      ['Mettiamo la giacca', 'o', 'il maglione?'],
      ['Non', 'ho', 'ancora finito i compiti.'],
      ['Ci vediamo oggi', 'o', 'domani?'],
      ['', 'Ho', 'una gran voglia di gelato.'],
      ['Gianni vorrebbe un canarino', 'o', 'un pappagallo.'],
      ['Non', 'ho', 'né caldo né freddo.'],
      ['Vuoi la banana', 'o', 'la pera?'],
      ['Non', 'ho', 'più voglia di giocare.'],
    ],
  ),
  group(
    'e',
    'è / e',
    ['è', 'e'],
    'Prova a dire "era": se la frase ha ancora senso, è "è" con l\'accento. Se unisce due cose (il pane e il latte), è "e".',
    [
      ['Il cielo', 'è', 'azzurro.'],
      ['Ho comprato il pane', 'e', 'il latte.'],
      ['Mia sorella', 'è', 'molto simpatica.'],
      ['Luca', 'e', 'Sara giocano insieme.'],
      ['Oggi', 'è', 'una bella giornata.'],
      ['Mangio una mela', 'e', 'una banana.'],
      ['Il gatto', 'è', 'sotto il tavolo.'],
      ['Ho un cane', 'e', 'due gatti.'],
      ['La scuola', 'è', 'chiusa la domenica.'],
      ['Prendo la penna', 'e', 'il quaderno.'],
      // Coppie con "è" ed "e" nella stessa frase: una volta manca l'una, una
      // volta l'altra.
      ['Il gelato', 'è', 'buono e fresco.'],
      ['Il gelato è buono', 'e', 'fresco.'],
      ['Il mare', 'è', 'calmo e blu.'],
      ['Il gatto è bianco', 'e', 'nero.'],
      ['Il compito', 'è', 'facile e veloce.'],
      ['Marco è stanco', 'e', 'ha sonno.'],
      ['Mio fratello', 'è', 'più alto di me.'],
      ['Dove', 'è', 'il mio zaino?'],
      ['La pizza', 'è', 'pronta, venite a tavola!'],
      ['Oggi la maestra', 'è', 'contenta di noi.'],
      ['Il pallone', 'è', 'sotto il letto.'],
      ['Mio papà', 'è', 'un bravo cuoco.'],
      ['Gioco a calcio', 'e', 'a pallavolo.'],
      ['La mamma', 'e', 'il papà sono al lavoro.'],
      ['Mi lavo i denti', 'e', 'vado a letto.'],
      ['Il cane abbaia', 'e', 'scodinzola.'],
      ['Ho letto un libro', 'e', 'ho fatto un disegno.'],
      ['Apro la finestra', 'e', 'guardo fuori.'],
      ['Oggi piove', 'e', 'fa freddo.'],
      ['Il nonno', 'è', 'in giardino con il cane.'],
    ],
  ),
  // "c'è" (ci + è: qualcosa si trova lì) contro "ce" (davanti a lo, la, l', ne:
  // "ce l'ho", "ce la faccio", "ce ne sono").
  group(
    'ce',
    "c'è / ce",
    ["c'è", 'ce'],
    '"C\'è" vuol dire "ci è": qualcosa si trova lì. "Ce" si usa davanti a lo, la, l\', ne: ce l\'ho, ce la faccio, ce ne sono.',
    [
      ['Sul tavolo', "c'è", 'una torta.'],
      ['Oggi', "c'è", 'il sole.'],
      ['Nel giardino', "c'è", 'un grande albero.'],
      ['Chi', "c'è", 'alla porta?'],
      ['Non', "c'è", 'più latte nel frigo.'],
      ['Hai la matita? Sì,', 'ce', "l'ho nello zaino."],
      ['Non', 'ce', 'la faccio più, sono stanco!'],
      ['La maestra', 'ce', "l'ha spiegato ieri."],
      ['Quante caramelle!', 'Ce', 'ne sono tantissime.'],
      ['Se mi aiuti,', 'ce', 'la facciamo in tempo.'],
    ],
  ),
  // Opzioni diverse per ogni frase: lo/l'ho, la/l'ha, l'anno/l'hanno.
  group(
    'lo-lho',
    "lo / l'ho, la / l'ha",
    LO,
    'Prova a dire "l\'avevo", "l\'aveva" o "l\'avevano": se la frase ha ancora senso, ci vuole l\'h. Se viene prima di un nome (la bistecca, lo zaino), è senza h.',
    [
      ['', 'La', "bistecca è squisita, l'ha mangiata a pranzo e a cena.", ['La', "L'ha"]],
      ['La bistecca è squisita,', "l'ha", 'mangiata a pranzo e a cena.', LA],
      ['Sono caduto con', 'la', "bicicletta e il babbo me l'ha sequestrata.", LA],
      ['Sono caduto con la bicicletta e il babbo me', "l'ha", 'sequestrata.', LA],
      ['Ho comprato una sciarpa e', "l'ho", 'regalata al nonno.'],
      ['Io', "l'ho", 'spiegato tante volte, ma non ha ancora capito.'],
      ['Avevo messo il diario sulla scrivania, poi', "l'ho", 'dimenticato.'],
      ['', 'Lo', 'scorso anno sono andato più volte in piscina.', ['Lo', "L'ho"]],
      ['Il prossimo anno andremo in montagna: ce', "l'hanno", 'detto i nostri genitori.', L_ANNO],
      ['Quel dolce', "l'ho", 'assaggiato e ora te lo consiglio.'],
      ["Quel dolce l'ho assaggiato e ora te", 'lo', 'consiglio.'],
      ['Il pallone?', "L'ho", 'preso io.', ['Lo', "L'ho"]],
      ['La torta', "l'ha", 'preparata la nonna.', LA],
      ['Prendi', 'la', 'penna rossa.', LA],
      ['Non trovo il quaderno:', "l'ho", 'perso ieri.'],
      ['Hai visto il film? Sì,', "l'ho", 'visto ieri.'],
      ['Passami', 'lo', 'zaino, per favore.'],
      ['Il gatto? I bambini', "l'hanno", 'trovato in giardino.', L_ANNO],
      ["Mi è piaciuto tutto l'", 'anno', 'scolastico.', ['anno', 'hanno']],
      ['I compiti? I miei compagni', "l'hanno", 'già finiti.', L_ANNO],
    ],
  ),
  // Opzioni diverse per ogni frase: glielo/gliel'ho, gliela/gliel'ha,
  // gliel'ha/gliel'hanno.
  group(
    'glielo',
    "glielo / gliel'ho",
    GLIELO,
    'Prova a dire "gliel\'avevo", "gliel\'aveva" o "gliel\'avevano": se la frase ha ancora senso, si scrive con l\'apostrofo e l\'h.',
    [
      ['Non so se', "gliel'ho", 'già detto oppure no.'],
      ['Non', 'glielo', 'voglio più chiedere.'],
      ['Lei', "gliel'ha", 'promesso ieri, durante la riunione.', ['glielo', "gliel'ha"]],
      ['Loro', "gliel'hanno", 'ripetuto più volte, ma lui fa finta di niente.', ["gliel'ha", "gliel'hanno"]],
      ['Mara aveva la penna nuova e Silvia per dispetto', "gliel'ha", 'nascosta.', GLIELA],
      ['Dario mi ha affidato la sua gattina ed io', 'gliela', 'sorveglierò.', GLIELA],
      ['La mamma ha una bella collana,', "gliel'ha", 'regalata il babbo.', GLIELA],
      ['Marco non trova il libro, ma', "gliel'ho", 'lasciato sul tavolo.'],
      ['Andrea ha chiesto il libro a Paolo e lui', "gliel'ha", 'prestato subito.', ['glielo', "gliel'ha"]],
      ['Il regalo per la nonna? Domani', 'glielo', 'porto io.'],
      ['Quando la maestra chiede il quaderno, io', 'glielo', 'do subito.'],
      ['La lettera per la zia? I bambini', "gliel'hanno", 'scritta insieme.', ["gliel'ha", "gliel'hanno"]],
    ],
  ),
  group(
    'esclamazioni',
    'ah / oh / ahi',
    ['ah', 'oh', 'ahi'],
    '"Ahi" si dice quando si sente dolore, "oh" per meraviglia o dispiacere, "ah" quando si capisce o ci si ricorda di qualcosa.',
    [
      ['', 'Ahi', ', mi fa male la testa!'],
      ['', 'Oh', ', che bello!'],
      ['', 'Oh', ', si è rotto ancora il mio orologio!'],
      ['', 'Ahi', ', che mal di schiena!'],
      ['', 'Ah', ', ora ho capito!'],
      ['', 'Ahi', ', mi sono punto con la spina!'],
      ['', 'Oh', ', che bella sorpresa!'],
      ['', 'Ah', ', ecco dove avevo messo le chiavi!'],
    ],
  ),
];

export const SENTENCES: HannoAnnoSentence[] = GROUPS.flatMap((item) => item.sentences);
