import { TestBed } from '@angular/core/testing';

import { ProtectorsService } from './protectors.service';

describe('ProtectorsService', () => {
  let service: ProtectorsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProtectorsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
