import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtectorFormComponent } from './protector-form.component';

describe('ProtectorFormComponent', () => {
  let component: ProtectorFormComponent;
  let fixture: ComponentFixture<ProtectorFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProtectorFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProtectorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
