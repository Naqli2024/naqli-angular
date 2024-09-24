import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperUserPaymentsComponent } from './super-user-payments.component';

describe('SuperUserPaymentsComponent', () => {
  let component: SuperUserPaymentsComponent;
  let fixture: ComponentFixture<SuperUserPaymentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperUserPaymentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SuperUserPaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
