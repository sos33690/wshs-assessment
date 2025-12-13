import { Assessment } from '@/types/assessment';

// 브라우저 알림 권한 요청
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('이 브라우저는 알림을 지원하지 않습니다');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// 수행평가 알림 스케줄링
export const scheduleNotification = (assessment: Assessment): void => {
  if (Notification.permission !== 'granted') {
    return;
  }

  const assessmentDate = new Date(assessment.date);
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

    const scheduleTime = (notificationDate: Date, daysText: string) => {
      const timeUntilNotification = notificationDate.getTime() - now.getTime();
      
      if (timeUntilNotification > 0) {
        setTimeout(() => {
          new Notification('수행평가 알림', {
            body: `${daysText} ${assessment.subject} 수행평가가 있습니다.\n${assessment.description || ''}`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: `assessment-${assessment.id}-${daysText}`,
            requireInteraction: false
          });
        }, timeUntilNotification);
      }
    };

    scheduleTime(threeDaysBefore, '3일 후');
    scheduleTime(oneDayBefore, '내일');
    scheduleTime(sameDay, '오늘');
  }
};

// 즉시 테스트 알림 보내기
export const sendTestNotification = (): void => {
  if (Notification.permission === 'granted') {
    new Notification('수행평가 알림 테스트', {
      body: '알림이 정상적으로 작동합니다!',
      icon: '/favicon.svg',
      badge: '/favicon.svg'
    });
  }
};