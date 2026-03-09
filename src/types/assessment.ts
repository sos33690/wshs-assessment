export interface Assessment {
  id: string;
  grade: number; // 학년
  classNumber: number; // 반
  subject: string; // 과목
  date: string; // YYYY-MM-DD 형식
  description?: string; // 수행평가 설명
}

export const SUBJECTS = [
  '영어A',
  '영어B',
  '화작A',
  '화작B',
  '수학A',
  '수학B',
  '일본 문화',
  '중국 문화',
  '사문',
  '생윤',
  '체육',
  '미술',
  '논술',
] as const;

export const GRADES = [1, 2, 3] as const;
export const CLASS_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;