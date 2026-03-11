// Service Worker for Assessment Notifications
// 브라우저가 백그라운드에 있을 때도 알림을 표시할 수 있습니다.

const CACHE_NAME = 'assessment-sw-v1';

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker 설치됨');
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker 활성화됨');
  event.waitUntil(self.clients.claim());
});

// 메시지 수신 - 메인 스레드에서 알림 스케줄링 요청
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  if (type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, tag, delay } = payload;
    
    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification(title, {
          body: body,
          icon: '/images/Notification.jpg',
          badge: '/images/Notification.jpg',
          tag: tag,
          requireInteraction: true,
          vibrate: [200, 100, 200],
        });
      }, delay);
      
      console.log(`[SW] 알림 스케줄됨: ${tag} (${Math.round(delay / 1000 / 60)}분 후)`);
    }
  }

  if (type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = payload;
    self.registration.showNotification(title, {
      body: body,
      icon: '/images/Notification.jpg',
      badge: '/images/Notification.jpg',
      tag: tag || 'test-notification',
      requireInteraction: false,
      vibrate: [200, 100, 200],
    });
  }
});

// 알림 클릭 시 사이트로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // 열린 탭이 없으면 새 탭 열기
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});