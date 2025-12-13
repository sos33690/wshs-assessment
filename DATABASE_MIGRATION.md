# 데이터베이스 마이그레이션 안내

## 변경 사항

기존 localStorage 기반 시스템에서 Firebase Firestore 클라우드 데이터베이스로 마이그레이션되었습니다.

## 주요 개선사항

### 이전 (localStorage)
- ❌ 각 사용자의 브라우저에만 데이터 저장
- ❌ 선생님이 등록한 수행평가를 학생들이 볼 수 없음
- ❌ 여러 선생님이 데이터를 공유할 수 없음
- ❌ 브라우저 캐시 삭제 시 데이터 손실

### 현재 (Firebase Firestore)
- ✅ 클라우드 서버에 데이터 저장
- ✅ 모든 사용자가 같은 데이터 공유
- ✅ 여러 선생님이 협력하여 관리 가능
- ✅ 데이터 영구 보존
- ✅ 실시간 동기화

## 파일 변경 내역

### 새로 추가된 파일
1. `src/lib/firebase.ts` - Firebase 초기화 설정
2. `src/lib/firebaseStorage.ts` - Firestore 데이터베이스 작업 함수
3. `FIREBASE_SETUP.md` - Firebase 설정 가이드
4. `DATABASE_MIGRATION.md` - 이 문서

### 수정된 파일
1. `src/pages/Admin.tsx` - Firebase 연동
2. `src/pages/StudentCalendar.tsx` - Firebase 연동
3. `package.json` - firebase 패키지 추가

### 삭제되지 않은 파일 (호환성 유지)
- `src/lib/storage.ts` - 기존 localStorage 함수 (백업용)

## 사용 방법

### 1단계: Firebase 설정 (필수)
`FIREBASE_SETUP.md` 파일을 참고하여 Firebase 프로젝트를 생성하고 설정하세요.

### 2단계: 구성 정보 입력
`src/lib/firebase.ts` 파일에 Firebase 구성 정보를 입력하세요.

### 3단계: 테스트
```bash
pnpm install
pnpm run dev
```

## 기능 비교

| 기능 | localStorage | Firebase |
|------|--------------|----------|
| 데이터 공유 | ❌ | ✅ |
| 영구 저장 | ❌ | ✅ |
| 실시간 동기화 | ❌ | ✅ |
| 다중 사용자 | ❌ | ✅ |
| 백업 | ❌ | ✅ |
| 비용 | 무료 | 무료 (제한 내) |

## 데이터 구조

### Firestore 컬렉션: `assessments`

```typescript
{
  id: string,              // 자동 생성
  grade: number,           // 1-3
  class: number,           // 1-10
  subject: string,         // 과목명
  date: Timestamp,         // 수행평가 날짜
  description: string      // 설명
}
```

## API 함수

### `getAssessments()`
모든 수행평가 가져오기

```typescript
const assessments = await getAssessments();
```

### `getAssessmentsByClass(grade, classNumber)`
특정 학년-반의 수행평가 가져오기

```typescript
const assessments = await getAssessmentsByClass(1, 3);
```

### `addAssessment(assessment)`
새 수행평가 추가

```typescript
await addAssessment({
  grade: 1,
  class: 3,
  subject: '수학',
  date: '2025-11-20',
  description: '중간고사'
});
```

### `updateAssessment(id, assessment)`
수행평가 수정

```typescript
await updateAssessment('assessment-id', {
  grade: 1,
  class: 3,
  subject: '수학',
  date: '2025-11-21',
  description: '중간고사 (수정)'
});
```

### `deleteAssessment(id)`
수행평가 삭제

```typescript
await deleteAssessment('assessment-id');
```

## 보안

### 현재 설정 (개발/테스트용)
- 모든 사용자가 읽기 가능
- 모든 사용자가 쓰기 가능

### 권장 설정 (운영용)
Firebase Authentication을 추가하여:
- 모든 사용자가 읽기 가능
- 인증된 관리자만 쓰기 가능

자세한 내용은 `FIREBASE_SETUP.md`의 "7. 보안 강화" 섹션을 참고하세요.

## 비용

Firebase 무료 플랜 (Spark Plan):
- Firestore: 1GB 저장공간
- 읽기: 50,000회/일
- 쓰기: 20,000회/일

**학교 프로젝트에는 충분합니다!**

예상 사용량 (학생 300명, 선생님 10명):
- 하루 읽기: ~1,000회
- 하루 쓰기: ~50회
- 무료 한도의 2% 미만

## 문제 해결

### Q: 데이터가 표시되지 않아요
A: 
1. Firebase 구성 정보가 올바른지 확인
2. Firestore 보안 규칙 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### Q: "Permission denied" 오류가 나요
A: 
1. Firebase Console → Firestore Database → 규칙
2. 읽기/쓰기 권한이 올바르게 설정되어 있는지 확인

### Q: 기존 localStorage 데이터는 어떻게 되나요?
A: 
- 기존 데이터는 각 사용자의 브라우저에 남아있습니다
- Firebase로 마이그레이션하려면 관리자가 다시 등록해야 합니다
- 자동 마이그레이션 스크립트가 필요하면 문의하세요

## 다음 단계

1. ✅ Firebase 설정 완료
2. ⏭️ Vercel 배포
3. ⏭️ PWA 기능 추가
4. ⏭️ Firebase Authentication 추가 (보안 강화)

---

궁금한 점이 있으면 언제든 문의하세요!