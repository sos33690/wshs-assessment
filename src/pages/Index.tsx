import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GRADES, CLASS_NUMBERS } from '@/types/assessment';
import { BookOpen, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function Index() {
  const navigate = useNavigate();
  const [grade, setGrade] = useState<number | null>(null);
  const [classNumber, setClassNumber] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    console.log('Index page mounted');
    console.log('User Agent:', navigator.userAgent);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Submit triggered', { grade, classNumber, isNavigating });
    
    if (isNavigating) {
      console.log('Already navigating, skipping...');
      return;
    }
    
    if (!grade || !classNumber) {
      console.error('Missing values:', { grade, classNumber });
      toast.error('학년과 반을 모두 선택해주세요');
      return;
    }

    try {
      setIsNavigating(true);
      console.log('Starting navigation to:', `/calendar?grade=${grade}&class=${classNumber}`);
      
      // 모바일에서 더 안정적인 네비게이션을 위해 setTimeout 사용
      setTimeout(() => {
        navigate(`/calendar?grade=${grade}&class=${classNumber}`, { replace: false });
        console.log('Navigation called');
      }, 100);
      
      toast.success('페이지 이동 중...');
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('페이지 이동 중 오류가 발생했습니다');
      setIsNavigating(false);
    }
  };

  const handleGradeChange = (value: string) => {
    const gradeNum = Number(value);
    console.log('Grade selected:', gradeNum);
    setGrade(gradeNum);
    toast.success(`${gradeNum}학년 선택됨`);
  };

  const handleClassChange = (value: string) => {
    const classNum = Number(value);
    console.log('Class selected:', classNum);
    setClassNumber(classNum);
    toast.success(`${classNum}반 선택됨`);
  };

  const isButtonDisabled = !grade || !classNumber || isNavigating;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            수행평가 알림
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            우리 반의 수행평가 일정을 확인하세요
          </p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Calendar className="w-5 h-5" />
              학년·반 선택
            </CardTitle>
            <CardDescription className="text-sm">
              자신의 학년과 반을 선택해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium block">학년</label>
                <Select 
                  onValueChange={handleGradeChange} 
                  value={grade?.toString()}
                  disabled={isNavigating}
                >
                  <SelectTrigger className="w-full touch-manipulation min-h-[44px]">
                    <SelectValue placeholder="학년을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g.toString()}>
                        {g}학년
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">반</label>
                <Select 
                  onValueChange={handleClassChange} 
                  value={classNumber?.toString()}
                  disabled={isNavigating}
                >
                  <SelectTrigger className="w-full touch-manipulation min-h-[44px]">
                    <SelectValue placeholder="반을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_NUMBERS.map((c) => (
                      <SelectItem key={c} value={c.toString()}>
                        {c}반
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={isButtonDisabled}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 touch-manipulation min-h-[48px] text-base"
                size="lg"
                onClick={handleSubmit}
              >
                {isNavigating ? '이동 중...' : '일정 확인하기'}
              </Button>
              
              {/* 디버깅 정보 표시 (개발 중에만 표시) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded">
                  <div>선택된 학년: {grade || '없음'}</div>
                  <div>선택된 반: {classNumber || '없음'}</div>
                  <div>버튼 활성화: {!isButtonDisabled ? '예' : '아니오'}</div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="link"
            onClick={() => navigate('/admin')}
            className="text-muted-foreground hover:text-foreground touch-manipulation min-h-[44px]"
            disabled={isNavigating}
          >
            관리자 페이지로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}