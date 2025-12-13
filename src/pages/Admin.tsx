import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Assessment, SUBJECTS } from '@/types/assessment';
import { getAssessments, addAssessment, updateAssessment, deleteAssessment } from '@/lib/firebaseStorage';
import { Pencil, Trash2, LogOut } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    grade: '1',
    classNumber: '1',
    subject: SUBJECTS[0],
    date: '',
    description: ''
  });

  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadAssessments();
    }
  }, []);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const data = await getAssessments();
      setAssessments(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (error) {
      toast.error('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin1234') {
      sessionStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      loadAssessments();
      toast.success('로그인 성공!');
    } else {
      toast.error('비밀번호가 틀렸습니다');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    setPassword('');
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const assessmentData = {
        grade: parseInt(formData.grade),
        classNumber: parseInt(formData.classNumber),
        subject: formData.subject,
        date: formData.date,
        description: formData.description
      };

      if (editingId) {
        await updateAssessment(editingId, assessmentData);
        toast.success('수행평가가 수정되었습니다');
        setEditingId(null);
      } else {
        await addAssessment(assessmentData);
        toast.success('수행평가가 등록되었습니다');
      }

      setFormData({
        grade: '1',
        classNumber: '1',
        subject: SUBJECTS[0],
        date: '',
        description: ''
      });

      await loadAssessments();
    } catch (error) {
      toast.error('저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assessment: Assessment) => {
    setFormData({
      grade: assessment.grade.toString(),
      classNumber: assessment.classNumber.toString(),
      subject: assessment.subject,
      date: assessment.date,
      description: assessment.description || ''
    });
    setEditingId(assessment.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setLoading(true);
    try {
      await deleteAssessment(id);
      toast.success('수행평가가 삭제되었습니다');
      await loadAssessments();
    } catch (error) {
      toast.error('삭제에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      grade: '1',
      classNumber: '1',
      subject: SUBJECTS[0],
      date: '',
      description: ''
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>관리자 로그인</CardTitle>
            <CardDescription>수행평가를 관리하려면 로그인하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="관리자 비밀번호를 입력하세요"
                />
              </div>
              <Button type="submit" className="w-full">로그인</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">수행평가 관리</h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? '수행평가 수정' : '수행평가 등록'}</CardTitle>
            <CardDescription>
              {editingId ? '수행평가 정보를 수정하세요' : '새로운 수행평가를 등록하세요'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">학년</Label>
                  <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3].map((g) => (
                        <SelectItem key={g} value={g.toString()}>{g}학년</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classNumber">반</Label>
                  <Select value={formData.classNumber} onValueChange={(value) => setFormData({ ...formData, classNumber: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => (
                        <SelectItem key={c} value={c.toString()}>{c}반</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">과목</Label>
                  <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">날짜</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="수행평가 내용을 입력하세요"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? '처리 중...' : editingId ? '수정하기' : '등록하기'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    취소
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>등록된 수행평가 목록</CardTitle>
            <CardDescription>총 {assessments.length}개의 수행평가가 등록되어 있습니다</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && assessments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">데이터를 불러오는 중...</div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">등록된 수행평가가 없습니다</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>학년-반</TableHead>
                      <TableHead>과목</TableHead>
                      <TableHead>날짜</TableHead>
                      <TableHead>설명</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell>{assessment.grade}학년 {assessment.classNumber}반</TableCell>
                        <TableCell>{assessment.subject}</TableCell>
                        <TableCell>{new Date(assessment.date).toLocaleDateString('ko-KR')}</TableCell>
                        <TableCell>{assessment.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(assessment)}
                              disabled={loading}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(assessment.id)}
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}