import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HannoAnno } from './hanno-anno';

describe('HannoAnno', () => {
  let component: HannoAnno;
  let fixture: ComponentFixture<HannoAnno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HannoAnno],
    }).compileComponents();

    fixture = TestBed.createComponent(HannoAnno);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
