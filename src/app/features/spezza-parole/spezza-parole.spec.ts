import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SpezzaParole } from './spezza-parole';

describe('SpezzaParole', () => {
  let component: SpezzaParole;
  let fixture: ComponentFixture<SpezzaParole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpezzaParole],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SpezzaParole);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
