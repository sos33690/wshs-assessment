import { Assessment } from '@/types/assessment';

const STORAGE_KEY = 'school_assessments';
const ADMIN_PASSWORD = 'admin1234'; // 관리자 비밀번호

export const storage = {
  // 모든 수행평가 가져오기
  getAllAssessments(): Assessment[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  // 특정 학년-반의 수행평가 가져오기
  getAssessmentsByClass(grade: number, classNumber: number): Assessment[] {
    const all = this.getAllAssessments();
    return all.filter(
      (a) => a.grade === grade && a.classNumber === classNumber
    );
  },

  // 수행평가 추가
  addAssessment(assessment: Omit<Assessment, 'id'>): Assessment {
    const all = this.getAllAssessments();
    const newAssessment: Assessment = {
      ...assessment,
      id: Date.now().toString(),
    };
    all.push(newAssessment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return newAssessment;
  },

  // 수행평가 수정
  updateAssessment(id: string, updates: Partial<Assessment>): boolean {
    const all = this.getAllAssessments();
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) return false;
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return true;
  },

  // 수행평가 삭제
  deleteAssessment(id: string): boolean {
    const all = this.getAllAssessments();
    const filtered = all.filter((a) => a.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  // 관리자 비밀번호 확인
  verifyAdminPassword(password: string): boolean {
    return password === ADMIN_PASSWORD;
  },
};