// 다크모드 테마 관리 (localStorage 기반)

const THEME_KEY = 'assessment-theme';

export type Theme = 'light' | 'dark';

export const getTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    // 시스템 설정 따르기
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {
    // localStorage 접근 불가 시
  }
  return 'light';
};

export const setTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage 접근 불가 시
  }
  applyTheme(theme);
};

export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const toggleTheme = (): Theme => {
  const current = getTheme();
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
};