import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CeCie } from './ce-cie';

describe('CeCie', () => {
  let component: CeCie;
  let fixture: ComponentFixture<CeCie>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CeCie],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CeCie);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should highlight the letter before -cia/-gia in plural words', async () => {
    const words = (component as any).words;
    const round = words();
    words.set([
      { clue: '', hint: '', prefix: 'vali', missing: 'gie', suffix: '', tip: '', plural: 'vowel' },
      { clue: '', hint: '', prefix: 'spiag', missing: 'ge', suffix: '', tip: '', plural: 'consonant' },
      ...round.slice(2),
    ]);
    fixture.detectChanges();

    const text = () => fixture.nativeElement.querySelector('.exercise-card__text');
    expect(text().textContent.trim()).toBe('vali···');
    expect(text().querySelector('.rule-letter--vowel').textContent).toBe('i');

    (component as any).next();
    fixture.detectChanges();
    expect(text().textContent.trim()).toBe('spiag···');
    expect(text().querySelector('.rule-letter--consonant').textContent).toBe('g');
  });
});
