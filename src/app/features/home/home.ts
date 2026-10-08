import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Challenge {
  title: string;
  description: string;
  icon: string;
  route: string;
  // Messa in evidenza in fondo all'elenco, a tutta larghezza.
  highlight?: boolean;
}

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  protected readonly challenges: Challenge[] = [
    {
      title: 'Doppie',
      description: 'Allenati a riconoscere le consonanti doppie.',
      icon: '🔤',
      route: '/doppie',
    },
    {
      title: 'Hanno / Anno',
      description: `Impara a distinguere "ha/a", "hanno/anno", "ho/o", "è/e" e "c'è/ce".`,
      icon: '📅',
      route: '/hanno-anno',
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
      title: 'Dettato',
      description: 'La prova finale: ascolta il dettato e scrivilo sul foglio, una parte alla volta.',
      icon: '✏️',
      route: '/dettato',
      highlight: true,
    },
  ];
}
