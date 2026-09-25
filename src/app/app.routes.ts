import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'ItalTrainer',
  },
  {
    path: 'doppie',
    loadComponent: () => import('./features/doppie/doppie').then((m) => m.Doppie),
    title: 'ItalTrainer - Doppie',
  },
  {
    path: 'hanno-anno',
    loadComponent: () =>
      import('./features/hanno-anno/hanno-anno').then((m) => m.HannoAnno),
    title: 'ItalTrainer - Hanno / Anno',
  },
  {
    path: 'parole-unite',
    loadComponent: () =>
      import('./features/parole-unite/parole-unite').then((m) => m.ParoleUnite),
    title: 'ItalTrainer - Parole Unite',
  },
  {
    path: 'spezza-parole',
    loadComponent: () =>
      import('./features/spezza-parole/spezza-parole').then((m) => m.SpezzaParole),
    title: 'ItalTrainer - Spezza le Parole',
  },
  {
    path: 'ricostruisci-frase',
    loadComponent: () =>
      import('./features/ricostruisci-frase/ricostruisci-frase').then((m) => m.RicostruisciFrase),
    title: 'ItalTrainer - Ricostruisci la Frase',
  },
  {
    path: 'qui-quo-qua',
    loadComponent: () =>
      import('./features/qui-quo-qua/qui-quo-qua').then((m) => m.QuiQuoQua),
    title: 'ItalTrainer - Qui Quo Qua',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
