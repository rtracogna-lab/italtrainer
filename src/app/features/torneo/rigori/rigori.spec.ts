import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tts } from '../../../shared/tts';
import { PenaltyResult, Rigori } from './rigori';

describe('Rigori', () => {
  let fixture: ComponentFixture<Rigori>;
  let c: any;
  let ended: PenaltyResult[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Rigori],
      providers: [{ provide: Tts, useValue: { supported: false, speak: () => {}, cancel: () => {} } }],
    });
    fixture = TestBed.createComponent(Rigori);
    fixture.componentRef.setInput('teamName', 'Noi FC');
    fixture.componentRef.setInput('rival', { name: 'Lupi Blu', badge: '🐺' });
    ended = [];
    fixture.componentInstance.ended.subscribe((result) => ended.push(result));
    c = fixture.componentInstance;
    // Gli avversari sbagliano sempre.
    c.random = () => 0.99;
    fixture.detectChanges();
  });

  it('should score with a right answer and end when the other side cannot catch up', () => {
    for (let kick = 0; kick < 3; kick++) {
      c.shoot(c.current().missing);
      expect(c.theirTurn()).toBe(true);
      c.theyShoot();
    }
    fixture.detectChanges();
    expect(c.winner()).toBe('noi');
    expect(ended).toEqual([{ scoredFor: 3, scoredAgainst: 0 }]);
    expect(fixture.nativeElement.textContent).toContain('Hai vinto ai rigori');
  });

  it('should miss the penalty with a wrong answer', () => {
    const wrong = c.current().options.find((option: string) => option !== c.current().missing);
    c.shoot(wrong);
    fixture.detectChanges();
    expect(c.ours()).toEqual([false]);
    expect(fixture.nativeElement.textContent).toContain('rigore fallito');
  });
});
