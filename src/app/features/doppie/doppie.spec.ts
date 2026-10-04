import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Doppie } from './doppie';

describe('Doppie', () => {
  let component: Doppie;
  let fixture: ComponentFixture<Doppie>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Doppie],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Doppie);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
