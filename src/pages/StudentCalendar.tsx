import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { Assessment } from '@/types/assessment';
import { getAssessmentsByClass } from '@/lib/firebaseStorage';
import { requestNotificationPermission, scheduleNotification } from '@/lib/notification';
import { ChevronLeft, Bell, BellOff } from 'lucide-react';
import { ko } from 'date-fns/locale';

export default function StudentCalendar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const grade = parseInt(searchParams.get('grade') || '1');
  const classNumber = parseInt(searchParams.get('class') || '1');

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
    checkNotificationPermission();
  }, [grade, classNumber]);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const data = await getAssessmentsByClass(grade, classNumber);
      setAssessments(data);
      
      // 알림이 활성화되어 있으면 새로운 수행평가에 대한 알림 스케줄링
      if (Notification.permission === 'granted') {
        data.forEach(assessment => {
          scheduleNotification(assessment);
        });
      }
    } catch (error) {
      toast.error('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationPermission = () => {
    setNotificationsEnabled(Notification.permission === 'granted');
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationsEnabled(true);
      assessments.forEach(assessment => {
        scheduleNotification(assessment);
      });
      toast.success('알림이 활성화되었습니다');
    } else {
      toast.error('알림 권한이 거부되었습니다');
    }
  };

  const getAssessmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return assessments.filter(a => a.date === dateStr);
  };

  const selectedDateAssessments = selectedDate ? getAssessmentsForDate(selectedDate) : [];

  const assessmentDates = assessments.map(a => new Date(a.date));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <Button
            variant={notificationsEnabled ? 'outline' : 'default'}
            onClick={handleEnableNotifications}
            disabled={notificationsEnabled}
          >
            {notificationsEnabled ? (
              <>
                <Bell className="w-4 h-4 mr-2" />
                알림 활성화됨
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4 mr-2" />
                알림 활성화
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{grade}학년 {classNumber}반 수행평가 일정</CardTitle>
            <CardDescription>
              {loading ? '데이터를 불러오는 중...' : `총 ${assessments.length}개의 수행평가가 예정되어 있습니다`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ko}
                  className="rounded-md border"
                  modifiers={{
                    assessment: assessmentDates
                  }}
                  modifiersStyles={{
                    assessment: {
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      color: '#3b82f6'
                    }
                  }}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  {selectedDate ? selectedDate.toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : '날짜를 선택하세요'}
                </h3>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">데이터를 불러오는 중...</div>
                ) : selectedDateAssessments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    이 날짜에는 수행평가가 없습니다
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateAssessments.map((assessment) => (
                      <Card key={assessment.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge>{assessment.subject}</Badge>
                                <span className="text-sm text-gray-500">
                                  {assessment.grade}학년 {assessment.classNumber}반
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{assessment.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>전체 수행평가 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">데이터를 불러오는 중...</div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                아직 등록된 수행평가가 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {assessments
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((assessment) => (
                    <Card key={assessment.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge>{assessment.subject}</Badge>
                              <span className="text-sm font-medium">
                                {new Date(assessment.date).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{assessment.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}