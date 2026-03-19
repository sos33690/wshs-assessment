import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
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
  registerServiceWorker,
  scheduleAllNotifications,
  startNotificationChecker,
  stopNotificationChecker,
  sendTestNotification,
  getPermissionResetGuide,
  getNotificationPermission,
  isNotificationSupported,
  isServiceWorkerSupported,
  getScheduleStatus,
} from '@/lib/notification';
import { getTheme, toggleTheme, applyTheme, type Theme } from '@/lib/theme';
import { getMemo, saveMemo } from '@/lib/memo';
import {
  ChevronLeft,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  BellRing,
  ChevronDown,
  AlertTriangle,
  Moon,
  Sun,
  Filter,
  X,
  StickyNote,
  Save,
} from 'lucide-react';
import { ko } from 'date-fns/locale';

// YYYY-MM-DD 문자열을 로컬 타임존 기준 Date로 파싱
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Date 객체를 YYYY-MM-DD 문자열로 변환
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function StudentCalendar() {
  const [searchParams] = useSearchParams();
  const grade = parseInt(searchParams.get('grade') || '1');
  const classNumber = parseInt(searchParams.get('class') || '1');

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [swReady, setSwReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState(0);

  // 다크모드
  const [theme, setThemeState] = useState<Theme>('light');

  // 과목 필터
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  // 개인 메모
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState('');
  const [memos, setMemos] = useState<Record<string, string>>({});

  // 다크모드 초기화
  useEffect(() => {
    const currentTheme = getTheme();
    setThemeState(currentTheme);
    applyTheme(currentTheme);
  }, []);

  useEffect(() => {
    loadAssessments();
    checkNotificationPermission();
    initServiceWorker();

    // 컴포넌트 언마운트 시 체커 중지
    return () => {
      stopNotificationChecker();
    };
  }, [grade, classNumber]);

  // 메모 로드
  const loadMemos = useCallback((assessmentList: Assessment[]) => {
    const loadedMemos: Record<string, string> = {};
    assessmentList.forEach((a) => {
      const memo = getMemo(a.id);
      if (memo) loadedMemos[a.id] = memo;
    });
    setMemos(loadedMemos);
  }, []);

  const initServiceWorker = async () => {
    if (isServiceWorkerSupported() && Notification.permission === 'granted') {
      const reg = await registerServiceWorker();
      if (reg) {
        setSwReady(true);
      }
    }
  };

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const data = await getAssessmentsByClass(grade, classNumber);
      setAssessments(data);
      loadMemos(data);

      // 알림이 허용된 상태면 스케줄링 + 체커 시작
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const count = await scheduleAllNotifications(data);
        setPendingNotifications(count);
      }
    } catch {
      toast.error('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationPermission = () => {
    if (typeof Notification !== 'undefined') {
      const granted = Notification.permission === 'granted';
      setNotificationsEnabled(granted);

      // 이미 허용된 상태면 체커 시작
      if (granted) {
        startNotificationChecker();
        const status = getScheduleStatus();
        setPendingNotifications(status.pending);
      }
    }
  };

  const handleEnableNotifications = async () => {
    if (!isNotificationSupported()) {
      toast.error('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    const currentPermission = getNotificationPermission();

    if (currentPermission === 'denied') {
      setShowPermissionGuide(true);
      return;
    }

    const result = await requestNotificationPermission();

    if (result.granted) {
      setNotificationsEnabled(true);
      const reg = await registerServiceWorker();
      if (reg) setSwReady(true);

      // 모든 수행평가 알림 스케줄링 + 체커 시작
      const count = await scheduleAllNotifications(assessments);
      setPendingNotifications(count);

      toast.success('알림이 활성화되었습니다! 🎉');
    } else if (result.status === 'denied') {
      setShowPermissionGuide(true);
    } else {
      toast.info('알림 권한 요청이 취소되었습니다. 다시 시도해주세요.');
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
    toast.success('테스트 알림을 전송했습니다!');
  };

  // 다크모드 토글
  const handleToggleTheme = () => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
  };

  // 과목 필터 토글
  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const clearFilter = () => {
    setSelectedSubjects([]);
  };

  // 메모 저장
  const handleSaveMemo = (assessmentId: string) => {
    saveMemo(assessmentId, memoText);
    setMemos((prev) => {
      const next = { ...prev };
      if (memoText.trim()) {
        next[assessmentId] = memoText.trim();
      } else {
        delete next[assessmentId];
      }
      return next;
    });
    setEditingMemoId(null);
    setMemoText('');
    toast.success('메모가 저장되었습니다!');
  };

  const handleEditMemo = (assessmentId: string) => {
    setEditingMemoId(assessmentId);
    setMemoText(memos[assessmentId] || '');
  };

  const isPastDate = (dateStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const assessmentDate = parseLocalDate(dateStr);
    assessmentDate.setHours(0, 0, 0, 0);
    return assessmentDate < today;
  };

  const isToday = (dateStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const assessmentDate = parseLocalDate(dateStr);
    assessmentDate.setHours(0, 0, 0, 0);
    return assessmentDate.getTime() === today.getTime();
  };

  // 완료된 수행평가는 필터 없이 항상 전체 표시
  const allCompletedAssessments = assessments.filter((a) => isPastDate(a.date));

  // 예정된 수행평가에만 과목 필터 적용
  const allUpcomingAssessments = assessments.filter((a) => !isPastDate(a.date));
  const upcomingAssessments =
    selectedSubjects.length > 0
      ? allUpcomingAssessments.filter((a) => selectedSubjects.includes(a.subject))
      : allUpcomingAssessments;

  // 완료된 수행평가는 필터 무관하게 전체 표시
  const completedAssessments = allCompletedAssessments;

  // 선택된 날짜의 수행평가: 예정은 필터 적용, 완료는 전체 표시
  const getAssessmentsForDate = (date: Date) => {
    const dateStr = formatLocalDate(date);
    const upcomingForDate = upcomingAssessments.filter((a) => a.date === dateStr);
    const completedForDate = allCompletedAssessments.filter((a) => a.date === dateStr);
    return [...upcomingForDate, ...completedForDate];
  };

  const selectedDateAssessments = selectedDate ? getAssessmentsForDate(selectedDate) : [];

  // 과목 필터에 표시할 과목 목록: 예정된 수행평가의 과목만 표시
  const availableSubjects = [...new Set(allUpcomingAssessments.map((a) => a.subject))].sort();

  // 캘린더 modifiers - 예정은 필터 적용, 완료는 전체 표시
  const upcomingDates = upcomingAssessments.map((a) => parseLocalDate(a.date));
  const completedDates = allCompletedAssessments.map((a) => parseLocalDate(a.date));

  // 다크모드 배경색
  const bgClass =
    theme === 'dark'
      ? 'min-h-screen bg-background text-foreground'
      : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50';

  return (
    <div className={bgClass}>
      {/* Sticky mobile header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-3 py-2.5 sm:px-6 sm:py-3 md:px-8">
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

          <h1 className="text-sm sm:text-base font-semibold truncate">
            {grade}학년 {classNumber}반
          </h1>

          <div className="flex items-center gap-1">
            {/* 다크모드 토글 */}
            <Button
              variant="ghost"
              size="sm"
              className="touch-manipulation px-2"
              onClick={handleToggleTheme}
              title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* 필터 버튼 */}
            <Button
              variant={selectedSubjects.length > 0 ? 'default' : 'ghost'}
              size="sm"
              className="touch-manipulation px-2"
              onClick={() => setShowFilter(!showFilter)}
            >
              <Filter className="w-4 h-4" />
              {selectedSubjects.length > 0 && (
                <span className="ml-1 text-xs">{selectedSubjects.length}</span>
              )}
            </Button>

            {notificationsEnabled && (
              <Button
                variant="ghost"
                size="sm"
                className="touch-manipulation px-2"
                onClick={handleTestNotification}
              >
                <BellRing className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant={notificationsEnabled ? 'ghost' : 'default'}
              size="sm"
              className="touch-manipulation px-2"
              onClick={handleEnableNotifications}
              disabled={notificationsEnabled}
            >
              {notificationsEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 과목 필터 패널 */}
      {showFilter && (
        <div className="border-b bg-card px-3 py-3 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                과목 필터 (예정된 수행평가만)
              </span>
              {selectedSubjects.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilter} className="text-xs h-7 px-2">
                  <X className="w-3 h-3 mr-1" />
                  초기화
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableSubjects.map((subject) => {
                const isSelected = selectedSubjects.includes(subject);
                const count = allUpcomingAssessments.filter((a) => a.subject === subject).length;
                return (
                  <Badge
                    key={subject}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`cursor-pointer touch-manipulation text-xs py-1 px-2.5 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => handleSubjectToggle(subject)}
                  >
                    {subject} ({count})
                  </Badge>
                );
              })}
            </div>
            {selectedSubjects.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-2">
                {selectedSubjects.length}개 과목 선택됨 · 예정 {upcomingAssessments.length}개 표시 중 (완료된 수행평가는 항상 표시)
              </p>
            )}
          </div>
        </div>
      )}

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
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm dark:bg-amber-950 dark:border-amber-800">
                <p className="font-semibold text-amber-800 dark:text-amber-300 mb-2">📋 설정 변경 방법:</p>
                <p className="text-amber-700 dark:text-amber-400 leading-relaxed">{getPermissionResetGuide()}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm dark:bg-blue-950 dark:border-blue-800">
                <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">💡 간단한 방법:</p>
                <ol className="text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside text-xs sm:text-sm">
                  <li>주소창 왼쪽의 <strong>🔒 자물쇠</strong> 아이콘을 탭하세요</li>
                  <li><strong>&quot;사이트 설정&quot;</strong> 또는 <strong>&quot;권한&quot;</strong>을 탭하세요</li>
                  <li><strong>&quot;알림&quot;</strong> 항목을 찾아 <strong>&quot;허용&quot;</strong>으로 변경하세요</li>
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
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 shadow-sm">
            <CardContent className="pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-6">
              <div className="flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-green-800 dark:text-green-300 min-w-0">
                  <p className="font-semibold mb-1">🔔 알림이 활성화되었습니다!</p>
                  <ul className="list-disc list-inside space-y-0.5 text-green-700 dark:text-green-400 text-[11px] sm:text-sm">
                    <li>수행평가 <strong>3일 전</strong> 알림 (오전 9시)</li>
                    <li>수행평가 <strong>1일 전</strong> 알림 (오전 9시)</li>
                    <li>수행평가 <strong>당일</strong> 알림 (오전 7시)</li>
                  </ul>
                  {pendingNotifications > 0 && (
                    <p className="mt-1.5 text-[10px] sm:text-xs text-blue-600 dark:text-blue-400">
                      📋 대기 중인 알림: {pendingNotifications}개
                    </p>
                  )}
                  {swReady ? (
                    <p className="mt-1 text-[10px] sm:text-xs text-green-600 dark:text-green-500">
                      ✅ 이 탭이 열려있으면 백그라운드에서도 알림이 전송됩니다.
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] sm:text-xs text-green-600 dark:text-green-500">
                      ✅ 이 탭이 열려있으면 알림이 전송됩니다.
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] sm:text-xs text-amber-600 dark:text-amber-400">
                    💡 30초마다 알림 시간을 확인합니다. 탭을 닫거나 브라우저를 종료하면 알림이 전송되지 않습니다.
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
                      {' '}· 완료 <strong>{completedAssessments.length}개</strong>
                    </>
                  )}
                  {selectedSubjects.length > 0 && (
                    <span className="text-blue-600 dark:text-blue-400 ml-1">
                      (필터 적용 중 - 예정만)
                    </span>
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
                  modifiersClassNames={{
                    upcoming: 'calendar-upcoming',
                    completed: 'calendar-completed',
                  }}
                />
                <div className="mt-2 flex items-center justify-center gap-4 text-[11px] sm:text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-600 font-bold text-[11px]">18</span>
                    <span>예정</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-600 font-bold text-[11px] line-through">18</span>
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
                  <div className="text-center py-6 text-muted-foreground text-sm">데이터를 불러오는 중...</div>
                ) : selectedDateAssessments.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    이 날짜에는 수행평가가 없습니다
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateAssessments.map((assessment) => {
                      const past = isPastDate(assessment.date);
                      const today = isToday(assessment.date);
                      return (
                        <AssessmentCard
                          key={assessment.id}
                          assessment={assessment}
                          past={past}
                          today={today}
                          memo={memos[assessment.id]}
                          isEditingMemo={editingMemoId === assessment.id}
                          memoText={memoText}
                          onMemoTextChange={setMemoText}
                          onEditMemo={() => handleEditMemo(assessment.id)}
                          onSaveMemo={() => handleSaveMemo(assessment.id)}
                          onCancelMemo={() => { setEditingMemoId(null); setMemoText(''); }}
                        />
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
              <div className="text-center py-6 text-muted-foreground text-sm">데이터를 불러오는 중...</div>
            ) : upcomingAssessments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">예정된 수행평가가 없습니다 🎉</div>
            ) : (
              <div className="space-y-2">
                {upcomingAssessments
                  .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
                  .map((assessment) => {
                    const today = isToday(assessment.date);
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    const daysUntil = Math.ceil(
                      (parseLocalDate(assessment.date).getTime() - todayStart.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      <Card
                        key={assessment.id}
                        className={`touch-manipulation active:scale-[0.99] transition-all ${
                          today ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/30' : ''
                        }`}
                      >
                        <CardContent className="p-3 sm:pt-5 sm:pb-4 sm:px-5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge className="text-[11px] sm:text-xs">{assessment.subject}</Badge>
                                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                  {parseLocalDate(assessment.date).toLocaleDateString('ko-KR')}
                                </span>
                                {today && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700 text-[11px] sm:text-xs"
                                  >
                                    <Clock className="w-3 h-3 mr-0.5" />
                                    오늘
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-foreground/80 dark:text-foreground/75 leading-relaxed font-medium">
                                {assessment.description}
                              </p>
                              {/* 메모 표시 */}
                              {memos[assessment.id] && editingMemoId !== assessment.id && (
                                <div
                                  className="mt-1.5 flex items-start gap-1.5 p-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 cursor-pointer"
                                  onClick={() => handleEditMemo(assessment.id)}
                                >
                                  <StickyNote className="w-3 h-3 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-[11px] sm:text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
                                    {memos[assessment.id]}
                                  </span>
                                </div>
                              )}
                              {/* 메모 편집 */}
                              {editingMemoId === assessment.id && (
                                <div className="mt-1.5 space-y-1.5">
                                  <Textarea
                                    value={memoText}
                                    onChange={(e) => setMemoText(e.target.value)}
                                    placeholder="개인 메모를 입력하세요 (예: 프린트 가져가기, USB 준비)"
                                    className="text-xs min-h-[60px] resize-none"
                                    autoFocus
                                  />
                                  <div className="flex gap-1.5">
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs px-2"
                                      onClick={() => handleSaveMemo(assessment.id)}
                                    >
                                      <Save className="w-3 h-3 mr-1" />
                                      저장
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs px-2"
                                      onClick={() => { setEditingMemoId(null); setMemoText(''); }}
                                    >
                                      취소
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {/* 메모 추가 버튼 */}
                              {!memos[assessment.id] && editingMemoId !== assessment.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[11px] px-1.5 text-muted-foreground mt-1"
                                  onClick={() => handleEditMemo(assessment.id)}
                                >
                                  <StickyNote className="w-3 h-3 mr-1" />
                                  메모 추가
                                </Button>
                              )}
                            </div>
                            {!today && (
                              <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg px-2 py-1 text-center min-w-[48px]">
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

        {/* 완료된 수행평가 (접이식) - 필터 무관하게 항상 전체 표시 */}
        {completedAssessments.length > 0 && (
          <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
            <Card className="border-green-200 dark:border-green-800 shadow-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="px-3 py-3 sm:px-6 sm:py-4 cursor-pointer touch-manipulation active:bg-green-50/50 dark:active:bg-green-950/30 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-green-700 dark:text-green-400">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        완료된 수행평가 ({completedAssessments.length}개)
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">
                        탭하여 {completedOpen ? '접기' : '펼치기'}
                      </CardDescription>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-green-600 dark:text-green-400 transition-transform duration-200 ${
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
                      .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())
                      .map((assessment) => (
                        <Card key={assessment.id} className="opacity-70 bg-green-50/30 dark:bg-green-950/20">
                          <CardContent className="p-3 sm:pt-5 sm:pb-4 sm:px-5">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-[11px] sm:text-xs"
                              >
                                {assessment.subject}
                              </Badge>
                              <span className="text-xs sm:text-sm font-medium text-muted-foreground line-through">
                                {parseLocalDate(assessment.date).toLocaleDateString('ko-KR')}
                              </span>
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700 text-[11px] sm:text-xs"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                완료
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-foreground/70 dark:text-foreground/60 leading-relaxed">
                              {assessment.description}
                            </p>
                            {memos[assessment.id] && (
                              <div className="mt-1.5 flex items-start gap-1.5 p-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                                <StickyNote className="w-3 h-3 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                <span className="text-[11px] sm:text-xs text-yellow-800 dark:text-yellow-300">
                                  {memos[assessment.id]}
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Bottom safe area */}
        <div className="h-4 sm:h-0" />
      </div>
    </div>
  );
}

// 수행평가 카드 컴포넌트 (선택된 날짜용)
function AssessmentCard({
  assessment,
  past,
  today,
  memo,
  isEditingMemo,
  memoText,
  onMemoTextChange,
  onEditMemo,
  onSaveMemo,
  onCancelMemo,
}: {
  assessment: Assessment;
  past: boolean;
  today: boolean;
  memo?: string;
  isEditingMemo: boolean;
  memoText: string;
  onMemoTextChange: (text: string) => void;
  onEditMemo: () => void;
  onSaveMemo: () => void;
  onCancelMemo: () => void;
}) {
  return (
    <Card
      className={`transition-colors ${
        past
          ? 'opacity-70 border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30'
          : today
            ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/30'
            : ''
      }`}
    >
      <CardContent className="p-3 sm:pt-5 sm:pb-4 sm:px-5">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge className="text-[11px] sm:text-xs">{assessment.subject}</Badge>
          {past && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700 text-[11px] sm:text-xs"
            >
              <CheckCircle2 className="w-3 h-3 mr-0.5" />
              완료
            </Badge>
          )}
          {today && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700 text-[11px] sm:text-xs"
            >
              <Clock className="w-3 h-3 mr-0.5" />
              오늘
            </Badge>
          )}
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed font-medium ${
          past
            ? 'text-foreground/60 dark:text-foreground/50'
            : 'text-foreground/80 dark:text-foreground/75'
        }`}>
          {assessment.description}
        </p>
        {/* 메모 표시 */}
        {memo && !isEditingMemo && (
          <div
            className="mt-1.5 flex items-start gap-1.5 p-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 cursor-pointer"
            onClick={onEditMemo}
          >
            <StickyNote className="w-3 h-3 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-[11px] sm:text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
              {memo}
            </span>
          </div>
        )}
        {/* 메모 편집 */}
        {isEditingMemo && (
          <div className="mt-1.5 space-y-1.5">
            <Textarea
              value={memoText}
              onChange={(e) => onMemoTextChange(e.target.value)}
              placeholder="개인 메모를 입력하세요 (예: 프린트 가져가기, USB 준비)"
              className="text-xs min-h-[60px] resize-none"
              autoFocus
            />
            <div className="flex gap-1.5">
              <Button size="sm" className="h-7 text-xs px-2" onClick={onSaveMemo}>
                <Save className="w-3 h-3 mr-1" />
                저장
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={onCancelMemo}>
                취소
              </Button>
            </div>
          </div>
        )}
        {/* 메모 추가 버튼 */}
        {!memo && !isEditingMemo && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] px-1.5 text-muted-foreground mt-1"
            onClick={onEditMemo}
          >
            <StickyNote className="w-3 h-3 mr-1" />
            메모 추가
          </Button>
        )}
      </CardContent>
    </Card>
  );
}