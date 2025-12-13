# 수행평가 알림 사이트 개발 계획

## 파일 구조
1. src/pages/Index.tsx - 학생용 메인 페이지 (학년-반 선택)
2. src/pages/StudentCalendar.tsx - 학생용 캘린더 페이지
3. src/pages/Admin.tsx - 관리자용 페이지
4. src/lib/storage.ts - localStorage 데이터 관리
5. src/lib/notification.ts - 브라우저 푸시 알림 관리
6. src/types/assessment.ts - 타입 정의
7. src/App.tsx - 라우팅 설정 (/, /calendar, /admin)
8. index.html - 타이틀 수정

## 주요 기능
- 학생용: 학년-반 선택 → 월간 캘린더 → 수행평가 표시 → 푸시 알림
- 관리자용: 비밀번호 입력 → 수행평가 등록/수정/삭제
- 데이터: localStorage 사용
- 과목: 국어, 영어, 수학, 체육, 음악, 미술, 사회, 과학, 경제수학, 기아, 생활과윤리, 사회문화, 동아시아사, 한국지리, 생명과학, 물리, 화학, 지구과학

## 구현 순서
1. 타입 정의 및 유틸리티 함수
2. 학생용 페이지 (Index, StudentCalendar)
3. 관리자용 페이지
4. 알림 시스템
5. 라우팅 및 최종 테스트