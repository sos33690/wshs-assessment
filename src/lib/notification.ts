import { Assessment } from '@/types/assessment';

// Service Worker 등록 상태
let swRegistration: ServiceWorkerRegistration | null = null;

// 브라우저 알림 지원 여부 확인
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Service Worker 지원 여부 확인
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// 현재 알림 권한 상태 반환
export const getNotificationPermission = (): string => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default', 'granted', 'denied'
};

// Service Worker 등록
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) {
    console.log('[알림] Service Worker를 지원하지 않는 브라우저입니다');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    swRegistration = registration;
    console.log('[알림] Service Worker 등록 성공:', registration.scope);

    // Service Worker가 활성화될 때까지 대기
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        registration.installing!.addEventListener('statechange', (e) => {
          if ((e.target as ServiceWorker).state === 'activated') {
            resolve();
          }
        });
      });
    }

    return registration;
  } catch (error) {
    console.error('[알림] Service Worker 등록 실패:', error);
    return null;
  }
};

// Service Worker 가져오기 (이미 등록된 경우)
const getServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (swRegistration) return swRegistration;

  if (!isServiceWorkerSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    swRegistration = registration;
    return registration;
  } catch {
    return null;
  }
};

// 브라우저 알림 권한 요청
export const requestNotificationPermission = async (): Promise<{
  granted: boolean;
  status: 'granted' | 'denied' | 'default' | 'unsupported';
}> => {
  if (!isNotificationSupported()) {
    console.log('이 브라우저는 알림을 지원하지 않습니다');
    return { granted: false, status: 'unsupported' };
  }

  if (Notification.permission === 'granted') {
    // Service Worker도 함께 등록
    await registerServiceWorker();
    return { granted: true, status: 'granted' };
  }

  if (Notification.permission === 'denied') {
    console.log('알림 권한이 이전에 거부되었습니다. 사이트 설정에서 직접 변경해야 합니다.');
    return { granted: false, status: 'denied' };
  }

  // 'default' 상태 - 권한 요청 가능
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // 권한 허용 시 Service Worker 등록
      await registerServiceWorker();
    }
    return { granted: permission === 'granted', status: permission as 'granted' | 'denied' | 'default' };
  } catch (error) {
    console.error('알림 권한 요청 실패:', error);
    return { granted: false, status: 'denied' };
  }
};

// 이미 스케줄된 알림 추적 (중복 방지)
const scheduledNotifications = new Set<string>();

// YYYY-MM-DD 문자열을 로컬 타임존 기준 Date로 파싱
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Service Worker를 통해 알림 스케줄링
const scheduleViaSW = async (title: string, body: string, tag: string, delay: number): Promise<boolean> => {
  const sw = await getServiceWorker();
  if (sw && sw.active) {
    sw.active.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      payload: { title, body, tag, delay },
    });
    return true;
  }
  return false;
};

// 수행평가 알림 스케줄링
export const scheduleNotification = async (assessment: Assessment): Promise<void> => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const assessmentDate = parseLocalDate(assessment.date);
  const now = new Date();

  // 수행평가 날짜가 미래인 경우에만 알림 설정
  if (assessmentDate > now) {
    // 수행평가 3일 전 알림
    const threeDaysBefore = new Date(assessmentDate);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
    threeDaysBefore.setHours(9, 0, 0, 0); // 오전 9시

    // 수행평가 1일 전 알림
    const oneDayBefore = new Date(assessmentDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    oneDayBefore.setHours(9, 0, 0, 0); // 오전 9시

    // 수행평가 당일 알림
    const sameDay = new Date(assessmentDate);
    sameDay.setHours(7, 0, 0, 0); // 오전 7시

    const scheduleTime = async (notificationDate: Date, daysText: string) => {
      const notificationKey = `${assessment.id}-${daysText}`;

      // 이미 스케줄된 알림은 건너뛰기
      if (scheduledNotifications.has(notificationKey)) {
        return;
      }

      const timeUntilNotification = notificationDate.getTime() - now.getTime();

      if (timeUntilNotification > 0) {
        scheduledNotifications.add(notificationKey);

        const title = '📚 수행평가 알림';
        const body = `${daysText} ${assessment.subject} 수행평가가 있습니다!\n${assessment.description || ''}\n📅 ${assessment.date}`;
        const tag = `assessment-${notificationKey}`;

        // Service Worker를 통해 스케줄링 시도
        const swScheduled = await scheduleViaSW(title, body, tag, timeUntilNotification);

        if (!swScheduled) {
          // Service Worker 사용 불가 시 기존 setTimeout 방식으로 폴백
          setTimeout(() => {
            try {
              new Notification(title, {
                body: body,
                icon: '/images/Notification.jpg',
                badge: '/images/Notification.jpg',
                tag: tag,
                requireInteraction: true,
              });
            } catch (error) {
              console.error('알림 전송 실패:', error);
            }
            scheduledNotifications.delete(notificationKey);
          }, timeUntilNotification);
        }

        console.log(
          `[알림] 스케줄됨: ${assessment.subject} - ${daysText} (${Math.round(timeUntilNotification / 1000 / 60)}분 후) [${swScheduled ? 'SW' : 'setTimeout'}]`
        );
      }
    };

    await scheduleTime(threeDaysBefore, '3일 후');
    await scheduleTime(oneDayBefore, '내일');
    await scheduleTime(sameDay, '오늘');
  }
};

// 즉시 테스트 알림 보내기
export const sendTestNotification = async (): Promise<void> => {
  if (!isNotificationSupported()) {
    console.log('이 브라우저는 알림을 지원하지 않습니다');
    return;
  }

  if (Notification.permission !== 'granted') return;

  const title = '📚 수행평가 알림 테스트';
  const body = '알림이 정상적으로 작동합니다! 🎉\n수행평가 3일 전, 1일 전, 당일에 알림을 받게 됩니다.';

  // Service Worker를 통해 알림 표시 시도
  const sw = await getServiceWorker();
  if (sw && sw.active) {
    sw.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: { title, body, tag: 'test-notification' },
    });
    console.log('[알림] Service Worker를 통해 테스트 알림 전송');
  } else {
    // 폴백: 기존 Notification API
    try {
      new Notification(title, {
        body: body,
        icon: '/images/Notification.jpg',
        badge: '/images/Notification.jpg',
        requireInteraction: false,
      });
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
    }
  }
};

// 브라우저별 알림 권한 재설정 안내 메시지 생성
export const getPermissionResetGuide = (): string => {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('samsung')) {
    return '삼성 인터넷: 주소창 왼쪽 🔒 아이콘 → 사이트 설정 → 알림 → 허용으로 변경';
  } else if (ua.includes('crios') || ua.includes('chrome')) {
    return 'Chrome: 주소창 왼쪽 🔒 아이콘 탭 → "사이트 설정" → "알림" → "허용"으로 변경';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'Safari: 설정 → Safari → 웹사이트 → 알림 → 이 사이트를 "허용"으로 변경';
  } else if (ua.includes('firefox') || ua.includes('fxios')) {
    return 'Firefox: 주소창 왼쪽 🔒 아이콘 → 알림 → "허용"으로 변경';
  } else if (ua.includes('edg')) {
    return 'Edge: 주소창 왼쪽 🔒 아이콘 → 사이트 권한 → 알림 → "허용"으로 변경';
  }

  return '주소창 왼쪽의 🔒(자물쇠) 아이콘을 탭 → 사이트 설정 → 알림 → "허용"으로 변경해주세요';
};