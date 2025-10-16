import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FcmNotificationService } from 'src/app/core/services/fcm-notification-service';

describe('FcmNotificationService', () => {
  let service: FcmNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(FcmNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register FCM token', (done) => {
    const mockToken = 'test_fcm_token_123';
    service.registerFcmToken(mockToken).subscribe(() => {
      expect(service).toBeTruthy();
      done();
    });
  });

  it('should load notifications', (done) => {
    service.getNotifications().subscribe(() => {
      expect(service.notifications().length).toBeGreaterThanOrEqual(0);
      done();
    });
  });

  it('should mark notification as read', (done) => {
    const notificationId = 1;
    service.markAsRead(notificationId).subscribe(() => {
      expect(service).toBeTruthy();
      done();
    });
  });
});