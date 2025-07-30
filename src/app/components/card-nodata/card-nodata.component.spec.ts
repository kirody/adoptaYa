import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardNodataComponent } from './card-nodata.component';

describe('CardNodataComponent', () => {
  let component: CardNodataComponent;
  let fixture: ComponentFixture<CardNodataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardNodataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardNodataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
