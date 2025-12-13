# Firebase 데이터베이스 연동 가이드

이 가이드는 수행평가 알림 사이트에 Firebase를 연동하여 모든 사용자가 같은 데이터를 공유할 수 있도록 설정하는 방법을 설명합니다.

## 1. Firebase 프로젝트 생성

### 1.1 Firebase Console 접속
1. https://console.firebase.google.com 접속
2. Google 계정으로 로그인
3. "프로젝트 추가" 클릭

### 1.2 프로젝트 설정
1. 프로젝트 이름 입력 (예: "school-assessment")
2. Google Analytics 활성화 (선택사항)
3. "프로젝트 만들기" 클릭

## 2. Firestore 데이터베이스 설정

### 2.1 Firestore 생성
1. Firebase Console에서 "Firestore Database" 메뉴 선택
2. "데이터베이스 만들기" 클릭
3. **프로덕션 모드로 시작** 선택
4. 위치 선택: `asia-northeast3 (Seoul)` 권장

### 2.2 보안 규칙 설정
Firestore Database → 규칙 탭에서 다음 규칙을 설정하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // assessments 컬렉션: 모든 사용자가 읽기 가능, 쓰기는 인증된 사용자만
    match /assessments/{document=**} {
      allow read: if true;  // 모든 사용자가 읽기 가능
      allow write: if true; // 현재는 모든 사용자가 쓰기 가능 (나중에 인증 추가 권장)
    }
  }
}
```

**주의:** 위 규칙은 개발/테스트용입니다. 실제 운영 시에는 Firebase Authentication을 추가하여 관리자만 쓰기 권한을 갖도록 설정하는 것을 권장합니다.

## 3. Firebase 웹 앱 등록

### 3.1 앱 추가
1. Firebase Console 프로젝트 설정 (⚙️ 아이콘)
2. "내 앱" 섹션에서 웹 아이콘 (</>) 클릭
3. 앱 닉네임 입력 (예: "School Assessment Web")
4. "앱 등록" 클릭

### 3.2 구성 정보 복사
Firebase SDK 구성 정보가 표시됩니다:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

이 정보를 복사해두세요!

## 4. 프로젝트에 Firebase 설정 적용

### 4.1 Firebase 구성 파일 수정
`src/lib/firebase.ts` 파일을 열고 복사한 구성 정보로 교체하세요:

```typescript
const firebaseConfig = {
  apiKey: "여기에_복사한_API_KEY",
  authDomain: "여기에_복사한_AUTH_DOMAIN",
  projectId: "여기에_복사한_PROJECT_ID",
  storageBucket: "여기에_복사한_STORAGE_BUCKET",
  messagingSenderId: "여기에_복사한_MESSAGING_SENDER_ID",
  appId: "여기에_복사한_APP_ID"
};
```

### 4.2 의존성 설치 확인
터미널에서 다음 명령어 실행:

```bash
pnpm install
```

## 5. 테스트

### 5.1 개발 서버 실행
```bash
pnpm run dev
```

### 5.2 기능 테스트
1. `/admin` 페이지에서 수행평가 등록
2. 다른 브라우저나 시크릿 모드에서 학생 페이지 접속
3. 등록한 수행평가가 보이는지 확인

### 5.3 Firebase Console에서 확인
1. Firebase Console → Firestore Database
2. `assessments` 컬렉션에 데이터가 저장되었는지 확인

## 6. 배포

### 6.1 Vercel 배포
1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 연결
3. 환경 변수 설정 (선택사항)
4. 배포 완료

### 6.2 Firebase 도메인 설정 (선택사항)
Firebase Hosting을 사용하여 배포할 수도 있습니다:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 7. 보안 강화 (권장)

실제 학교에서 사용하기 전에 다음 보안 조치를 권장합니다:

### 7.1 Firebase Authentication 추가
1. Firebase Console → Authentication → 시작하기
2. 이메일/비밀번호 인증 활성화
3. 관리자 계정 생성

### 7.2 Firestore 규칙 업데이트
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /assessments/{document=**} {
      allow read: if true;  // 모든 사용자가 읽기 가능
      allow write: if request.auth != null;  // 인증된 사용자만 쓰기 가능
    }
  }
}
```

## 8. 문제 해결

### 8.1 "Permission denied" 오류
- Firestore 보안 규칙을 확인하세요
- Firebase Console에서 규칙이 올바르게 배포되었는지 확인

### 8.2 데이터가 표시되지 않음
- 브라우저 콘솔에서 에러 메시지 확인
- Firebase 구성 정보가 올바른지 확인
- 네트워크 연결 상태 확인

### 8.3 "Firebase: Error (auth/...)" 오류
- Firebase Authentication이 활성화되어 있는지 확인
- 인증 방법이 올바르게 설정되어 있는지 확인

## 9. 비용

Firebase 무료 플랜 (Spark Plan) 제한:
- Firestore: 1GB 저장공간, 50,000 읽기/일, 20,000 쓰기/일
- 학교 프로젝트에는 충분합니다!

## 10. 지원

문제가 발생하면:
1. Firebase 공식 문서: https://firebase.google.com/docs
2. Firebase 커뮤니티: https://firebase.google.com/community
3. Stack Overflow: firebase 태그로 질문

---

## 요약

✅ Firebase 프로젝트 생성
✅ Firestore 데이터베이스 설정
✅ 보안 규칙 설정
✅ 웹 앱 등록 및 구성 정보 복사
✅ `src/lib/firebase.ts` 파일 수정
✅ 테스트 및 배포

이제 모든 선생님과 학생이 같은 데이터를 공유할 수 있습니다! 🎉