import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GRADES, CLASS_NUMBERS } from '@/types/assessment';
import { BookOpen, Calendar } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const [grade, setGrade] = useState<number | null>(null);
  const [classNumber, setClassNumber] = useState<number | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (grade && classNumber) {
      console.log('Navigating with:', { grade, classNumber });
      navigate(`/calendar?grade=${grade}&class=${classNumber}`);
    } else {
      console.log('Missing values:', { grade, classNumber });
    }
  };

  const handleGradeChange = (value: string) => {
    const gradeNum = Number(value);
    console.log('Grade selected:', gradeNum);
    setGrade(gradeNum);
  };

  const handleClassChange = (value: string) => {
    const classNum = Number(value);
    console.log('Class selected:', classNum);
    setClassNumber(classNum);
  };

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
                <Select onValueChange={handleGradeChange} value={grade?.toString()}>
                  <SelectTrigger className="w-full touch-manipulation">
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
                <Select onValueChange={handleClassChange} value={classNumber?.toString()}>
                  <SelectTrigger className="w-full touch-manipulation">
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
                disabled={!grade || !classNumber}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 touch-manipulation"
                size="lg"
              >
                일정 확인하기
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="link"
            onClick={() => navigate('/admin')}
            className="text-muted-foreground hover:text-foreground touch-manipulation"
          >
            관리자 페이지로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}