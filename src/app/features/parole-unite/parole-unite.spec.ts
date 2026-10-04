import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ParoleUnite } from './parole-unite';

describe('ParoleUnite', () => {
  let component: ParoleUnite;
  let fixture: ComponentFixture<ParoleUnite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParoleUnite],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ParoleUnite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
