import { Assessment } from '@/types/assessment';

// 브라우저 알림 지원 여부 확인
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// 브라우저 알림 권한 요청
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
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

// 이미 스케줄된 알림 추적 (중복 방지)
const scheduledNotifications = new Set<string>();

// 수행평가 알림 스케줄링
export const scheduleNotification = (assessment: Assessment): void => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
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
      const notificationKey = `${assessment.id}-${daysText}`;
      
      // 이미 스케줄된 알림은 건너뛰기
      if (scheduledNotifications.has(notificationKey)) {
        return;
      }
      
      const timeUntilNotification = notificationDate.getTime() - now.getTime();
      
      if (timeUntilNotification > 0) {
        scheduledNotifications.add(notificationKey);
        
        setTimeout(() => {
          try {
            new Notification('📚 수행평가 알림', {
              body: `${daysText} ${assessment.subject} 수행평가가 있습니다!\n${assessment.description || ''}\n📅 ${assessment.date}`,
              icon: '/images/Notification.jpg',
              badge: '/images/Notification.jpg',
              tag: `assessment-${notificationKey}`,
              requireInteraction: true,
            });
          } catch (error) {
            console.error('알림 전송 실패:', error);
          }
          
          // 전송 후 Set에서 제거
          scheduledNotifications.delete(notificationKey);
        }, timeUntilNotification);
        
        console.log(`알림 스케줄됨: ${assessment.subject} - ${daysText} (${Math.round(timeUntilNotification / 1000 / 60)}분 후)`);
      }
    };

    scheduleTime(threeDaysBefore, '3일 후');
    scheduleTime(oneDayBefore, '내일');
    scheduleTime(sameDay, '오늘');
  }
};

// 즉시 테스트 알림 보내기
export const sendTestNotification = (): void => {
  if (!isNotificationSupported()) {
    console.log('이 브라우저는 알림을 지원하지 않습니다');
    return;
  }
  
  if (Notification.permission === 'granted') {
    try {
      new Notification('📚 수행평가 알림 테스트', {
        body: '알림이 정상적으로 작동합니다! 🎉\n수행평가 3일 전, 1일 전, 당일에 알림을 받게 됩니다.',
        icon: '/images/Notification.jpg',
        badge: '/images/Notification.jpg',
        requireInteraction: false,
      });
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
    }
  }
};