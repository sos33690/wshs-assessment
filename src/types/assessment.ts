export interface Assessment {
  id: string;
  grade: number; // 학년
  classNumber: number; // 반
  subject: string; // 과목
  date: string; // YYYY-MM-DD 형식
  description?: string; // 수행평가 설명
}

export const SUBJECTS = [
  '국어',
  '영어',
  '수학',
  '체육',
  '음악',
  '미술',
  '사회',
  '과학',
  '경제수학',
  '기아',
  '생활과윤리',
  '사회문화',
  '동아시아사',
  '한국지리',
  '생명과학',
  '물리',
  '화학',
  '지구과학',
] as const;

export const GRADES = [1, 2, 3] as const;
export const CLASS_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;