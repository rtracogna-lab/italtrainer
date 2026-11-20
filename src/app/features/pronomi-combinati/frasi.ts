import { group, SentenceGroup } from '../hanno-anno/frasi';

const GLIELO = ['glielo', "gliel'ho"];
const GLIELA = ['gliela', "gliel'ha"];
const GENERE_NUMERO = ['glielo', 'gliela', 'glieli', 'gliele'];

// Parole che possono stare tra il pronome e il verbo ("gliel'ho già detto").
const NON_VERBI = new Set(['già', 'più', 'mai', 'ancora', 'appena', 'sempre']);
const AVEVA: Record<string, string> = { "gliel'ho": "gliel'avevo", "gliel'ha": "gliel'aveva", "gliel'hanno": "gliel'avevano" };

// Il suggerimento di glielo / gliel'ho dice per ogni frase se il verbo è al
// passato, così il bambino impara a guardare il verbo che segue. Le frasi in
// cui si sceglie solo tra gliel'ha e gliel'hanno tengono quello del gruppo.
function tenseTips(sentences: SentenceGroup): SentenceGroup {
  return {
    ...sentences,
    sentences: sentences.sentences.map((sentence) => {
      if (sentence.options.every((option) => option.includes("'"))) {
        return sentence;
      }
      const verb = sentence.after.split(/[\s,.!?]+/).find((word) => word && !NON_VERBI.has(word)) ?? '';
      const answer = sentence.answer.toLowerCase();
      const tip = answer.includes("'")
        ? `"${verb}" è al passato: ci vuole "ho/ha/hanno", quindi si scrive "${answer}" con l'apostrofo e l'h (prova: "${AVEVA[answer]} ${verb}").`
        : `"${verb}" non è al passato: non c'è nessun "ho/ha/hanno", quindi si scrive "${answer}" senza h. Al passato sarebbe "gliel'ho" (es. ieri gliel'ho dato).`;
      return { ...sentence, tip };
    }),
  };
}

// Pronomi combinati con "gli": la stessa forma delle frasi di Hanno / Anno,
// così La partita e Giusto o sbagliato possono usarle insieme alle altre.
export const PRONOMI_GROUPS: SentenceGroup[] = [
  // Opzioni diverse per ogni frase: glielo/gliel'ho, gliela/gliel'ha,
  // gliel'ha/gliel'hanno.
  tenseTips(group(
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
      ['Il pallone di Luca? Ieri', "gliel'ho", 'restituito.'],
      ['Se la nonna vuole la ricetta,', 'gliela', 'scrivo io.', GLIELA],
      ['Quel disegno è per la mamma: domani', 'glielo', 'regalo.'],
      ['Il papà cercava il telefono e Sara', "gliel'ha", 'trovato.', ['glielo', "gliel'ha"]],
      ['La maestra voleva la verifica e io', "gliel'ho", 'consegnata subito.', ['gliela', "gliel'ho"]],
      ['Marco ha dimenticato la merenda, così io', 'gliela', 'compro.', GLIELA],
      ['Il nonno voleva il giornale e i bambini', "gliel'hanno", 'portato.', ["gliel'ha", "gliel'hanno"]],
      ['Se Luca non capisce il compito,', 'glielo', 'spiego io.'],
      ['Hai dato il libro a Giulia? Sì,', "gliel'ho", 'dato stamattina.'],
      ['La palla era di Paolo e Marta', "gliel'ha", 'rotta.', GLIELA],
      ['Il cane vuole il biscotto: adesso', 'glielo', 'do.'],
      ['La maestra voleva sapere la verità e i bambini', "gliel'hanno", 'detta.', ['gliela', "gliel'hanno"]],
      ['Il nonno voleva il giornale e io', "gliel'ho", 'comprato.'],
      ['Giulia ama i fiori: domani', 'glieli', 'porto.', ['glieli', "gliel'ho"]],
      ['La zia voleva la torta e la mamma', "gliel'ha", 'preparata.', GLIELA],
      ['Il gatto vuole la pappa: adesso', 'gliela', 'do.', GLIELA],
      ['Paolo ha chiesto la penna e io', "gliel'ho", 'prestata.', ['gliela', "gliel'ho"]],
      ['Il maestro ha chiesto il compito e i ragazzi', "gliel'hanno", 'consegnato.', ["gliel'ha", "gliel'hanno"]],
      ['Se Marco vuole il pallone,', 'glielo', 'lancio.'],
      ['La nonna voleva una foto e il papà', "gliel'ha", 'mandata.', GLIELA],
      ['Il regalo era per Luca e io', "gliel'ho", 'dato ieri.'],
      ['Sara ha perso la sciarpa: la maestra', "gliel'ha", 'trovata.', GLIELA],
      // Coppie passato / presente: stessa cosa, cambia solo il tempo del verbo.
      ['Il libro di Luca? Ieri', "gliel'ho", 'dato.'],
      ['Il libro di Luca? Domani', 'glielo', 'do.'],
      ['Il segreto? Ieri sera', "gliel'ho", 'raccontato.'],
      ['Il segreto? Adesso', 'glielo', 'racconto.'],
      ['Il regalo per il nonno? La settimana scorsa', "gliel'ho", 'spedito.'],
      ['Il regalo per il nonno? Domani', 'glielo', 'spedisco.'],
      ['Il disegno? Stamattina', "gliel'ho", 'mostrato.'],
      ['Il disegno? Fra poco', 'glielo', 'mostro.'],
      ['La bici di Marco? Domenica', "gliel'ho", 'riparata.', ['gliela', "gliel'ho"]],
      ['La bici di Marco? Oggi', 'gliela', 'riparo.', ['gliela', "gliel'ho"]],
      ['La storia? Ieri sera la nonna', "gliel'ha", 'raccontata.', GLIELA],
      ['La storia? Stasera la nonna', 'gliela', 'racconta.', GLIELA],
      ['Il compito? La maestra', "gliel'ha", 'corretto ieri.', ['glielo', "gliel'ha"]],
      ['Il compito? La maestra', 'glielo', 'corregge domani.', ['glielo', "gliel'ha"]],
      ['Il quaderno? Ieri Paolo', "gliel'ha", 'prestato.', ['glielo', "gliel'ha"]],
      ['Il quaderno? Oggi Paolo', 'glielo', 'presta.', ['glielo', "gliel'ha"]],
      ['Il pallone? Stamattina i ragazzi', "gliel'hanno", 'restituito.', ['glielo', "gliel'hanno"]],
      ['Il pallone? Domani i ragazzi', 'glielo', 'restituiscono.', ['glielo', "gliel'hanno"]],
      ['La merenda? Prima la mamma', "gliel'ha", 'preparata.', GLIELA],
      ['La merenda? Adesso la mamma', 'gliela', 'prepara.', GLIELA],
    ],
  )),
  group(
    'genere-numero',
    'glielo / gliela / glieli / gliele',
    GENERE_NUMERO,
    'Guarda che cosa si dà: una cosa maschile → glielo, una femminile → gliela; tante cose maschili → glieli, tante femminili → gliele.',
    [
      ['Luca vuole il pallone: adesso', 'glielo', 'passo.'],
      ['La nonna aspetta la lettera: domani', 'gliela', 'spedisco.'],
      ['Marta ha perso i guanti, ma la maestra', 'glieli', 'ha trovati.'],
      ['Il nonno non trova le chiavi: io', 'gliele', 'cerco.'],
      ['Ai bambini piacciono le favole: la sera la mamma', 'gliele', 'legge.'],
      ['Paolo ha chiesto i colori: domani', 'glieli', 'presto.'],
      ['Il cane aspetta il biscotto: ora', 'glielo', 'do.'],
      ['Giulia ama le fragole: domani', 'gliele', 'porto.'],
      ['Il maestro ha chiesto i quaderni e noi', 'glieli', 'abbiamo consegnati.'],
      ['Sara vuole vedere la foto: stasera', 'gliela', 'mando.'],
      ['Lo zio cerca il giornale: subito', 'glielo', 'porto.'],
      ['La zia ha dimenticato le scarpe:', 'gliele', 'riporto io.'],
      ['I nonni vogliono la torta: domenica', 'gliela', 'prepariamo noi.'],
      ['Marco ha lasciato i libri a scuola: domani', 'glieli', 'porto io.'],
      ['Anna vuole sapere il segreto, ma io non', 'glielo', 'dico.'],
      ['La maestra vuole la verità e noi', 'gliela', 'diciamo.'],
    ],
  ),
  group(
    'gliene',
    'gliene',
    ['gliene', 'glielo'],
    '"Gliene" vuol dire "a lui (o a lei) di quella cosa": si usa con le quantità (gliene do due) o con "parlare di" (gliene ho parlato). "Glielo" invece è proprio quella cosa.',
    [
      ['Luca voleva delle caramelle e io', 'gliene', 'ho date tre.', ['gliene', 'gliele']],
      ['La nonna voleva le mele e il papà', 'gliene', 'ha comprate un chilo.', ['gliene', 'gliele']],
      ['Marco ha fame: gli do un panino, anzi', 'gliene', 'do due!'],
      ['Hai parlato alla maestra della gita? Sì,', 'gliene', 'ho parlato ieri.', ['gliene', "gliel'ho"]],
      ['Il cane vuole ancora crocchette: adesso', 'gliene', "do un po'."],
      ['Sara ha finito i fogli, ma Anna', 'gliene', 'presta qualcuno.', ['gliene', 'glieli']],
      ['Il nonno adora i biscotti: ogni volta', 'gliene', 'porto una scatola.', ['gliene', 'glieli']],
      ['La zia non aveva più uova e la vicina', 'gliene', 'ha date sei.', ['gliene', 'gliele']],
      ['Paolo ama le figurine e il nonno', 'gliene', 'compra un pacchetto.', ['gliene', 'gliele']],
      ['Giulia voleva dei fiori e la mamma', 'gliene', 'ha regalati tanti.', ['gliene', 'glieli']],
    ],
  ),
  // Niente opzioni di gruppo: ogni frase ha le sue forme staccate.
  group(
    'attaccato',
    'tutto attaccato',
    [],
    'I pronomi combinati con "gli" si scrivono sempre attaccati: glielo, gliela, glieli, gliele, gliene. Dopo verbi come dire, dare o portare si attaccano anche al verbo: dirglielo, portagliela.',
    [
      ['Il regalo per Luca? Domani', 'glielo', 'porto.', ['glielo', 'gli lo', 'glie lo']],
      ['La merenda per Sara? Ora', 'gliela', 'do.', ['gliela', 'gli la', 'glie la']],
      ['I compiti di Marco? Ieri', 'glieli', 'ho corretti.', ['glieli', 'gli li', 'glie li']],
      ['Le figurine di Anna? Stasera', 'gliele', 'restituisco.', ['gliele', 'gli le', 'glie le']],
      ['Luca non sa il segreto: devo', 'dirglielo', 'subito.', ['dirglielo', 'dirgli lo', 'dire glielo']],
      ['La nonna vuole la torta:', 'portagliela', 'tu!', ['portagliela', 'portagli la', 'porta gliela']],
      ['Il pallone è di Paolo:', 'ridaglielo', 'subito!', ['ridaglielo', 'ridagli lo', 'rida glielo']],
      ['Se Marta vuole i colori, puoi', 'prestarglieli', 'tu.', ['prestarglieli', 'prestargli li', 'prestare glieli']],
      ['Anna ha chiesto le chiavi: vado a', 'dargliele', 'adesso.', ['dargliele', 'dargli le', 'dare gliele']],
      ['Marco vuole sapere la verità: devo', 'dirgliela', 'io.', ['dirgliela', 'dirgli la', 'dire gliela']],
    ],
  ),
];
