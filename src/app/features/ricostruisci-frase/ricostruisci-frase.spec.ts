import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RicostruisciFrase } from './ricostruisci-frase';

describe('RicostruisciFrase', () => {
  let component: RicostruisciFrase;
  let fixture: ComponentFixture<RicostruisciFrase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RicostruisciFrase],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RicostruisciFrase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
