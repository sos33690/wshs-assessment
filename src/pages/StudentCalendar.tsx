import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Assessment } from '@/types/assessment';
import { getAssessmentsByClass } from '@/lib/firebaseStorage';
import {
  requestNotificationPermission,
  scheduleNotification,
  sendTestNotification,
  getPermissionResetGuide,
  getNotificationPermission,
  isNotificationSupported,
} from '@/lib/notification';
import { ChevronLeft, Bell, BellOff, CheckCircle2, Clock, BellRing, ChevronDown, AlertTriangle } from 'lucide-react';
import { ko } from 'date-fns/locale';

export default function StudentCalendar() {
  const [searchParams] = useSearchParams();
  const grade = parseInt(searchParams.get('grade') || '1');
  const classNumber = parseInt(searchParams.get('class') || '1');

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  useEffect(() => {
    loadAssessments();
    checkNotificationPermission();
  }, [grade, classNumber]);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const data = await getAssessmentsByClass(grade, classNumber);
      setAssessments(data);

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        data.forEach((assessment) => {
          scheduleNotification(assessment);
        });
      }
    } catch {
      toast.error('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationPermission = () => {
    if (typeof Notification !== 'undefined') {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const handleEnableNotifications = async () => {
    if (!isNotificationSupported()) {
      toast.error('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    const currentPermission = getNotificationPermission();

    // 이미 denied 상태이면 브라우저에서 재요청 불가 → 안내 다이얼로그 표시
    if (currentPermission === 'denied') {
      setShowPermissionGuide(true);
      return;
    }

    const result = await requestNotificationPermission();

    if (result.granted) {
      setNotificationsEnabled(true);
      assessments.forEach((assessment) => {
        scheduleNotification(assessment);
      });
      toast.success('알림이 활성화되었습니다! 🎉');
    } else if (result.status === 'denied') {
      // 방금 거부한 경우
      setShowPermissionGuide(true);
    } else {
      toast.info('알림 권한 요청이 취소되었습니다. 다시 시도해주세요.');
    }
  };

  const handleTestNotification = () => {
    sendTestNotification();
    toast.success('테스트 알림을 전송했습니다!');
  };

  const isPastDate = (dateStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const assessmentDate = new Date(dateStr);
    assessmentDate.setHours(0, 0, 0, 0);
    return assessmentDate < today;
  };

  const isToday = (dateStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const assessmentDate = new Date(dateStr);
    assessmentDate.setHours(0, 0, 0, 0);
    return assessmentDate.getTime() === today.getTime();
  };

  const getAssessmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return assessments.filter((a) => a.date === dateStr);
  };

  const upcomingAssessments = assessments.filter((a) => !isPastDate(a.date));
  const completedAssessments = assessments.filter((a) => isPastDate(a.date));
  const selectedDateAssessments = selectedDate ? getAssessmentsForDate(selectedDate) : [];

  const upcomingDates = upcomingAssessments.map((a) => new Date(a.date));
  const completedDates = completedAssessments.map((a) => new Date(a.date));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Sticky mobile header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-3 py-2.5 sm:px-6 sm:py-3 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="touch-manipulation -ml-2 px-2"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">돌아가기</span>
          </Button>

          <h1 className="text-sm sm:text-base font-semibold text-gray-800 truncate">
            {grade}학년 {classNumber}반
          </h1>

          <div className="flex items-center gap-1.5">
            {notificationsEnabled && (
              <Button
                variant="ghost"
                size="sm"
                className="touch-manipulation px-2"
                onClick={handleTestNotification}
              >
                <BellRing className="w-4 h-4" />
                <span className="hidden sm:inline ml-1.5">테스트</span>
              </Button>
            )}
            <Button
              variant={notificationsEnabled ? 'ghost' : 'default'}
              size="sm"
              className="touch-manipulation px-2 sm:px-3"
              onClick={handleEnableNotifications}
              disabled={notificationsEnabled}
            >
              {notificationsEnabled ? (
                <>
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">알림 ON</span>
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">알림 활성화</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 알림 권한 안내 다이얼로그 */}
      <Dialog open={showPermissionGuide} onOpenChange={setShowPermissionGuide}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              알림 권한 설정 필요
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p className="text-sm">
                이 사이트의 알림 권한이 <strong className="text-red-600">차단</strong> 상태입니다.
                브라우저에서 직접 권한을 변경해야 합니다.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-amber-800 mb-2">📋 설정 변경 방법:</p>
                <p className="text-amber-700 leading-relaxed">{getPermissionResetGuide()}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-blue-800 mb-1">💡 간단한 방법:</p>
                <ol className="text-blue-700 space-y-1 list-decimal list-inside text-xs sm:text-sm">
                  <li>주소창 왼쪽의 <strong>🔒 자물쇠</strong> 아이콘을 탭하세요</li>
                  <li><strong>"사이트 설정"</strong> 또는 <strong>"권한"</strong>을 탭하세요</li>
                  <li><strong>"알림"</strong> 항목을 찾아 <strong>"허용"</strong>으로 변경하세요</li>
                  <li>페이지를 <strong>새로고침</strong>한 후 다시 시도하세요</li>
                </ol>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowPermissionGuide(false)}
              className="w-full sm:w-auto"
            >
              닫기
            </Button>
            <Button
              onClick={() => {
                setShowPermissionGuide(false);
                window.location.reload();
              }}
              className="w-full sm:w-auto"
            >
              새로고침
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto px-3 py-4 sm:px-6 sm:py-6 md:px-8 space-y-4 sm:space-y-6">
        {/* 알림 안내 카드 */}
        {notificationsEnabled && (
          <Card className="border-green-200 bg-green-50 shadow-sm">
            <CardContent className="pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-6">
              <div className="flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-green-800 min-w-0">
                  <p className="font-semibold mb-1">🔔 알림이 활성화되었습니다!</p>
                  <ul className="list-disc list-inside space-y-0.5 text-green-700 text-[11px] sm:text-sm">
                    <li>
                      수행평가 <strong>3일 전</strong> 알림
                    </li>
                    <li>
                      수행평가 <strong>1일 전</strong> 알림
                    </li>
                    <li>
                      수행평가 <strong>당일</strong> 알림
                    </li>
                  </ul>
                  <p className="mt-1.5 text-[10px] sm:text-xs text-green-600">
                    ⚠️ 이 페이지를 열어둔 상태에서만 알림이 작동합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 캘린더 + 선택된 날짜 수행평가 */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
            <CardTitle className="text-base sm:text-lg">수행평가 일정</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {loading ? (
                '데이터를 불러오는 중...'
              ) : (
                <>
                  예정 <strong>{upcomingAssessments.length}개</strong>
                  {completedAssessments.length > 0 && (
                    <>
                      {' '}
                      · 완료 <strong>{completedAssessments.length}개</strong>
                    </>
                  )}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4 sm:px-6 sm:pb-6">
            <div className="flex flex-col md:grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* 캘린더 영역 */}
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ko}
                  className="rounded-md border w-full"
                  modifiers={{
                    upcoming: upcomingDates,
                    completed: completedDates,
                  }}
                  modifiersStyles={{
                    upcoming: {
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      color: '#3b82f6',
                    },
                    completed: {
                      fontWeight: 'bold',
                      color: '#22c55e',
                      textDecoration: 'line-through',
                    },
                  }}
                />
                <div className="mt-2 flex items-center justify-center gap-4 text-[11px] sm:text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    <span>예정</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                    <span>완료</span>
                  </div>
                </div>
              </div>

              {/* 선택된 날짜의 수행평가 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm sm:text-lg px-1">
                  {selectedDate
                    ? selectedDate.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '날짜를 선택하세요'}
                </h3>

                {loading ? (
                  <div className="text-center py-6 text-gray-500 text-sm">데이터를 불러오는 중...</div>
                ) : selectedDateAssessments.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    이 날짜에는 수행평가가 없습니다
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateAssessments.map((assessment) => {
                      const past = isPastDate(assessment.date);
                      const today = isToday(assessment.date);
                      return (
                        <Card
                          key={assessment.id}
                          className={`transition-colors ${
                            past
                              ? 'opacity-70 border-green-200 bg-green-50/50'
                              : today
                                ? 'border-orange-200 bg-orange-50/50'
                                : ''
                          }`}
                        >
                          <CardContent className="p-3 sm:pt-5 sm:pb-4 sm:px-5">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge className="text-[11px] sm:text-xs">{assessment.subject}</Badge>
                              {past && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-700 border-green-300 text-[11px] sm:text-xs"
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                  완료
                                </Badge>
                              )}
                              {today && (
                                <Badge
                                  variant="secondary"
                                  className="bg-orange-100 text-orange-700 border-orange-300 text-[11px] sm:text-xs"
                                >
                                  <Clock className="w-3 h-3 mr-0.5" />
                                  오늘
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                              {assessment.description}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 예정된 수행평가 목록 */}
        <Card className="shadow-sm">
          <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              예정된 수행평가
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              아직 완료되지 않은 수행평가 목록입니다
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            {loading ? (
              <div className="text-center py-6 text-gray-500 text-sm">데이터를 불러오는 중...</div>
            ) : upcomingAssessments.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">예정된 수행평가가 없습니다 🎉</div>
            ) : (
              <div className="space-y-2">
                {upcomingAssessments
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((assessment) => {
                    const today = isToday(assessment.date);
                    const daysUntil = Math.ceil(
                      (new Date(assessment.date).getTime() - new Date().setHours(0, 0, 0, 0)) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      <Card
                        key={assessment.id}
                        className={`touch-manipulation active:scale-[0.99] transition-all ${
                          today ? 'border-orange-200 bg-orange-50/50' : ''
                        }`}
                      >
                        <CardContent className="p-3 sm:pt-5 sm:pb-4 sm:px-5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge className="text-[11px] sm:text-xs">{assessment.subject}</Badge>
                                <span className="text-xs sm:text-sm font-medium text-gray-600">
                                  {new Date(assessment.date).toLocaleDateString('ko-KR')}
                                </span>
                                {today && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-orange-100 text-orange-700 border-orange-300 text-[11px] sm:text-xs"
                                  >
                                    <Clock className="w-3 h-3 mr-0.5" />
                                    오늘
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                                {assessment.description}
                              </p>
                            </div>
                            {!today && (
                              <div className="flex-shrink-0 bg-blue-50 text-blue-600 rounded-lg px-2 py-1 text-center min-w-[48px]">
                                <span className="text-xs font-bold">D-{daysUntil}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 완료된 수행평가 (접이식) */}
        {completedAssessments.length > 0 && (
          <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
            <Card className="border-green-200 shadow-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="px-3 py-3 sm:px-6 sm:py-4 cursor-pointer touch-manipulation active:bg-green-50/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-green-700">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        완료된 수행평가 ({completedAssessments.length}개)
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">
                        탭하여 {completedOpen ? '접기' : '펼치기'}
                      </CardDescription>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-green-600 transition-transform duration-200 ${
                        completedOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6 pt-0">
                  <div className="space-y-2">
                    {completedAssessments
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((assessment) => (
                        <Card key={assessment.id} className="opacity-70 bg-green-50/30">
                          <CardContent className="p-3 sm:pt-5 sm:pb-4 sm:px-5">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 text-[11px] sm:text-xs"
                              >
                                {assessment.subject}
                              </Badge>
                              <span className="text-xs sm:text-sm font-medium text-gray-500 line-through">
                                {new Date(assessment.date).toLocaleDateString('ko-KR')}
                              </span>
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 border-green-300 text-[11px] sm:text-xs"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                완료
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                              {assessment.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Bottom safe area for mobile */}
        <div className="h-4 sm:h-0" />
      </div>
    </div>
  );
}