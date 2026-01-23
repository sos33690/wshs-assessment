#!/bin/bash

echo "GitHub 업로드를 시작합니다..."
echo ""
echo "GitHub Personal Access Token이 필요합니다."
echo ""
echo "토큰 생성 방법:"
echo "1. https://github.com/settings/tokens 접속"
echo "2. 'Generate new token' → 'Generate new token (classic)' 클릭"
echo "3. Note: 'MGX Upload' 입력"
echo "4. Expiration: '30 days' 선택"
echo "5. 권한: 'repo' 전체 체크"
echo "6. 'Generate token' 클릭"
echo "7. 생성된 토큰 복사 (한 번만 보여집니다!)"
echo ""
echo "토큰을 입력하세요 (입력한 내용은 보이지 않습니다):"
read -s TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ 토큰이 입력되지 않았습니다."
    exit 1
fi

echo "GitHub에 업로드 중..."
git remote set-url origin https://${TOKEN}@github.com/sos33690/wshs-assessment.git
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 업로드 성공!"
    echo "GitHub 저장소: https://github.com/sos33690/wshs-assessment"
else
    echo ""
    echo "❌ 업로드 실패. 토큰이 올바른지 확인해주세요."
fi
