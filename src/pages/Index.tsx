import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GRADES, CLASS_NUMBERS } from '@/types/assessment';
import { BookOpen, Calendar, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { getTheme, toggleTheme, applyTheme, type Theme } from '@/lib/theme';

export default function Index() {
  const [grade, setGrade] = useState<number | null>(null);
  const [classNumber, setClassNumber] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const currentTheme = getTheme();
    setThemeState(currentTheme);
    applyTheme(currentTheme);
  }, []);

  const handleToggleTheme = () => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isNavigating) return;

    if (!grade || !classNumber) {
      toast.error('학년과 반을 모두 선택해주세요');
      return;
    }

    setIsNavigating(true);
    const targetUrl = `${window.location.origin}/calendar?grade=${grade}&class=${classNumber}`;

    toast.success('페이지 이동 중...', { duration: 1500 });

    try {
      window.location.href = targetUrl;
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('페이지 이동 실패. 다시 시도해주세요.');
      setIsNavigating(false);
    }
  };

  const handleGradeChange = (value: string) => {
    const gradeNum = Number(value);
    setGrade(gradeNum);
    toast.success(`${gradeNum}학년 선택됨`);
  };

  const handleClassChange = (value: string) => {
    const classNum = Number(value);
    setClassNumber(classNum);
    toast.success(`${classNum}반 선택됨`);
  };

  const handleAdminClick = () => {
    window.location.href = `${window.location.origin}/admin`;
  };

  const isButtonDisabled = !grade || !classNumber || isNavigating;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 sm:p-6">
      {/* 다크모드 토글 */}
      <div className="fixed top-4 right-4 z-10">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10 shadow-md bg-background/80 backdrop-blur-sm"
          onClick={handleToggleTheme}
          title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>

      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
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
                  <SelectTrigger className="w-full touch-manipulation min-h-[48px] text-base">
                    <SelectValue placeholder="학년을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g.toString()} className="text-base min-h-[48px]">
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
                  <SelectTrigger className="w-full touch-manipulation min-h-[48px] text-base">
                    <SelectValue placeholder="반을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_NUMBERS.map((c) => (
                      <SelectItem key={c} value={c.toString()} className="text-base min-h-[48px]">
                        {c}반
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={isButtonDisabled}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 touch-manipulation min-h-[52px] text-base font-semibold text-white"
                size="lg"
              >
                {isNavigating ? '이동 중...' : '일정 확인하기'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="link"
            onClick={handleAdminClick}
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