import { computeScore, speedBonus } from './punteggio';

describe('punteggio', () => {
  it('should give a bigger bonus to faster answers, down to zero after 10 seconds', () => {
    expect(speedBonus(0.5)).toBe(50);
    expect(speedBonus(3.2)).toBe(35);
    expect(speedBonus(10)).toBe(0);
    expect(speedBonus(25)).toBe(0);
  });

  it('should add points for correct answers and take 100 off for each mistake', () => {
    const score = computeScore([
      { correct: true, seconds: 2 },
      { correct: true, seconds: 12 },
      { correct: false, seconds: 1 },
    ]);
    expect(score).toEqual({
      correct: 2,
      mistakes: 1,
      basePoints: 200,
      speedBonus: 40,
      penalty: 100,
      total: 140,
      totalSeconds: 15,
    });
  });

  it('should never go below zero', () => {
    expect(computeScore([{ correct: false, seconds: 1 }]).total).toBe(0);
  });
});
