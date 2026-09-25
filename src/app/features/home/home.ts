import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Challenge {
  title: string;
  description: string;
  icon: string;
  route: string;
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
      description: 'Impara a distinguere "ha/hanno" (avere) da "a/anno".',
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
  ];
}
