// Service Worker for Assessment Notifications v2
// 메인 스레드의 주기적 체크 시스템과 함께 작동합니다.
// SW는 알림 표시와 클릭 처리만 담당합니다.

const SW_VERSION = 'v2';

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log(`[SW ${SW_VERSION}] Service Worker 설치됨`);
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log(`[SW ${SW_VERSION}] Service Worker 활성화됨`);
  event.waitUntil(self.clients.claim());
});

// 메시지 수신 - 메인 스레드에서 알림 표시 요청
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  if (type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = payload;
    self.registration.showNotification(title, {
      body: body,
      icon: '/images/Notification.jpg',
      badge: '/images/Notification.jpg',
      tag: tag || 'assessment-notification',
      requireInteraction: true,
      vibrate: [200, 100, 200],
    });
    console.log(`[SW ${SW_VERSION}] 알림 표시: ${tag}`);
  }

  if (type === 'PING') {
    // 메인 스레드에서 SW 활성 상태 확인용
    event.source?.postMessage({ type: 'PONG', version: SW_VERSION });
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