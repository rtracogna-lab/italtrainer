import { Component, input } from '@angular/core';
import { ScoreBreakdown } from '../punteggio';

// Punteggio finale a tempo, con il dettaglio e il record personale.
@Component({
  selector: 'app-score-card',
  styleUrl: './score-card.scss',
  templateUrl: './score-card.html',
})
export class ScoreCard {
  readonly score = input.required<ScoreBreakdown>();
  readonly record = input(0);
  readonly isNewRecord = input(false);
}
