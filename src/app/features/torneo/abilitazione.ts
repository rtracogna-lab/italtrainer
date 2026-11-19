import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../../core/auth';
import { Risultati } from '../../core/risultati';

// Tabellone e partite del torneo solo per chi ha superato tutti i giochi:
// gli altri tornano all'elenco, che spiega cosa manca.
export const abilitatoTorneo: CanActivateFn = async () => {
  // inject() funziona solo prima del primo await.
  const user = inject(Auth).user();
  const risultati = inject(Risultati);
  const elenco = inject(Router).createUrlTree(['/torneo']);
  if (!user) {
    return elenco;
  }
  try {
    const giochi = await risultati.giochiSuperati(user.idf_user);
    return giochi.every((gioco) => gioco.superato) || elenco;
  } catch {
    return elenco;
  }
};
