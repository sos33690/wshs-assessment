import { Assessment } from '@/types/assessment';

// ============================================================
// 알림 시스템 v2 - Periodic Check 방식
// 브라우저 탭이 열려있으면 (백그라운드 탭 포함) 알림이 작동합니다.
// ============================================================

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
  return Notification.permission;
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
    console.log('[알림] Service Worker 등록 성공:', registration.scope);

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

// ============================================================
// localStorage 기반 알림 스케줄 관리
// ============================================================

const SCHEDULE_STORAGE_KEY = 'assessment_notification_schedules';
const SENT_STORAGE_KEY = 'assessment_notifications_sent';

interface NotificationSchedule {
  id: string; // assessment.id + daysText
  assessmentId: string;
  subject: string;
  description: string;
  date: string; // assessment date (YYYY-MM-DD)
  daysText: string; // '3일 후', '내일', '오늘'
  notifyAt: number; // timestamp when notification should fire
}

// 스케줄 저장
const saveSchedules = (schedules: NotificationSchedule[]): void => {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedules));
  } catch {
    console.error('[알림] 스케줄 저장 실패');
  }
};

// 스케줄 로드
const loadSchedules = (): NotificationSchedule[] => {
  try {
    const data = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// 이미 전송된 알림 ID 관리
const getSentNotifications = (): Set<string> => {
  try {
    const data = localStorage.getItem(SENT_STORAGE_KEY);
    return data ? new Set(JSON.parse(data)) : new Set();
  } catch {
    return new Set();
  }
};

const markAsSent = (id: string): void => {
  try {
    const sent = getSentNotifications();
    sent.add(id);
    // 최대 500개까지만 유지 (오래된 것 정리)
    const arr = Array.from(sent);
    if (arr.length > 500) {
      arr.splice(0, arr.length - 500);
    }
    localStorage.setItem(SENT_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    console.error('[알림] 전송 기록 저장 실패');
  }
};

// YYYY-MM-DD 문자열을 로컬 타임존 기준 Date로 파싱
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// ============================================================
// 알림 표시 함수
// ============================================================

const showNotification = async (title: string, body: string, tag: string): Promise<void> => {
  // Service Worker를 통한 알림 (백그라운드 탭에서도 작동)
  if (isServiceWorkerSupported()) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/images/Notification.jpg',
        badge: '/images/Notification.jpg',
        tag,
        requireInteraction: true,
        vibrate: [200, 100, 200],
      });
      console.log(`[알림] SW를 통해 알림 표시: ${tag}`);
      return;
    } catch (error) {
      console.warn('[알림] SW 알림 실패, 폴백 사용:', error);
    }
  }

  // 폴백: 기존 Notification API
  try {
    new Notification(title, {
      body,
      icon: '/images/Notification.jpg',
      badge: '/images/Notification.jpg',
      tag,
      requireInteraction: true,
    });
    console.log(`[알림] Notification API로 알림 표시: ${tag}`);
  } catch (error) {
    console.error('[알림] 알림 표시 실패:', error);
  }
};

// ============================================================
// 주기적 체크 시스템
// ============================================================

let checkIntervalId: ReturnType<typeof setInterval> | null = null;

// 알림 스케줄 체크 및 전송
const checkAndFireNotifications = (): void => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const now = Date.now();
  const schedules = loadSchedules();
  const sent = getSentNotifications();
  let hasChanges = false;

  for (const schedule of schedules) {
    // 이미 전송된 알림은 건너뛰기
    if (sent.has(schedule.id)) continue;

    // 알림 시간이 되었거나 지났으면 (최대 30분 이내 지연만 허용)
    if (now >= schedule.notifyAt && now - schedule.notifyAt < 30 * 60 * 1000) {
      const title = '📚 수행평가 알림';
      const body = `${schedule.daysText} ${schedule.subject} 수행평가가 있습니다!\n${schedule.description || ''}\n📅 ${schedule.date}`;
      const tag = `assessment-${schedule.id}`;

      showNotification(title, body, tag);
      markAsSent(schedule.id);
      hasChanges = true;

      console.log(`[알림] 전송됨: ${schedule.subject} - ${schedule.daysText}`);
    }
  }

  // 만료된 스케줄 정리 (30분 이상 지난 것)
  if (hasChanges) {
    const updatedSchedules = schedules.filter(
      (s) => !sent.has(s.id) && now - s.notifyAt < 30 * 60 * 1000
    );
    saveSchedules(updatedSchedules);
  }
};

// 주기적 체크 시작 (30초마다)
export const startNotificationChecker = (): void => {
  if (checkIntervalId !== null) {
    console.log('[알림] 체커가 이미 실행 중입니다');
    return;
  }

  // 즉시 한 번 체크
  checkAndFireNotifications();

  // 30초마다 체크
  checkIntervalId = setInterval(checkAndFireNotifications, 30 * 1000);
  console.log('[알림] 주기적 체크 시작 (30초 간격)');

  // 탭이 다시 활성화될 때 즉시 체크 (놓친 알림 처리)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[알림] 탭 활성화 - 즉시 체크');
      checkAndFireNotifications();
    }
  });
};

// 주기적 체크 중지
export const stopNotificationChecker = (): void => {
  if (checkIntervalId !== null) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
    console.log('[알림] 주기적 체크 중지');
  }
};

// ============================================================
// 수행평가 알림 스케줄링
// ============================================================

// 브라우저 알림 권한 요청
export const requestNotificationPermission = async (): Promise<{
  granted: boolean;
  status: 'granted' | 'denied' | 'default' | 'unsupported';
}> => {
  if (!isNotificationSupported()) {
    return { granted: false, status: 'unsupported' };
  }

  if (Notification.permission === 'granted') {
    await registerServiceWorker();
    return { granted: true, status: 'granted' };
  }

  if (Notification.permission === 'denied') {
    return { granted: false, status: 'denied' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
    }
    return { granted: permission === 'granted', status: permission as 'granted' | 'denied' | 'default' };
  } catch (error) {
    console.error('알림 권한 요청 실패:', error);
    return { granted: false, status: 'denied' };
  }
};

// 수행평가 알림 스케줄링
export const scheduleNotification = async (assessment: Assessment): Promise<void> => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const assessmentDate = parseLocalDate(assessment.date);
  const now = new Date();

  if (assessmentDate <= now) {
    // 이미 지난 수행평가는 스케줄링하지 않음
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const assessDay = new Date(assessmentDate);
    assessDay.setHours(0, 0, 0, 0);
    if (assessDay < today) return;
  }

  const existingSchedules = loadSchedules();
  const sent = getSentNotifications();
  const newSchedules: NotificationSchedule[] = [];

  // 3일 전 알림 (오전 9시)
  const threeDaysBefore = new Date(assessmentDate);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
  threeDaysBefore.setHours(9, 0, 0, 0);

  // 1일 전 알림 (오전 9시)
  const oneDayBefore = new Date(assessmentDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  oneDayBefore.setHours(9, 0, 0, 0);

  // 당일 알림 (오전 7시)
  const sameDay = new Date(assessmentDate);
  sameDay.setHours(7, 0, 0, 0);

  const timings: Array<{ date: Date; text: string }> = [
    { date: threeDaysBefore, text: '3일 후' },
    { date: oneDayBefore, text: '내일' },
    { date: sameDay, text: '오늘' },
  ];

  for (const timing of timings) {
    const scheduleId = `${assessment.id}-${timing.text}`;

    // 이미 전송된 알림은 건너뛰기
    if (sent.has(scheduleId)) continue;

    // 이미 스케줄에 있으면 건너뛰기
    if (existingSchedules.some((s) => s.id === scheduleId)) continue;

    // 미래 시간만 스케줄링
    if (timing.date.getTime() > now.getTime()) {
      newSchedules.push({
        id: scheduleId,
        assessmentId: assessment.id,
        subject: assessment.subject,
        description: assessment.description || '',
        date: assessment.date,
        daysText: timing.text,
        notifyAt: timing.date.getTime(),
      });

      console.log(
        `[알림] 스케줄 추가: ${assessment.subject} - ${timing.text} (${timing.date.toLocaleString('ko-KR')})`
      );
    }
  }

  if (newSchedules.length > 0) {
    saveSchedules([...existingSchedules, ...newSchedules]);
  }
};

// 모든 수행평가 알림 일괄 스케줄링
export const scheduleAllNotifications = async (assessments: Assessment[]): Promise<number> => {
  let count = 0;
  for (const assessment of assessments) {
    await scheduleNotification(assessment);
    count++;
  }

  // 스케줄링 후 체커 시작
  startNotificationChecker();

  const schedules = loadSchedules();
  console.log(`[알림] 총 ${schedules.length}개 알림 스케줄됨`);
  return schedules.length;
};

// 즉시 테스트 알림 보내기
export const sendTestNotification = async (): Promise<void> => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const title = '📚 수행평가 알림 테스트';
  const body = '알림이 정상적으로 작동합니다! 🎉\n수행평가 3일 전, 1일 전, 당일에 알림을 받게 됩니다.\n\n💡 이 탭을 열어두면 백그라운드에서도 알림이 전송됩니다.';

  await showNotification(title, body, 'test-notification');
};

// 현재 스케줄 상태 조회 (디버깅용)
export const getScheduleStatus = (): {
  pending: number;
  sent: number;
  schedules: NotificationSchedule[];
} => {
  const schedules = loadSchedules();
  const sent = getSentNotifications();
  const now = Date.now();

  const pending = schedules.filter(
    (s) => !sent.has(s.id) && s.notifyAt > now
  );

  return {
    pending: pending.length,
    sent: sent.size,
    schedules: pending.sort((a, b) => a.notifyAt - b.notifyAt),
  };
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