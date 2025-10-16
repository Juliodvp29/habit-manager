import { TestBed } from '@angular/core/testing';

import { FcmNotificationService } from './fcm-notification-service';

describe('FcmNotificationService', () => {
  let service: FcmNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FcmNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
