import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParoleUnite } from './parole-unite';

describe('ParoleUnite', () => {
  let component: ParoleUnite;
  let fixture: ComponentFixture<ParoleUnite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParoleUnite],
    }).compileComponents();

    fixture = TestBed.createComponent(ParoleUnite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
