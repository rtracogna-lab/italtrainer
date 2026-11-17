import { Component, computed, input } from '@angular/core';

// Squadre che hanno un logo vero al posto dell'emoji (immagini in public/stemmi).
const LOGHI: Record<string, string> = {
  valnatisone: 'stemmi/valnatisone.png',
};

// Stemma di una squadra: il logo se c'è, altrimenti l'emoji.
@Component({
  selector: 'app-stemma',
  template: `
    @if (logo(); as src) {
      <img class="stemma" [src]="src" [alt]="'Stemma ' + nome()" />
    } @else {
      {{ stemma() }}
    }
  `,
  styles: `
    .stemma {
      height: 1.6em;
      vertical-align: middle;
      border-radius: 4px;
    }
  `,
})
export class Stemma {
  readonly stemma = input.required<string>();
  readonly nome = input.required<string>();

  protected readonly logo = computed(() => LOGHI[this.nome().trim().toLowerCase()] ?? null);
}
