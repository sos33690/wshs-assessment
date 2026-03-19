// 개인 메모 관리 (localStorage 기반)
// 각 수행평가 ID에 대해 개인 메모를 저장

const MEMO_KEY = 'assessment-memos';

export interface MemoData {
  [assessmentId: string]: string;
}

export const getAllMemos = (): MemoData => {
  try {
    const saved = localStorage.getItem(MEMO_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // 파싱 실패 시
  }
  return {};
};

export const getMemo = (assessmentId: string): string => {
  const memos = getAllMemos();
  return memos[assessmentId] || '';
};

export const saveMemo = (assessmentId: string, memo: string): void => {
  const memos = getAllMemos();
  if (memo.trim()) {
    memos[assessmentId] = memo.trim();
  } else {
    delete memos[assessmentId];
  }
  try {
    localStorage.setItem(MEMO_KEY, JSON.stringify(memos));
  } catch {
    // localStorage 접근 불가 시
  }
};

export const deleteMemo = (assessmentId: string): void => {
  const memos = getAllMemos();
  delete memos[assessmentId];
  try {
    localStorage.setItem(MEMO_KEY, JSON.stringify(memos));
  } catch {
    // localStorage 접근 불가 시
  }
};