import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtectorsTableComponent } from './protectors-table.component';

describe('ProtectorsTableComponent', () => {
  let component: ProtectorsTableComponent;
  let fixture: ComponentFixture<ProtectorsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProtectorsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProtectorsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
