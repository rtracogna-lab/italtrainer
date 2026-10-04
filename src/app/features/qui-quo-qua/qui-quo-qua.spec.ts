import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QuiQuoQua } from './qui-quo-qua';

describe('QuiQuoQua', () => {
  let component: QuiQuoQua;
  let fixture: ComponentFixture<QuiQuoQua>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuiQuoQua],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(QuiQuoQua);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
