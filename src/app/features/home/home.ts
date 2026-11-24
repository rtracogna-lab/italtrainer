import { AfterViewInit, Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';
import { GIOCHI_NASCOSTI, GiocoSuperato, PERCORSO_GIOCO, Risultati } from '../../core/risultati';
import { Login } from '../login/login';

// Gioco della tabella giochi per ogni pagina.
const GIOCO_DA_PERCORSO = new Map(Object.entries(PERCORSO_GIOCO).map(([gioco, percorso]) => [percorso, Number(gioco)]));

interface Challenge {
  title: string;
  description: string;
  icon: string;
  route: string;
  // Messa in evidenza in fondo all'elenco, a tutta larghezza.
  highlight?: boolean;
  // Tolta dalla scelta, ma la pagina resta. Per i giochi della tabella giochi
  // vale GIOCHI_NASCOSTI.
  hidden?: boolean;
}

function isHidden(challenge: Challenge): boolean {
  const gioco = GIOCO_DA_PERCORSO.get(challenge.route);
  return !!challenge.hidden || (gioco !== undefined && GIOCHI_NASCOSTI.has(gioco));
}

@Component({
  imports: [Login, RouterLink],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home implements OnInit, AfterViewInit {
  protected readonly auth = inject(Auth);
  private readonly risultati = inject(Risultati);

  // Vuoto finché non arriva la risposta (o se l'utente non ha fatto l'accesso).
  private readonly giochi = signal<GiocoSuperato[]>([]);
  private readonly superati = computed(
    () => new Set(this.giochi().filter((gioco) => gioco.superato).map((gioco) => gioco.idf_gioco)),
  );
  protected readonly mostraStato = computed(() => this.auth.loggedIn() && this.giochi().length > 0);

  private readonly loginDialog = viewChild.required<ElementRef<HTMLDialogElement>>('loginDialog');

  ngOnInit(): void {
    void this.loadGiochi();
  }

  ngAfterViewInit(): void {
    if (this.auth.loggedIn() || this.auth.loginPromptShown) {
      return;
    }
    this.auth.loginPromptShown = true;
    const dialog = this.loginDialog().nativeElement;
    // showModal manca in qualche browser vecchio (e in jsdom).
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  protected closeLogin(): void {
    const dialog = this.loginDialog().nativeElement;
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }

  protected onLoggedIn(): void {
    this.closeLogin();
    void this.loadGiochi();
  }

  private async loadGiochi(): Promise<void> {
    if (!this.auth.loggedIn()) {
      return;
    }
    try {
      this.giochi.set(await this.risultati.giochiSuperati());
    } catch {
      // Senza server la home si vede lo stesso, solo senza le spunte.
    }
  }

  protected isSuperato(challenge: Challenge): boolean {
    const gioco = GIOCO_DA_PERCORSO.get(challenge.route);
    return gioco !== undefined && this.superati().has(gioco);
  }

  protected readonly challenges: Challenge[] = ([
    {
      title: 'Doppie',
      description: 'Allenati a riconoscere le consonanti doppie.',
      icon: '🔤',
      route: '/doppie',
    },
    {
      title: 'Hanno / Anno',
      description: `Impara a distinguere "ha/a", "hanno/anno", "hai/ai", "ho/o", "è/e", "c'è/ce", "l'ho/lo" e "ah/oh/ahi".`,
      icon: '📅',
      route: '/hanno-anno',
    },
    {
      title: 'Pronomi combinati',
      description: `Glielo, gliela, glieli, gliele, gliene e gliel'ho: scegli quello giusto e scrivilo tutto attaccato.`,
      icon: '🎁',
      route: '/pronomi-combinati',
    },
    {
      title: 'Giusto o sbagliato?',
      description: 'Un minuto di tempo: decidi più in fretta che puoi se la frase è scritta giusta o sbagliata.',
      icon: '⚡',
      route: '/giusto-sbagliato',
    },
    {
      title: 'Parole Unite',
      description: 'Scopri quando le parole vanno scritte attaccate, come "delle".',
      icon: '🧩',
      route: '/parole-unite',
    },
    {
      title: 'Spezza le Parole',
      description: 'Clicca tra le lettere per rimettere gli spazi al posto giusto.',
      icon: '✂️',
      route: '/spezza-parole',
    },
    {
      title: 'Ricostruisci la Frase',
      description: 'Rimetti in ordine le parole mescolate per formare la frase giusta.',
      icon: '🔀',
      route: '/ricostruisci-frase',
    },
    {
      title: 'Qui Quo Qua',
      description: 'Scegli tra "qu", "cu" e "cqu", come in acqua e quadrato.',
      icon: '💧',
      route: '/qui-quo-qua',
    },
    {
      title: 'Ce, Cie, Ge, Gie',
      description: 'Scegli tra "ce/cie", "sce/scie" e "ge/gie", come in cielo, scienza e igiene.',
      icon: '☁️',
      route: '/ce-cie',
    },
    {
      title: 'Lettera mancante',
      description: 'Trova dove manca una lettera e rimettila al suo posto.',
      icon: '🔎',
      route: '/lettera-mancante',
    },
    {
      title: 'Costruisci con le sillabe',
      description: 'Ascolta la parola e componila con le sillabe giuste, senza cadere nelle trappole.',
      icon: '🧱',
      route: '/sillabe',
    },
    {
      title: 'La partita',
      description: '90 minuti di domande da tutte le sfide: 5 risposte giuste di fila e fai gol, 2 errori di fila e segnano loro!',
      icon: '⚽',
      route: '/partita',
    },
    {
      title: 'Torneo',
      description: '8 squadre, due gironi, semifinali e finale: porta la tua squadra a vincere la coppa!',
      icon: '🏆',
      route: '/torneo',
    },
    {
      title: 'Dettato',
      description: 'La prova finale: ascolta il dettato e scrivilo sul foglio, una parte alla volta.',
      icon: '✏️',
      route: '/dettato',
      highlight: true,
      hidden: true,
    },
  ] satisfies Challenge[]).filter((challenge) => !isHidden(challenge));
}
