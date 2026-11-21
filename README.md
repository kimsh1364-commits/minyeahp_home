# 우리집 짓는 중

모은 돈만큼 집이 지어지고, 인테리어가 채워지는 목표 시각화 앱.

- **짓는 중**: 계약금 → 잔금(외벽·내벽·창문·문) → 취득세·이사 → 인테리어 → 가구 순서로, 실제 돈 쓰는 순서대로 3D 집이 지어짐
- **완성된 모습**: 목표로 하는 완성된 집 (평면도: 전용 62.35㎡ 방3)
- 실거래가: `/api/price`가 국토부 실거래가 API로 최근 3개월 평균을 가져와 목표 금액에 자동 반영

## 실행

```bash
npm install
cp .env.example .env.local   # MOLIT_API_KEY 입력 (없으면 직접 입력한 집값 사용)
npm run dev
```

## 실거래가 API 키

공공데이터포털(data.go.kr) → "국토교통부_아파트 매매 실거래가 자료" 활용신청 → 일반 인증키(Decoding)를 `MOLIT_API_KEY`로 설정.

## 수정할 곳

- 인테리어 항목·금액: `lib/finance.ts`의 `INTERIOR`
- 기본값(시드, 대출, 월 저축): `lib/finance.ts`의 `DEFAULT_SETTINGS`
- 3D 집: `components/house/House.tsx`
