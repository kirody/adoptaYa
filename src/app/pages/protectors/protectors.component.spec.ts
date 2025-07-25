import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtectorsComponent } from './protectors.component';

describe('ProtectorsComponent', () => {
  let component: ProtectorsComponent;
  let fixture: ComponentFixture<ProtectorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProtectorsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProtectorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
