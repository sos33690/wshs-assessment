# Vercel 배포 가이드 📦

이 가이드는 수행평가 알림 웹사이트를 Vercel에 배포하는 방법을 단계별로 설명합니다.

---

## 🚀 방법 1: GitHub를 통한 배포 (추천)

### 사전 준비
- GitHub 계정 (없으면 https://github.com 에서 무료 가입)
- Vercel 계정 (없으면 https://vercel.com 에서 GitHub로 로그인)

### 1단계: GitHub에 코드 업로드

**1.1 GitHub에서 새 저장소 만들기**
1. https://github.com 접속 → 로그인
2. 우측 상단 "+" 클릭 → "New repository" 선택
3. 저장소 이름 입력 (예: `school-assessment`)
4. "Public" 선택 (무료)
5. "Create repository" 클릭

**1.2 로컬 코드를 GitHub에 업로드**

터미널에서 다음 명령어 실행:

```bash
# 현재 프로젝트 디렉토리로 이동
cd /workspace/shadcn-ui

# Git 초기화 (처음 한 번만)
git init

# 모든 파일 추가
git add .

# 커밋 생성
git commit -m "Initial commit: School assessment notification system"

# GitHub 저장소 연결 (YOUR_USERNAME을 본인 GitHub 아이디로 변경)
git remote add origin https://github.com/YOUR_USERNAME/school-assessment.git

# GitHub에 업로드
git branch -M main
git push -u origin main
```

### 2단계: Vercel에 배포

**2.1 Vercel에서 프로젝트 가져오기**
1. https://vercel.com 접속 → GitHub로 로그인
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 목록에서 `school-assessment` 찾기
4. "Import" 클릭

**2.2 프로젝트 설정**
1. **Framework Preset**: "Vite" (자동 감지됨)
2. **Root Directory**: `./` (기본값)
3. **Build Command**: `pnpm run build` (자동 설정됨)
4. **Output Directory**: `dist` (자동 설정됨)
5. **Install Command**: `pnpm install` (자동 설정됨)

**2.3 환경 변수 설정 (중요!)**

Firebase 설정을 환경 변수로 추가:

```
VITE_FIREBASE_API_KEY=AIzaSyB1TWCK01NxHxTC6W01_1Yrb-JfdeI-ZFs
VITE_FIREBASE_AUTH_DOMAIN=school-e54d1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=school-e54d1
VITE_FIREBASE_STORAGE_BUCKET=school-e54d1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=617634728760
VITE_FIREBASE_APP_ID=1:617634728760:web:49ae7611c5d50150d80fcd
VITE_FIREBASE_MEASUREMENT_ID=G-KZB64E930F
```

**2.4 배포 시작**
1. "Deploy" 버튼 클릭
2. 2-3분 대기 (빌드 진행)
3. 배포 완료! 🎉

**2.5 배포된 사이트 확인**
- 배포 완료 후 자동으로 생성된 URL 확인 (예: `school-assessment.vercel.app`)
- "Visit" 버튼 클릭하여 사이트 접속

---

## 🚀 방법 2: Vercel CLI를 통한 직접 배포

### 사전 준비
- Node.js 설치 (https://nodejs.org)
- Vercel 계정 (https://vercel.com)

### 1단계: Vercel CLI 설치

```bash
npm install -g vercel
```

### 2단계: Vercel 로그인

```bash
vercel login
```

- 이메일 주소 입력
- 이메일로 받은 인증 링크 클릭

### 3단계: 프로젝트 배포

```bash
# 프로젝트 디렉토리로 이동
cd /workspace/shadcn-ui

# 배포 시작
vercel
```

**질문에 답변:**
1. "Set up and deploy?"  → `Y` (Yes)
2. "Which scope?"  → 본인 계정 선택
3. "Link to existing project?"  → `N` (No)
4. "What's your project's name?"  → `school-assessment` (또는 원하는 이름)
5. "In which directory is your code located?"  → `./` (엔터)
6. "Want to override the settings?"  → `N` (No)

**배포 진행:**
- 자동으로 빌드 및 배포 진행
- 완료 후 URL 표시 (예: `https://school-assessment-xxx.vercel.app`)

### 4단계: 프로덕션 배포

```bash
vercel --prod
```

---

## 🔧 배포 후 설정

### 1. Firebase 도메인 승인

**중요!** Vercel 도메인을 Firebase에 등록해야 합니다:

1. Firebase Console → Authentication → Settings
2. "Authorized domains" 섹션 찾기
3. "Add domain" 클릭
4. Vercel에서 받은 도메인 입력 (예: `school-assessment.vercel.app`)
5. "Add" 클릭

### 2. 커스텀 도메인 연결 (선택사항)

학교 전용 도메인을 사용하려면:

1. Vercel 프로젝트 → "Settings" → "Domains"
2. 원하는 도메인 입력 (예: `assessment.school.kr`)
3. DNS 설정 안내에 따라 도메인 제공업체에서 설정
4. 완료!

---

## 📱 배포 후 테스트

### 1. 기본 기능 테스트
- [ ] 학생 페이지 접속 확인
- [ ] 학년/반 선택 확인
- [ ] 관리자 페이지 로그인 확인
- [ ] 수행평가 등록 확인
- [ ] 캘린더에 수행평가 표시 확인

### 2. 알림 기능 테스트
- [ ] 알림 권한 요청 확인
- [ ] 알림 활성화 확인
- [ ] 브라우저 알림 수신 확인

### 3. 모바일 테스트
- [ ] 스마트폰에서 접속 확인
- [ ] 반응형 디자인 확인
- [ ] 모바일 알림 확인

---

## 🔄 업데이트 방법

### GitHub를 통한 배포인 경우:

```bash
# 코드 수정 후
git add .
git commit -m "Update: 수정 내용 설명"
git push

# Vercel이 자동으로 재배포합니다!
```

### Vercel CLI를 통한 배포인 경우:

```bash
# 코드 수정 후
vercel --prod
```

---

## ❓ 문제 해결

### 빌드 실패 시
1. Vercel 대시보드 → 프로젝트 → "Deployments" → 실패한 배포 클릭
2. 로그 확인
3. 오류 메시지에 따라 수정

### Firebase 연결 오류 시
1. 환경 변수가 올바르게 설정되었는지 확인
2. Firebase 도메인이 승인되었는지 확인
3. Firebase 보안 규칙이 올바른지 확인

### 알림이 작동하지 않을 시
1. HTTPS 연결 확인 (Vercel은 자동으로 HTTPS 제공)
2. 브라우저 알림 권한 확인
3. Firebase Cloud Messaging 설정 확인

---

## 📞 추가 도움

- Vercel 공식 문서: https://vercel.com/docs
- Firebase 공식 문서: https://firebase.google.com/docs
- GitHub 도움말: https://docs.github.com

---

## 🎉 배포 완료!

축하합니다! 이제 학교에서 사용할 수 있는 수행평가 알림 시스템이 온라인에 배포되었습니다!

**배포된 사이트 URL을 학생들과 선생님들에게 공유하세요!**

예시:
- 학생용: `https://your-site.vercel.app`
- 관리자용: `https://your-site.vercel.app/admin`

**관리자 비밀번호:** `admin1234` (배포 후 변경 권장)