// Punteggio a tempo: chi risponde giusto e in fretta prende più punti, ma ogni
// errore costa caro, così non conviene tirare a indovinare.
export const POINTS_PER_CORRECT = 100;
export const MAX_SPEED_BONUS = 50;
// Secondi dopo cui il bonus non c'è più: cala di 5 punti al secondo.
export const BONUS_SECONDS = 10;
// Per i giochi in cui la risposta si costruisce (frasi, sillabe...): il bonus
// cala di 2 punti al secondo.
export const SLOW_BONUS_SECONDS = 25;
export const PENALTY_PER_MISTAKE = 100;

export interface TimedAnswer {
  correct: boolean;
  seconds: number;
}

export interface ScoreBreakdown {
  correct: number;
  mistakes: number;
  basePoints: number;
  speedBonus: number;
  penalty: number;
  total: number;
  totalSeconds: number;
}

export function speedBonus(seconds: number, bonusSeconds = BONUS_SECONDS): number {
  return Math.max(0, MAX_SPEED_BONUS - Math.floor(seconds) * (MAX_SPEED_BONUS / bonusSeconds));
}

export function computeScore(answers: TimedAnswer[], bonusSeconds = BONUS_SECONDS): ScoreBreakdown {
  const right = answers.filter((answer) => answer.correct);
  const correct = right.length;
  const mistakes = answers.length - correct;
  const basePoints = correct * POINTS_PER_CORRECT;
  const bonus = right.reduce((sum, answer) => sum + speedBonus(answer.seconds, bonusSeconds), 0);
  const penalty = mistakes * PENALTY_PER_MISTAKE;
  return {
    correct,
    mistakes,
    basePoints,
    speedBonus: bonus,
    penalty,
    // Mai sotto zero, per non scoraggiare troppo.
    total: Math.max(0, basePoints + bonus - penalty),
    totalSeconds: Math.round(answers.reduce((sum, answer) => sum + answer.seconds, 0)),
  };
}

// Record personale salvato nel browser, sotto la chiave scelta dal gioco.
export function readRecord(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

export function saveRecord(key: string, points: number): void {
  try {
    localStorage.setItem(key, String(points));
  } catch {
    // Senza memoria del browser il record semplicemente non si salva.
  }
}
