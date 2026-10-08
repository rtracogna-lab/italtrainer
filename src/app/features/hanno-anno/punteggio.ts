// Punteggio a tempo: chi risponde giusto e in fretta prende più punti, ma ogni
// errore costa caro, così non conviene tirare a indovinare.
export const POINTS_PER_CORRECT = 100;
export const MAX_SPEED_BONUS = 50;
// Il bonus cala di 5 punti al secondo: dopo 10 secondi non c'è più.
export const BONUS_LOST_PER_SECOND = 5;
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

export function speedBonus(seconds: number): number {
  return Math.max(0, MAX_SPEED_BONUS - Math.floor(seconds) * BONUS_LOST_PER_SECOND);
}

export function computeScore(answers: TimedAnswer[]): ScoreBreakdown {
  const right = answers.filter((answer) => answer.correct);
  const correct = right.length;
  const mistakes = answers.length - correct;
  const basePoints = correct * POINTS_PER_CORRECT;
  const bonus = right.reduce((sum, answer) => sum + speedBonus(answer.seconds), 0);
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
